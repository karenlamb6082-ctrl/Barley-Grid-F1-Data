import { Redis } from '@upstash/redis';

let client = null;

export function isRedisConfigured() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export function getRedis() {
  if (!isRedisConfigured()) return null;
  if (!client) {
    client = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
      automaticDeserialization: true,
    });
  }
  return client;
}

export async function readCurrentHotTopics() {
  const redis = getRedis();
  if (!redis) return null;
  return redis.get('f1hot:current:v2');
}

export async function writeCurrentHotTopics(data) {
  const redis = getRedis();
  if (!redis || !data) return;
  await redis.set('f1hot:current:v2', data, { ex: 12 * 60 * 60 });
}

export async function readEvaluations(keys) {
  const redis = getRedis();
  if (!redis || keys.length === 0) return keys.map(() => null);
  return redis.mget(...keys.map(key => `f1hot:evaluation:${key}`));
}

export async function writeEvaluations(entries) {
  const redis = getRedis();
  if (!redis || entries.length === 0) return;
  const pipeline = redis.pipeline();
  entries.forEach(([key, value]) => {
    pipeline.set(`f1hot:evaluation:${key}`, value, { ex: 7 * 24 * 60 * 60 });
  });
  await pipeline.exec();
}

export async function consumeAiBudget(limit = 30) {
  const redis = getRedis();
  if (!redis) return true;
  const day = new Date().toISOString().slice(0, 10);
  const key = `f1hot:ai-usage:${day}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 48 * 60 * 60);
  return count <= limit;
}

export async function writeSourceHealth(data) {
  const redis = getRedis();
  if (!redis) return;
  await redis.set('f1hot:health', data, { ex: 7 * 24 * 60 * 60 });
}

export async function readSourceHealth() {
  const redis = getRedis();
  if (!redis) return null;
  return redis.get('f1hot:health');
}
