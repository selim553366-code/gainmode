import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const ENTITLEMENT_IDENTIFIER = "forge_fit_pro";
const TOKEN_TTL_SECONDS = 10 * 60;
const REVENUECAT_CACHE_TTL_MS = 5 * 60 * 1000;
const accessCache = new Map<string, { active: boolean; expiresAt: number }>();

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function tokenSecret() {
  return process.env["AI_ACCESS_TOKEN_SECRET"] || process.env["SESSION_SECRET"] || null;
}

function accessVerificationEnabled() {
  return process.env["REVENUECAT_SERVER_VERIFICATION"] === "true"
    || process.env["NODE_ENV"] === "production";
}

function signToken(payload: { sub: string; exp: number; iat: number }) {
  const secret = tokenSecret();
  if (!secret) return null;
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function verifyToken(token: string) {
  const secret = tokenSecret();
  if (!secret) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  const expectedSignature = createHmac("sha256", secret).update(encodedPayload).digest();
  const suppliedSignature = Buffer.from(signature, "base64url");
  if (expectedSignature.length !== suppliedSignature.length || !timingSafeEqual(expectedSignature, suppliedSignature)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as { sub?: unknown; exp?: unknown; iat?: unknown };
    if (typeof payload.sub !== "string" || typeof payload.exp !== "number" || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function normalizedAppUserId(value: unknown) {
  if (typeof value !== "string") return null;
  const appUserId = value.trim();
  if (!appUserId || appUserId.length > 200 || /[\u0000-\u001F\u007F]/.test(appUserId)) return null;
  return appUserId;
}

async function hasActiveRevenueCatEntitlement(appUserId: string) {
  const now = Date.now();
  const cached = accessCache.get(appUserId);
  if (cached && cached.expiresAt > now) return cached.active;

  const apiKey = process.env["REVENUECAT_API_KEY"];
  if (!apiKey) throw new Error("RevenueCat server verification is not configured.");

  const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`, {
    headers: {
      Accept: "application/json",
      // RevenueCat REST API v1 expects the secret key directly.
      // The Bearer scheme is for the v2 API and makes a valid v1 key fail
      // with "Invalid API Key".
      Authorization: apiKey,
    },
    signal: AbortSignal.timeout(5000),
  });

  if (response.status === 404) {
    accessCache.set(appUserId, { active: false, expiresAt: now + 60_000 });
    return false;
  }
  if (!response.ok) throw new Error(`RevenueCat verification failed with ${response.status}.`);

  const payload = await response.json() as {
    subscriber?: {
      entitlements?: Record<string, { expires_date?: string | null }>;
    };
  };
  const entitlement = payload.subscriber?.entitlements?.[ENTITLEMENT_IDENTIFIER];
  const active = Boolean(entitlement && (!entitlement.expires_date || Date.parse(entitlement.expires_date) > now));
  accessCache.set(appUserId, { active, expiresAt: now + (active ? REVENUECAT_CACHE_TTL_MS : 60_000) });
  return active;
}

export async function createAiAccessToken(appUserIdValue: unknown) {
  const appUserId = normalizedAppUserId(appUserIdValue);
  if (!appUserId) return { ok: false as const, status: 400, error: "A valid RevenueCat customer ID is required." };

  if (accessVerificationEnabled()) {
    if (!process.env["REVENUECAT_API_KEY"]) {
      return { ok: false as const, status: 503, error: "Subscription verification is unavailable." };
    }
    try {
      if (!(await hasActiveRevenueCatEntitlement(appUserId))) {
        return { ok: false as const, status: 403, error: "An active GainMode subscription is required." };
      }
    } catch {
      return { ok: false as const, status: 503, error: "Subscription verification is unavailable." };
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const token = signToken({ sub: appUserId, iat: now, exp: now + TOKEN_TTL_SECONDS });
  if (!token) return { ok: false as const, status: 503, error: "AI access security is not configured." };
  return { ok: true as const, token, expiresIn: TOKEN_TTL_SECONDS };
}

export function requireAiAccess(req: Request, res: Response, next: NextFunction) {
  if (!accessVerificationEnabled()) return next();
  const authorization = req.header("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: "AI access authorization is required." });
  }
  return next();
}

export function getAiRateLimitKey(req: Request) {
  const authorization = req.header("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const verifiedToken = token ? verifyToken(token) : null;
  if (verifiedToken?.sub) return `user:${verifiedToken.sub}`;

  if (!accessVerificationEnabled()) {
    const developmentClientId = normalizedAppUserId(req.body?.clientId);
    if (developmentClientId) return `user:${developmentClientId}`;
  }

  return `ip:${clientKey(req)}`;
}

export function clientKey(req: Request) {
  return req.ip || req.socket.remoteAddress || "unknown";
}

const publicRateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

export function enforcePublicRateLimit(req: Request, res: Response, scope: string, limit: number, windowMs: number) {
  const now = Date.now();
  const key = `${scope}:${clientKey(req)}`;
  const current = publicRateLimitBuckets.get(key);
  const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
  bucket.count += 1;
  publicRateLimitBuckets.set(key, bucket);
  res.setHeader("RateLimit-Limit", limit);
  res.setHeader("RateLimit-Remaining", Math.max(0, limit - bucket.count));
  res.setHeader("RateLimit-Reset", Math.ceil(bucket.resetAt / 1000));
  if (bucket.count > limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    res.setHeader("Retry-After", retryAfterSeconds);
    res.status(429).json({ error: "Too many requests. Please try again later.", retryAfterSeconds });
    return false;
  }
  if (publicRateLimitBuckets.size > 10_000) {
    for (const [bucketKey, value] of publicRateLimitBuckets) {
      if (value.resetAt <= now) publicRateLimitBuckets.delete(bucketKey);
    }
  }
  return true;
}

export function releasePublicRateLimit(req: Request, scope: string) {
  const key = `${scope}:${clientKey(req)}`;
  const bucket = publicRateLimitBuckets.get(key);
  if (!bucket) return;
  bucket.count = Math.max(0, bucket.count - 1);
  if (bucket.count === 0) publicRateLimitBuckets.delete(key);
}