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

// 模型转换映射 —— 官方 API 目前支持 deepseek-chat 和 deepseek-reasoner
// 任何包含 v4、flash、pro、chat 等非官方或第三方的模型名，都自动安全映射为官方合法的 'deepseek-chat'
function mapModelName(modelName) {
  if (!modelName) return 'deepseek-chat';
  const name = modelName.toLowerCase();
  if (name.includes('reasoner') || name.includes('deepseek-r1')) {
    return 'deepseek-reasoner';
  }
  return 'deepseek-chat';
}

// 鲁棒的 JSON 提取器 —— 避免 LLM 在 JSON 外包裹额外的闲聊文字或 Markdown 标记
function extractJSON(text) {
  if (!text) return null;
  try {
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const jsonStr = text.substring(startIdx, endIdx + 1);
      return JSON.parse(jsonStr);
    }
  } catch (e) {
    console.error('[JSON Extract] 提取结构化数据失败:', e);
  }

  // 兜底方案
  try {
    const clean = text.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    throw new Error('无法解析 JSON 文本: ' + e.message);
  }
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
        
        // 将文章列表转换为带有序号 (0, 1, 2...) 的临时大模型载荷，根除乱码 ID 带来的翻译混淆
        const payload = {
          featured: featured.map((e, idx) => ({ id: String(idx), title: e.title, url: e.url, source: e.sourceLabel, qualityScore: e.qualityScore })),
          lowScore: lowScore.map((e, idx) => ({ id: String(featured.length + idx), title: e.title }))
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        let response;
        try {
          response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: mapModelName(process.env.DEEPSEEK_MODEL || 'deepseek-chat'),
              messages: [
                {
                  role: 'system',
                  content: `你是一个专业的 F1（一级方程式）围场资深技术分析师与新闻主编。你的任务是根据提供的一批 F1 英文热点资讯，运用你的专业知识对其进行分类与中文精炼总结，生成一份高质量的 F1 围场日报，并对所有给出的资讯标题进行高质量的中文翻译与润色。另外，你还需要对传入的精选热点（featured 列表中的文章）进行专业复审，重新评估并给它们打分。

日报包含三个板块：
1. "raceSpeed"：🏁 赛事前沿与官方重磅（规则变化、正赛及排位赛战况、官方处罚通告等）
2. "techDig"：🔧 技术解构与升级分析（车队底板升级、悬挂几何、风洞数据、空气动力学更新等）
3. "paddockVoice"：💬 围场声音与转会传闻（车手及领队采访、车手转会流言、车队收购传闻等）

【重新评估打分要求】
请针对传入的 featured 列表中的每一篇文章，根据其内容主题，重新评估并给出其以下 5 个维度的专业评分（均为 1 到 10 的整数）：
- "technicalDepth"：技术深度（如底板升级、风洞、空气动力学等高专业度探讨）
- "breakingValue"：突发指数（重大官宣、撞车事故、FIA处罚、红旗等）
- "audienceValue"：受众价值（车迷关注度、话题度等）
- "dramaIndex"：冲突戏剧性（言语交锋、争议传闻、车手八卦流言等）
- "truthfulness"：权威可信度（官方公告/Tier1媒体得高分，传闻八卦得低分）

并根据你的打分，使用加权公式计算最终的质量分 "qualityScore" (QS，为 1 到 100 之间的整数)：
QS = Math.round(((technicalDepth * 2.0) + (breakingValue * 2.5) + (audienceValue * 2.5) + (dramaIndex * 1.5) + (truthfulness * 1.5)) * 原始信源权重)
（注：信源权重如果是 T1 权威媒体请乘以 1.25，T2 乘以 0.75，其余为 1.0。若算出的 QS 超过 100 则限制为 100）。请在返回结果的 'scores' 字段中返回你的修正评估打分。

请挑选出最典型、最具代表性的 2-3 个焦点事件进行深度总结重写，作为 dailyBriefing 板块的内容。对所有传入的资讯，生成其 ID 到 中文翻译标题 的映射 translations。
输出必须严格为 JSON 格式，不能包含 any markdown 标记，结构如下：
{
  "dailyBriefing": {
    "raceSpeed": [
      { "title": "（中文总结标题）", "url": "（关联的原始 url）", "sources": ["DeepSeek-AI"], "qualityScore": 90 }
    ],
    "techDig": [ ... ],
    "paddockVoice": [ ... ]
  },
  "translations": {
    "传入文章的序号ID": "（中文翻译及润色标题）"
  },
  "scores": {
    "传入文章的序号ID": {
      "technicalDepth": 8,
      "breakingValue": 7,
      "audienceValue": 8,
      "dramaIndex": 5,
      "truthfulness": 9,
      "qualityScore": 77
    }
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
        } finally {
          clearTimeout(timeoutId);
        }

        if (response && response.ok) {
          const rawText = await response.text();
          const data = JSON.parse(rawText);
          const aiContent = data.choices?.[0]?.message?.content;
          
          if (aiContent) {
            const aiJson = extractJSON(aiContent);
            
            if (aiJson && aiJson.dailyBriefing && aiJson.translations) {
              dailyBriefing = aiJson.dailyBriefing;
              
              // 应用 AI 中文标题翻译结果
              const trans = aiJson.translations || {};
              featured.forEach((e, idx) => {
                const key = String(idx);
                if (trans[key]) e.titleCN = trans[key];
              });
              lowScore.forEach((e, idx) => {
                const key = String(featured.length + idx);
                if (trans[key]) e.titleCN = trans[key];
              });

              // 应用 AI 重新打分的评估结果覆盖
              const aiScores = aiJson.scores || {};
              featured.forEach((e, idx) => {
                const key = String(idx);
                if (aiScores[key]) {
                  const s = aiScores[key];
                  // 边界安全校验与覆盖
                  e.dimensions = {
                    technicalDepth: Math.max(1, Math.min(10, parseInt(s.technicalDepth) || e.dimensions.technicalDepth)),
                    breakingValue: Math.max(1, Math.min(10, parseInt(s.breakingValue) || e.dimensions.breakingValue)),
                    audienceValue: Math.max(1, Math.min(10, parseInt(s.audienceValue) || e.dimensions.audienceValue)),
                    dramaIndex: Math.max(1, Math.min(10, parseInt(s.dramaIndex) || e.dimensions.dramaIndex)),
                    truthfulness: Math.max(1, Math.min(10, parseInt(s.truthfulness) || e.dimensions.truthfulness)),
                  };
                  e.qualityScore = Math.max(1, Math.min(100, parseInt(s.qualityScore) || e.qualityScore));
                }
              });

              console.log('[DeepSeek] 日报生成、资讯列表汉化与五维打分评估成功！');
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
