import { createHmac, timingSafeEqual } from "crypto";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required");
  }
  return secret;
}

function encodeBase64Url(input: string) {
  return Buffer.from(input, "utf-8").toString("base64url");
}

function decodeBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf-8");
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string) {
  const payload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };

  const payloadEncoded = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(payloadEncoded);
  return `${payloadEncoded}.${signature}`;
}

export function verifySessionToken(token: string) {
  const [payloadEncoded, signature] = token.split(".");
  if (!payloadEncoded || !signature) {
    return null;
  }

  const expectedSignature = sign(payloadEncoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const decoded = JSON.parse(decodeBase64Url(payloadEncoded)) as {
      userId: string;
      exp: number;
    };

    if (!decoded.userId || !decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

