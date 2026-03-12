import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SCRYPT_PREFIX = "scrypt";
const KEYLEN = 64;

export function hashPassword(plainText: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plainText, salt, KEYLEN).toString("hex");
  return `${SCRYPT_PREFIX}$${salt}$${hash}`;
}

export function verifyPassword(plainText: string, storedHash: string) {
  const [prefix, salt, existingHash] = storedHash.split("$");
  if (!prefix || !salt || !existingHash || prefix !== SCRYPT_PREFIX) {
    return false;
  }

  const derivedHash = scryptSync(plainText, salt, KEYLEN).toString("hex");
  const existingBuffer = Buffer.from(existingHash, "hex");
  const derivedBuffer = Buffer.from(derivedHash, "hex");

  if (existingBuffer.length !== derivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(existingBuffer, derivedBuffer);
}

