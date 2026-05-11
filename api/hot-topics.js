// GET /api/hot-topics — F1 热点追踪 API
// 聚合 Reddit + RSS 源，运行热点识别引擎，返回 JSON

import { fetchRedditHot } from './lib/reddit.js';
import { fetchAllRSS } from './lib/rss-simple.js';
import { detectHotTopics } from './lib/hotspot-engine.js';

// 内存缓存（同一 serverless 实例生命周期内复用）
let _memoryCache = null;
const MEMORY_TTL = 120 * 1000; // 2 分钟内存缓存

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // 内存缓存检查
  if (_memoryCache && Date.now() - _memoryCache.time < MEMORY_TTL) {
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    res.setHeader('X-Cache', 'memory');
    return res.status(200).json(_memoryCache.data);
  }

  try {
    // 并发拉取 Reddit + RSS
    const [redditItems, rssItems] = await Promise.allSettled([
      fetchRedditHot(25),
      fetchAllRSS(),
    ]);

    const allItems = [
      ...(redditItems.status === 'fulfilled' ? redditItems.value : []),
      ...(rssItems.status === 'fulfilled' ? rssItems.value : []),
    ];

    const redditOk = redditItems.status === 'fulfilled' && redditItems.value.length > 0;
    const rssOk = rssItems.status === 'fulfilled' && rssItems.value.length > 0;

    // 如果没有任何数据
    if (allItems.length === 0) {
      // 返回缓存数据（如果有）
      if (_memoryCache) {
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=600');
        res.setHeader('X-Cache', 'stale');
        return res.status(200).json(_memoryCache.data);
      }
      return res.status(200).json({
        topics: [],
        totalItems: 0,
        sourceStatus: { reddit: false, rss: false },
        hint: '暂无数据。Reddit 需要设置 REDDIT_CLIENT_ID 和 REDDIT_CLIENT_SECRET 环境变量。',
      });
    }

    // 热点识别
    const topics = detectHotTopics(allItems, {
      threshold: 0.18,
      minSources: allItems.length < 20 ? 1 : 2, // 数据少时降低门槛
      maxTopics: 12,
    });

    const result = {
      topics,
      totalItems: allItems.length,
      sourceStatus: { reddit: redditOk, rss: rssOk },
      generatedAt: Date.now(),
    };

    // 写入内存缓存
    _memoryCache = { time: Date.now(), data: result };

    // CDN 缓存 + 允许客户端在 stale 时继续用旧数据
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    res.setHeader('X-Cache', 'fresh');
    return res.status(200).json(result);

  } catch (error) {
    console.error('hot-topics API 错误:', error);
    if (_memoryCache) {
      res.setHeader('X-Cache', 'error-fallback');
      return res.status(200).json(_memoryCache.data);
    }
    return res.status(500).json({ topics: [], error: '数据聚合失败' });
  }
}
