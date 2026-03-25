/**
 * In-memory rate limiter for API routes.
 * Tracks requests per IP within a sliding time window.
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60_000) // Clean every 60s

interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  maxAttempts: number
  /** Time window in milliseconds */
  windowMs: number
}

/**
 * Check if a request should be rate limited.
 * @returns `{ limited: true, retryAfterMs }` if blocked, `{ limited: false }` if allowed.
 */
export function rateLimit(
  identifier: string,
  options: RateLimitOptions
): { limited: boolean; retryAfterMs?: number } {
  const now = Date.now()
  const key = identifier

  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetTime) {
    // First request or window expired — start new window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + options.windowMs,
    })
    return { limited: false }
  }

  if (entry.count >= options.maxAttempts) {
    return {
      limited: true,
      retryAfterMs: entry.resetTime - now,
    }
  }

  entry.count++
  return { limited: false }
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  return req.headers.get("x-real-ip") || "unknown"
}
