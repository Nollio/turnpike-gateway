import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

export function getRedis() {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

/** @deprecated Use getRedis() for lazy initialization */
export const redis = null as unknown as Redis;
