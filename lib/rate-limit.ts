import {
  DEFAULT_RATE_LIMIT_MAX_REQUESTS,
  DEFAULT_RATE_LIMIT_WINDOW_SECONDS,
  RATE_LIMIT_PREFIX,
} from '@/lib/server.constants';
import { increaseRateLimitCounter } from '@/lib/store';

function getPositiveInt(raw: string | undefined, fallback: number): number {
  const value = Number(raw ?? fallback);

  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return Math.floor(value);
}

function getRateLimitConfig() {
  return {
    maxRequests: getPositiveInt(
      process.env.SHORTEN_RATE_LIMIT_MAX,
      DEFAULT_RATE_LIMIT_MAX_REQUESTS
    ),
    windowSeconds: getPositiveInt(
      process.env.SHORTEN_RATE_LIMIT_WINDOW_SECONDS,
      DEFAULT_RATE_LIMIT_WINDOW_SECONDS
    ),
  };
}

export async function enforceShortenRateLimit(
  identifier: string
): Promise<{ allowed: true } | { allowed: false; retryAfterSeconds: number }> {
  const { maxRequests, windowSeconds } = getRateLimitConfig();
  const scope = `${RATE_LIMIT_PREFIX}:${identifier}`;

  const currentCount = await increaseRateLimitCounter(scope, windowSeconds);

  if (currentCount > maxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: windowSeconds,
    };
  }

  return { allowed: true };
}
