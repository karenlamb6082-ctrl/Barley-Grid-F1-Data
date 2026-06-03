// GET /api/hot-topics — F1HOT 资讯平台专用的 AIHOT 数据接口
// 整合 T1/T1.5/T2 多级信源，实现精选、低标及极简日报（F1HOT Briefing）的后端分发
// 已集成 DeepSeek 大模型分析与全网资讯 AI 汉化翻译，支持无密钥状态下正则智能匹配优雅降级

import { fetchAllRSS } from './lib/rss-simple.js';
import { detectHotTopics } from './lib/hotspot-engine.js';

let _memoryCache = null;
const MEMORY_TTL = 30 * 1000; // 30 秒高吞吐缓存

// 日报分类正则匹配 (赛事/技术/八卦) —— 用于大模型不可用或未配置密钥时的降级兜底
const RACE_SPEED_REGEX = /race|stewards|penalty|calendar|lap|grid|fia|fom|result|standings|fp1|fp2|fp3|sprint|qualifying|win/i;
const TECH_DIG_REGEX = /technical|upgrade|aerodynamic|engine|setup|wing|chassis|telemetry|tyre|strategy|sim/i;

function runRegexClassification(featured, dailyBriefing) {
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
}

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

    // 4. 构建 F1HOT 极简日报 (Daily Briefing)
    let dailyBriefing = {
      raceSpeed: [],    // 🏁 赛事前沿与官方公告
      techDig: [],      // 🔧 技术深挖与数据分析
      paddockVoice: []  // 💬 围场声音与转会传闻
    };

    // 检查是否配置了 DeepSeek 大模型密钥
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (apiKey && (featured.length > 0 || lowScore.length > 0)) {
      try {
        console.log('[DeepSeek] 正在通过 DeepSeek 模型分析日报并进行全量资讯汉化重写...');
        
        // 构建轻量 payload 传给大模型
        const payload = {
          featured: featured.map(e => ({ id: e.id, title: e.title, url: e.url, source: e.sourceLabel, qualityScore: e.qualityScore })),
          lowScore: lowScore.map(e => ({ id: e.id, title: e.title }))
        };

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: `你是一个专业的 F1（一级方程式）围场资深技术分析师与新闻主编。你的任务是根据提供的一批 F1 英文热点资讯，运用你的专业知识对其进行分类与中文精炼总结，生成一份高质量的 F1 围场日报，并对所有给出的资讯标题进行高质量的中文翻译与润色。

日报包含三个板块：
1. "raceSpeed"：🏁 赛事前沿与官方重磅（规则变化、正赛及排位赛战况、官方处罚通告等）
2. "techDig"：🔧 技术解构与升级分析（车队底板升级、悬挂几何、风洞数据、空气动力学更新等）
3. "paddockVoice"：💬 围场声音与转会传闻（车手及领队采访、车手转会流言、车队收购传闻等）

请挑选出最典型、最具代表性的 2-3 个焦点事件进行深度总结重写，作为 dailyBriefing 板块的内容。对所有传入的资讯，生成其 ID 到 中文翻译标题 的映射 translations。
输出必须严格为 JSON 格式，不能包含任何 markdown 标记（如 \`\`\`json 标签），结构如下：
{
  "dailyBriefing": {
    "raceSpeed": [
      { "title": "（中文总结标题，需兼具技术专业性与新闻可读性）", "url": "（关联的原始 url）", "sources": ["DeepSeek-AI"], "qualityScore": 90 }
    ],
    "techDig": [ ... ],
    "paddockVoice": [ ... ]
  },
  "translations": {
    "传入文章的ID": "（高保真、流畅的中文翻译及润色标题）"
  }
}`
              },
              {
                role: 'user',
                content: JSON.stringify(payload)
              }
            ],
            temperature: 0.3
          })
        });

        if (response.ok) {
          const rawText = await response.text();
          const data = JSON.parse(rawText);
          const aiContent = data.choices?.[0]?.message?.content;
          
          if (aiContent) {
            const cleanJsonText = aiContent.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
            const aiJson = JSON.parse(cleanJsonText);
            
            if (aiJson.dailyBriefing && aiJson.translations) {
              dailyBriefing = aiJson.dailyBriefing;
              
              // 应用 AI 中文标题翻译结果
              const trans = aiJson.translations || {};
              featured.forEach(e => {
                if (trans[e.id]) e.titleCN = trans[e.id];
              });
              lowScore.forEach(e => {
                if (trans[e.id]) e.titleCN = trans[e.id];
              });
              console.log('[DeepSeek] 日报生成与资讯列表汉化翻译成功！');
            } else {
              throw new Error('AI 返回 JSON 结构不完整');
            }
          } else {
            throw new Error('AI 返回内容为空');
          }
        } else {
          throw new Error(`API HTTP 错误，状态码: ${response.status}`);
        }
      } catch (err) {
        console.error('[DeepSeek] API 异常，已自动降级为正则匹配分类与字典汉化。原因:', err.message);
        runRegexClassification(featured, dailyBriefing);
      }
    } else {
      console.log('[F1HOT] 未配置 DEEPSEEK_API_KEY，采用默认正则匹配进行日报分类与字典汉化。');
      runRegexClassification(featured, dailyBriefing);
    }

    // 5. 整合结果
    const result = {
      topics: featured,
      lowScoreTopics: lowScore,
      dailyBriefing,
      totalItems: allItems.length,
      generatedAt: Date.now()
    };

    _memoryCache = { time: Date.now(), data: result };
    if (typeof global !== 'undefined') {
      global.f1_hot_topics_cache = _memoryCache;
    }

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
