import { Context, Next } from 'hono';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store; resets on worker cold start (acceptable for Cloudflare Workers)
const store = new Map<string, RateLimitEntry>();

function checkLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

function getIp(c: Context): string {
  return c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For') ?? 'unknown';
}

/**
 * 10 requests per minute for post creation
 */
export function postCreationRateLimit(c: Context, next: Next): Promise<Response | void> {
  const ip = getIp(c);
  const key = `post_create:${ip}`;

  if (!checkLimit(key, 10, 60_000)) {
    return Promise.resolve(
      c.json({ success: false, error: 'Too many requests — slow down lah!' }, 429) as Response
    );
  }

  return next();
}

/**
 * 20 requests per minute for comments
 */
export function commentRateLimit(c: Context, next: Next): Promise<Response | void> {
  const ip = getIp(c);
  const key = `comment:${ip}`;

  if (!checkLimit(key, 20, 60_000)) {
    return Promise.resolve(
      c.json({ success: false, error: 'Too many comments — give it a minute!' }, 429) as Response
    );
  }

  return next();
}

/**
 * 3 community creations per hour per user
 */
export function communityCreationRateLimit(c: Context, next: Next): Promise<Response | void> {
  const userId = (c as any).get?.('userId') as string | undefined;
  const key = `community_create:${userId ?? getIp(c)}`;

  if (!checkLimit(key, 3, 3_600_000)) {
    return Promise.resolve(
      c.json({ success: false, error: 'Too many communities created — try again later' }, 429) as Response
    );
  }

  return next();
}
