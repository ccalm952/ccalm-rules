const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*_-+=?";

export interface PasswordOptions {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
}

export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  length: 20,
  lower: true,
  upper: true,
  digits: true,
  symbols: true,
};

function randomIndex(max: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]! % max;
}

function pickChar(chars: string): string {
  return chars[randomIndex(chars.length)]!;
}

/** 用 Web Crypto 生成随机密码，并保证每类已启用字符至少出现一次 */
export function generatePassword(options: PasswordOptions): string {
  const length = Math.min(128, Math.max(4, Math.floor(options.length)));
  const pools: string[] = [];
  if (options.lower) pools.push(LOWER);
  if (options.upper) pools.push(UPPER);
  if (options.digits) pools.push(DIGITS);
  if (options.symbols) pools.push(SYMBOLS);

  if (pools.length === 0) {
    throw new Error("请至少选择一种字符类型");
  }

  const all = pools.join("");
  const chars: string[] = pools.map((pool) => pickChar(pool));

  while (chars.length < length) {
    chars.push(pickChar(all));
  }

  // Fisher–Yates
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }

  return chars.join("");
}
