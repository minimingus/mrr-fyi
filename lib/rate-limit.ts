import { NextRequest, NextResponse } from "next/server";

interface SlidingWindowEntry {
  timestamps: number[];
}

const stores = new Map<string, Map<string, SlidingWindowEntry>>();

function getStore(key: string): Map<string, SlidingWindowEntry> {
  let store = stores.get(key);
  if (!store) {
    store = new Map();
    stores.set(key, store);
  }
  return store;
}

interface RateLimitConfig {
  /** Unique key for this limiter (e.g. "submit", "update") */
  key: string;
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSec: number;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Sliding-window IP-based rate limiter.
 * Returns null if allowed, or a 429 Response if rate limited.
 */
export function rateLimit(
  req: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const ip = getClientIp(req);
  const store = getStore(config.key);
  const now = Date.now();
  const windowMs = config.windowSec * 1000;

  let entry = store.get(ip);

  if (!entry) {
    entry = { timestamps: [] };
    store.set(ip, entry);
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= config.limit) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfter = Math.ceil((oldestInWindow + windowMs - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(config.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil((oldestInWindow + windowMs) / 1000)),
        },
      }
    );
  }

  entry.timestamps.push(now);

  return null;
}
