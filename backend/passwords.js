import { createHash, timingSafeEqual } from "node:crypto";

export function createPasswordHash(password) {
  const digest = createHash("sha256").update(password, "utf8").digest();
  return { hash: digest.toString("hex") };
}

export function verifyPassword(password, hashText) {
  try {
    const expected = Buffer.from(hashText, "hex");
    if (expected.length !== 32) return false;
    const actual = createHash("sha256").update(password, "utf8").digest();
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function passwordPolicy(password) {
  return (
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}
