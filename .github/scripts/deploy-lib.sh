#!/usr/bin/env bash
# GitHub Actions 专用部署公共逻辑（勿在 Cursor Agent 中调用）。

set -euo pipefail

DEPLOY_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ROOT_DIR="$(cd "$DEPLOY_LIB_DIR/../.." && pwd)"

DEPLOY_KEY_PATH="${DEPLOY_SSH_KEY_PATH:-${HOME}/.ssh/ccalm_deploy}"
DEPLOY_TARGET="${DEPLOY_SSH_TARGET:-${DEPLOY_SSH_USER:-root}@${DEPLOY_SSH_HOST:-106.53.206.11}}"
DEPLOY_PROJECT_DIR="${DEPLOY_PROJECT_DIR:-/opt/ccalm-rules}"
DEPLOY_WEB_ROOT="${DEPLOY_WEB_ROOT:-/opt/1panel/www/sites/rules.ccalm.xyz/index}"
DEPLOY_GIT_REMOTE="${DEPLOY_GIT_REMOTE:-https://github.com/ccalm952/ccalm-rules}"
DEPLOY_GIT_BRANCH="${DEPLOY_GIT_BRANCH:-main}"
DEPLOY_API_HEALTH_URL="${DEPLOY_API_HEALTH_URL:-http://127.0.0.1:3002/api/health}"
DEPLOY_PM2_APP="${DEPLOY_PM2_APP:-rules-api}"

deploy_setup_ssh() {
  if [[ ! -f "$DEPLOY_KEY_PATH" ]]; then
    echo "缺少部署密钥 ${DEPLOY_KEY_PATH}。请在 GitHub Secrets 配置 DEPLOY_SSH_KEY。" >&2
    exit 1
  fi
  DEPLOY_TARGET="${DEPLOY_SSH_TARGET:-${DEPLOY_SSH_USER:-root}@${DEPLOY_SSH_HOST:-106.53.206.11}}"
}

deploy_ssh_opts() {
  DEPLOY_SSH_OPTS=(
    -i "$DEPLOY_KEY_PATH"
    -o IdentitiesOnly=yes
    -o BatchMode=yes
    -o StrictHostKeyChecking=accept-new
  )
}

deploy_ssh() {
  deploy_ssh_opts
  ssh "${DEPLOY_SSH_OPTS[@]}" "$DEPLOY_TARGET" "$@"
}

deploy_expected_sha() {
  if [[ -n "${DEPLOY_EXPECTED_SHA:-}" ]]; then
    printf '%s\n' "$DEPLOY_EXPECTED_SHA"
    return
  fi
  if [[ -n "${GITHUB_SHA:-}" ]]; then
    printf '%s\n' "$GITHUB_SHA"
    return
  fi
  git -C "$DEPLOY_ROOT_DIR" rev-parse HEAD
}

deploy_remote_pull() {
  local expected_sha="$1"
  deploy_ssh "set -euo pipefail
cd ${DEPLOY_PROJECT_DIR}
git fetch ${DEPLOY_GIT_REMOTE} ${DEPLOY_GIT_BRANCH}
git checkout -B ${DEPLOY_GIT_BRANCH} FETCH_HEAD
git reset --hard ${expected_sha}
echo \"remote HEAD=\$(git rev-parse HEAD)\"
"
}

deploy_verify_remote_sha() {
  local expected_sha="$1"
  local remote_sha
  remote_sha="$(deploy_ssh "cd ${DEPLOY_PROJECT_DIR} && git rev-parse HEAD")"
  remote_sha="${remote_sha//$'\r'/}"
  if [[ "$remote_sha" != "$expected_sha" ]]; then
    echo "版本校验失败：服务器 HEAD=${remote_sha}，期望=${expected_sha}" >&2
    exit 1
  fi
  echo "版本校验通过：${remote_sha}"
}

deploy_write_version_stamp() {
  local expected_sha="$1"
  local mode="$2"
  deploy_ssh "set -euo pipefail
mkdir -p ${DEPLOY_WEB_ROOT}
cat > ${DEPLOY_WEB_ROOT}/deploy-version.json <<EOF
{
  \"sha\": \"${expected_sha}\",
  \"mode\": \"${mode}\",
  \"deployedAt\": \"\$(date -Is)\"
}
EOF
"
}

deploy_healthcheck_api() {
  local code=""
  local attempt
  for attempt in 1 2 3 4 5; do
    code="$(deploy_ssh "curl -s -o /dev/null -w '%{http_code}' ${DEPLOY_API_HEALTH_URL} || true")"
    code="${code//$'\r'/}"
    # /api/health 无密码时返回 401，说明进程已起来
    if [[ "$code" == "401" || "$code" == "200" ]]; then
      echo "API 健康检查通过：HTTP ${code}"
      return 0
    fi
    echo "API 健康检查未就绪（第 ${attempt} 次）：HTTP ${code:-000}，等待重试…"
    sleep 2
  done
  echo "API 健康检查失败：${DEPLOY_API_HEALTH_URL} -> HTTP ${code:-000}" >&2
  deploy_ssh "pm2 logs ${DEPLOY_PM2_APP} --lines 30 --nostream" || true
  exit 1
}

deploy_classify_scope() {
  local has_web=0
  local has_api=0
  local has_other=0
  local path

  while IFS= read -r path || [[ -n "$path" ]]; do
    [[ -z "$path" ]] && continue
    case "$path" in
      rules-web/*|rules-web)
        has_web=1
        ;;
      rules-api/*|rules-api)
        has_api=1
        ;;
      .github/workflows/*|.github/scripts/*)
        has_api=1
        has_web=1
        ;;
      README.md|.cursor/*|.gitignore|*.yaml|*.yml|rename.js|fake_ip_filter.list|.editorconfig)
        ;;
      *)
        has_other=1
        ;;
    esac
  done

  if (( has_api && has_web )); then
    echo all
  elif (( has_api )); then
    echo api
  elif (( has_web )); then
    echo web
  elif (( has_other )); then
    echo all
  else
    echo none
  fi
}

deploy_changed_files_between() {
  local before_sha="$1"
  local after_sha="$2"
  if [[ -z "$before_sha" || "$before_sha" =~ ^0+$ ]]; then
    printf 'rules-api/\nrules-web/\n'
    return
  fi
  if ! git -C "$DEPLOY_ROOT_DIR" cat-file -e "${before_sha}^{commit}" 2>/dev/null; then
    printf 'rules-api/\nrules-web/\n'
    return
  fi
  git -C "$DEPLOY_ROOT_DIR" diff --name-only "${before_sha}" "${after_sha}"
}

deploy_remote_api() {
  deploy_ssh "set -euo pipefail
cd ${DEPLOY_PROJECT_DIR}/rules-api
npm ci || npm install
npx prisma generate
npx prisma migrate deploy
rm -rf dist
npm run build
test -f dist/index.js
pm2 restart ${DEPLOY_PM2_APP}
pm2 save
"
}

deploy_remote_web() {
  deploy_ssh "set -euo pipefail
cd ${DEPLOY_PROJECT_DIR}/rules-web
npm ci || npm install
npm run build
test -f dist/index.html
mkdir -p ${DEPLOY_WEB_ROOT}
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete dist/ ${DEPLOY_WEB_ROOT}/
else
  rm -rf ${DEPLOY_WEB_ROOT}/*
  cp -r dist/* ${DEPLOY_WEB_ROOT}/
fi
"
}

deploy_run_web() {
  local expected_sha="$1"
  echo "部署前端（期望 SHA=${expected_sha}）"
  deploy_remote_pull "$expected_sha"
  deploy_verify_remote_sha "$expected_sha"
  deploy_remote_web
  deploy_write_version_stamp "$expected_sha" "web"
  echo "deploy-web ok: $(date -Is) sha=${expected_sha}"
}

deploy_run_api() {
  local expected_sha="$1"
  echo "部署后端（期望 SHA=${expected_sha}）"
  deploy_remote_pull "$expected_sha"
  deploy_verify_remote_sha "$expected_sha"
  deploy_remote_api
  deploy_healthcheck_api
  deploy_write_version_stamp "$expected_sha" "api"
  echo "deploy-api ok: $(date -Is) sha=${expected_sha}"
}

deploy_run_all() {
  local expected_sha="$1"
  echo "全量部署（期望 SHA=${expected_sha}）"
  deploy_remote_pull "$expected_sha"
  deploy_verify_remote_sha "$expected_sha"
  deploy_remote_api
  deploy_healthcheck_api
  deploy_remote_web
  deploy_write_version_stamp "$expected_sha" "all"
  echo "deploy-all ok: $(date -Is) sha=${expected_sha}"
}
