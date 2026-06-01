// GET /api/hot-topics — F1 热点追踪 API
// 通过 RSS 聚合 Reddit + F1 媒体源，运行热点识别引擎

import { fetchAllRSS } from './lib/rss-simple.js';
import { detectHotTopics } from './lib/hotspot-engine.js';

let _memoryCache = null;
const MEMORY_TTL = 30 * 1000; // 30 秒缓存，大幅提效

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (_memoryCache && Date.now() - _memoryCache.time < MEMORY_TTL) {
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    res.setHeader('X-Cache', 'memory');
    return res.status(200).json(_memoryCache.data);
  }

  try {
    const allItems = await fetchAllRSS();

    if (allItems.length === 0) {
      if (_memoryCache) {
        res.setHeader('X-Cache', 'stale');
        return res.status(200).json(_memoryCache.data);
      }
      return res.status(200).json({ topics: [], totalItems: 0 });
    }

    const topics = detectHotTopics(allItems, {
      threshold: 0.18,
      minSources: allItems.length < 20 ? 1 : 2,
      maxTopics: 12,
    });

    const result = { topics, totalItems: allItems.length, generatedAt: Date.now() };
    _memoryCache = { time: Date.now(), data: result };

    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    res.setHeader('X-Cache', 'fresh');
    return res.status(200).json(result);

  } catch (error) {
    console.error('hot-topics error:', error);
    if (_memoryCache) {
      res.setHeader('X-Cache', 'error-fallback');
      return res.status(200).json(_memoryCache.data);
    }
    return res.status(500).json({ topics: [], error: 'aggregation failed' });
  }
}
