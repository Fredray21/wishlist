import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export function generateCode(): string {
  return randomInt(0, 10_000).toString().padStart(4, "0");
}

export function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashCode(itemId: string, code: string): string {
  return createHash("sha256").update(`code:${itemId}:${code}`).digest("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(`token:${token}`).digest("hex");
}

export function matchesHash(hash: string, expected: string): boolean {
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isValidCode(code: unknown): code is string {
  return typeof code === "string" && /^\d{4}$/.test(code);
}
