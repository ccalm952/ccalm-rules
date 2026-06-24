import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`缺少环境变量: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  adminPassword: required("ADMIN_PASSWORD"),
  githubToken: required("GITHUB_TOKEN"),
  databaseUrl: process.env.DATABASE_URL ?? "file:./dev.db",
  githubOwner: process.env.GITHUB_OWNER ?? "ccalm952",
  githubRepo: process.env.GITHUB_REPO ?? "ccalm-rules",
  githubBranch: process.env.GITHUB_BRANCH ?? "main",
};
