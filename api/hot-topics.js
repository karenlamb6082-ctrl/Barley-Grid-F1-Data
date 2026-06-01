// GET /api/hot-topics — F1HOT 资讯平台专用的 AIHOT 数据接口
// 整合 T1/T1.5/T2 多级信源，实现精选、低标及极简日报（F1HOT Briefing）的后端分发

import { fetchAllRSS } from './lib/rss-simple.js';
import { detectHotTopics } from './lib/hotspot-engine.js';

let _memoryCache = null;
const MEMORY_TTL = 30 * 1000; // 30 秒高吞吐缓存

// 日报分类正则匹配 (赛事/技术/八卦)
const RACE_SPEED_REGEX = /race|stewards|penalty|calendar|lap|grid|fia|fom|result|standings|fp1|fp2|fp3|sprint|qualifying|win/i;
const TECH_DIG_REGEX = /technical|upgrade|aerodynamic|engine|setup|wing|chassis|telemetry|tyre|strategy|sim/i;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // 1. 读取内存缓存，防刷提速
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
      return res.status(200).json({ topics: [], lowScoreTopics: [], dailyBriefing: { raceSpeed: [], techDig: [], paddockVoice: [] }, totalItems: 0 });
    }

    // 2. 运行 F1HOT 聚类和打分引擎，获取多源合并后的全部事件
    const allEvents = detectHotTopics(allItems, {
      threshold: 0.28,
      maxTopics: 50 // 拉取足够多的事件以便拆分精选和低标
    });

    // 3. 拆分“精选热点 (Score >= 60)”与“低标博文 (30 <= Score < 60)”
    const featured = allEvents.filter(e => e.qualityScore >= 60).slice(0, 12);
    const lowScore = allEvents.filter(e => e.qualityScore < 60 && e.qualityScore >= 30).slice(0, 15);

    // 4. 自动分发并归类构建 F1HOT 极简日报 (Daily Briefing)
    const dailyBriefing = {
      raceSpeed: [],    // 🏁 赛事前沿与官方公告
      techDig: [],      // 🔧 技术深挖与数据分析
      paddockVoice: []  // 💬 围场声音与转会传闻
    };

    featured.forEach(event => {
      const title = event.title;
      if (RACE_SPEED_REGEX.test(title)) {
        dailyBriefing.raceSpeed.push(event);
      } else if (TECH_DIG_REGEX.test(title)) {
        dailyBriefing.techDig.push(event);
      } else {
        dailyBriefing.paddockVoice.push(event);
      }
    });

    // 5. 整合结果
    const result = {
      topics: featured,
      lowScoreTopics: lowScore,
      dailyBriefing,
      totalItems: allItems.length,
      generatedAt: Date.now()
    };

    _memoryCache = { time: Date.now(), data: result };

    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    res.setHeader('X-Cache', 'fresh');
    return res.status(200).json(result);

  } catch (error) {
    console.error('hot-topics API 故障:', error);
    if (_memoryCache) {
      res.setHeader('X-Cache', 'error-fallback');
      return res.status(200).json(_memoryCache.data);
    }
    return res.status(500).json({ topics: [], lowScoreTopics: [], dailyBriefing: { raceSpeed: [], techDig: [], paddockVoice: [] }, error: 'aggregation failed' });
  }
}
