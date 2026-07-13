// GET /api/hot-topics — F1HOT 资讯平台专用的 AIHOT 数据接口
// 整合 T1/T1.5/T2 多级信源，实现精选、低标及极简日报（F1HOT Briefing）的后端分发
// 已集成 DeepSeek 大模型分析与全网资讯 AI 汉化翻译，支持无密钥状态下正则智能匹配优雅降级

import { fetchAllRSSWithHealth } from './lib/rss-simple.js';
import { detectHotTopics } from './lib/hotspot-engine.js';
import { createHash, timingSafeEqual } from 'node:crypto';
import {
  consumeAiBudget,
  readCurrentHotTopics,
  readEvaluations,
  writeCurrentHotTopics,
  writeEvaluations,
  writeSourceHealth,
} from './lib/redis.js';

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

const INFORMATION_TYPES = new Set(['official', 'reported', 'rumour', 'opinion', 'community']);
const CATEGORIES = new Set(['raceSpeed', 'techDig', 'paddockVoice']);

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}

function getTimeliness(ageMinutes) {
  if (ageMinutes <= 60) return 5;
  if (ageMinutes <= 180) return 4;
  if (ageMinutes <= 720) return 3;
  if (ageMinutes <= 1440) return 2;
  return 1;
}

function buildEvidencePackage(event, id) {
  return {
    id,
    sourceCount: event.sourceCount,
    reportCount: event.itemCount,
    totalComments: event.totalComments,
    ageMinutes: event.ageMinutes,
    localSignals: event.dimensions,
    reports: (event.relatedItems || []).slice(0, 4).map(item => ({
      title: item.title,
      summary: item.description || '',
      source: item.source,
      sourceTier: item.tier,
      publishedAt: item.publishedAt,
      score: item.score,
      comments: item.comments,
      url: item.url,
    })),
  };
}

function applyEditorialEvaluation(event, evaluation = {}) {
  const importance = clampNumber(evaluation.importance, 1, 5, Math.ceil((event.dimensions.breakingValue || 5) / 2));
  const confidence = clampNumber(evaluation.confidence, 1, 5, Math.ceil((event.dimensions.truthfulness || 5) / 2));
  const timeliness = getTimeliness(event.ageMinutes);
  const sourceStrength = Math.min(5, 1 + Math.max(0, event.sourceCount - 1) * 2);
  const communityHeat = Math.min(5, Math.max(1, Math.ceil(Math.log10((event.totalComments || 0) + 1) * 2)));
  const valueScore = Math.round(
    (importance / 5) * 35 +
    (confidence / 5) * 25 +
    (timeliness / 5) * 15 +
    (sourceStrength / 5) * 15 +
    (communityHeat / 5) * 10
  );

  return {
    ...event,
    titleCN: typeof evaluation.titleCN === 'string' ? evaluation.titleCN.trim().slice(0, 100) : event.titleCN,
    whatHappened: typeof evaluation.whatHappened === 'string' ? evaluation.whatHappened.trim().slice(0, 240) : '',
    whyItMatters: typeof evaluation.whyItMatters === 'string' ? evaluation.whyItMatters.trim().slice(0, 240) : '',
    confidenceReason: typeof evaluation.confidenceReason === 'string' ? evaluation.confidenceReason.trim().slice(0, 220) : '',
    informationType: INFORMATION_TYPES.has(evaluation.informationType) ? evaluation.informationType : 'reported',
    category: CATEGORIES.has(evaluation.category) ? evaluation.category : 'paddockVoice',
    importance,
    confidence,
    timeliness,
    valueScore,
    qualityScore: valueScore,
    confirmedFacts: Array.isArray(evaluation.confirmedFacts) ? evaluation.confirmedFacts.slice(0, 3).map(String) : [],
    unconfirmedClaims: Array.isArray(evaluation.unconfirmedClaims) ? evaluation.unconfirmedClaims.slice(0, 3).map(String) : [],
    tags: Array.isArray(evaluation.tags) ? evaluation.tags.slice(0, 5).map(String) : [],
    evaluationVersion: 'v2',
  };
}

function buildDailyBriefing(events) {
  const briefing = { raceSpeed: [], techDig: [], paddockVoice: [] };
  events.forEach(event => {
    // 日报是中文编辑产品。尚未完成 AI 中文审校的事件继续留在热点流，
    // 但不进入日报，避免把英文原始标题直接冒充成中文日报。
    if (!event.titleCN) return;
    const key = CATEGORIES.has(event.category) ? event.category : 'paddockVoice';
    if (briefing[key].length < 3) briefing[key].push(event);
  });
  return briefing;
}

function dedupeEvaluatedEvents(events) {
  const groups = new Map();
  events.forEach(event => {
    const normalizedTitle = String(event.titleCN || event.title)
      .toLowerCase()
      .replace(/[\s\p{P}\p{S}]+/gu, '');
    const existing = groups.get(normalizedTitle);
    if (!existing) {
      groups.set(normalizedTitle, { ...event, relatedItems: [...(event.relatedItems || [])] });
      return;
    }

    const primary = existing.valueScore >= event.valueScore ? existing : event;
    const secondary = primary === existing ? event : existing;
    const relatedItems = [...(primary.relatedItems || []), ...(secondary.relatedItems || [])]
      .filter((item, index, list) => list.findIndex(candidate => candidate.url === item.url) === index);
    groups.set(normalizedTitle, {
      ...primary,
      sources: [...new Set([...(primary.sources || []), ...(secondary.sources || [])])],
      sourceTypes: [...new Set([...(primary.sourceTypes || []), ...(secondary.sourceTypes || [])])],
      relatedItems,
      sourceCount: new Set([...(primary.sources || []), ...(secondary.sources || [])]).size,
      itemCount: relatedItems.length,
      totalComments: (primary.totalComments || 0) + (secondary.totalComments || 0),
      ageMinutes: Math.min(primary.ageMinutes, secondary.ageMinutes),
      firstSeenAgeMinutes: Math.max(primary.firstSeenAgeMinutes || 0, secondary.firstSeenAgeMinutes || 0),
    });
  });
  return [...groups.values()];
}

function getEvaluationHash(event) {
  const evidence = buildEvidencePackage(event, '');
  delete evidence.id;
  return createHash('sha256').update(JSON.stringify(evidence)).digest('hex').slice(0, 32);
}

function hasValidJobSecret(req) {
  const expected = process.env.F1HOT_JOB_SECRET;
  const supplied = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!expected || !supplied) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const isRefreshJob = String(req.query?.refresh || '') === '1';
  if (isRefreshJob && !hasValidJobSecret(req)) {
    return res.status(401).json({ error: 'Unauthorized refresh request' });
  }

  // 普通访问只读取后台生成的快照；Redis 未就绪时继续走旧链路，保证平滑迁移。
  if (!isRefreshJob) {
    try {
      const persisted = await readCurrentHotTopics();
      if (persisted?.topics) {
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=180');
        res.setHeader('X-Cache', 'redis');
        return res.status(200).json(persisted);
      }
    } catch (error) {
      console.warn('[F1HOT] Redis 快照读取失败，回退到现场聚合:', error.message);
    }
  }

  // 1. 读取内存缓存，防刷提速
  if (!isRefreshJob && _memoryCache && Date.now() - _memoryCache.time < MEMORY_TTL) {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.setHeader('X-Cache', 'memory');
    return res.status(200).json(_memoryCache.data);
  }

  try {
    const { items: allItems, sources, usedFallback } = await fetchAllRSSWithHealth();

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

    // 3. 将本地引擎选出的较宽候选池全部交给 AI 复审，避免在 AI 评估前过早淘汰。
    let evaluatedEvents = allEvents.slice(0, 24).map(event => applyEditorialEvaluation(event));

    // 先应用历史评估缓存，只有证据发生变化的事件才再次调用 DeepSeek。
    const evaluationHashes = evaluatedEvents.map(getEvaluationHash);
    const cachedEvaluations = await readEvaluations(evaluationHashes).catch(() => evaluationHashes.map(() => null));
    const pendingIndices = [];
    evaluatedEvents = evaluatedEvents.map((event, index) => {
      const cached = cachedEvaluations[index];
      if (cached) return applyEditorialEvaluation(event, cached);
      pendingIndices.push(index);
      return event;
    });

    // 检查是否配置了 DeepSeek 大模型密钥和当日调用预算。
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const aiBudgetAvailable = apiKey && pendingIndices.length > 0
      ? await consumeAiBudget(Number(process.env.F1HOT_AI_MAX_CALLS_PER_DAY) || 30).catch(() => true)
      : false;
    if (apiKey && pendingIndices.length > 0 && aiBudgetAvailable) {
      try {
        console.log(`[DeepSeek] 正在评估 ${pendingIndices.length} 个新增或变化事件...`);
        
        const payload = {
          events: pendingIndices.map(index => buildEvidencePackage(evaluatedEvents[index], String(index))),
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);
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
                  content: `你是严谨的 F1 中文新闻主编。输入是已经初步聚类的事件证据包，每个事件可能包含多篇报道及摘要。你的职责不是制造热闹标题，而是判断这个事件是否值得车迷花时间阅读。

逐个事件完成：
1. titleCN：克制、准确的中文标题，不增加原文没有的事实。
2. whatHappened：一句话说明已发生或被报道的核心内容。
3. whyItMatters：一句话解释它对比赛、积分、规则、技术或车手市场的实际影响；没有明确影响时如实说明。
4. informationType：只能是 official（官方确认）、reported（媒体报道）、rumour（传闻）、opinion（观点）、community（社区讨论）。仅凭 T1 媒体不能标为 official。
5. importance：1-5，衡量对 F1 竞技或围场格局的影响，不等于话题热度。
6. confidence：1-5，依据来源等级、独立来源数量和证据一致性。单个 Reddit 帖不得高于 2。
7. confidenceReason：简要写出可信或存疑的依据。
8. confirmedFacts 与 unconfirmedClaims：严格区分事实和未经证实说法，不确定时放入 unconfirmedClaims。
9. category：只能是 raceSpeed、techDig、paddockVoice。
10. tags：最多 5 个简短中文标签。

不要自行计算最终排名或总分，服务端会结合来源、时效与真实热度计算。不得把摘要缺失理解为事实已确认。
只返回 JSON，不要 Markdown：
{"evaluations":{"事件ID":{"titleCN":"","whatHappened":"","whyItMatters":"","informationType":"reported","importance":3,"confidence":3,"confidenceReason":"","confirmedFacts":[],"unconfirmedClaims":[],"category":"raceSpeed","tags":[]}}}`
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
            
            if (aiJson?.evaluations && typeof aiJson.evaluations === 'object') {
              const cacheEntries = [];
              pendingIndices.forEach(index => {
                const evaluation = aiJson.evaluations[String(index)];
                if (!evaluation) return;
                evaluatedEvents[index] = applyEditorialEvaluation(evaluatedEvents[index], evaluation);
                cacheEntries.push([evaluationHashes[index], evaluation]);
              });
              await writeEvaluations(cacheEntries).catch(error => console.warn('[F1HOT] 评估缓存写入失败:', error.message));
              console.log('[DeepSeek] 事件事实、影响与可信度评估成功！');
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
        // 保留本地评估结果继续服务，不能因为 AI 不可用而让页面失效。
      }
    } else if (!apiKey) {
      console.log('[F1HOT] 未配置 DEEPSEEK_API_KEY，采用本地评估结果。');
    } else if (pendingIndices.length === 0) {
      console.log('[F1HOT] 所有事件命中评估缓存，本轮不调用 DeepSeek。');
    } else {
      console.log('[F1HOT] 已达到当日 AI 调用上限，本轮使用本地评估。');
    }

    // 4. AI 评估完成后重新排序和精选，确保“什么有价值”真正受编辑评估影响。
    evaluatedEvents = dedupeEvaluatedEvents(evaluatedEvents);
    evaluatedEvents.sort((a, b) => b.valueScore - a.valueScore || a.ageMinutes - b.ageMinutes);
    const featured = evaluatedEvents.slice(0, 12);
    const lowScore = evaluatedEvents.slice(12, 24);
    let dailyBriefing = buildDailyBriefing(featured);
    if (!apiKey) {
      dailyBriefing = { raceSpeed: [], techDig: [], paddockVoice: [] };
      runRegexClassification(featured, dailyBriefing);
    }

    // 5. 整合结果
    const sourceHealth = { healthy: sources.filter(source => source.status === 'healthy').length, empty: sources.filter(source => source.status === 'empty').length, offline: sources.filter(source => source.status === 'offline').length, total: sources.length, usedFallback };
    sourceHealth.status = sourceHealth.offline === sourceHealth.total ? 'offline' : sourceHealth.offline > 0 || sourceHealth.empty > 0 ? 'degraded' : 'healthy';
    const result = {
      topics: featured,
      lowScoreTopics: lowScore,
      dailyBriefing,
      totalItems: allItems.length,
      generatedAt: Date.now(),
      lastCollectedAt: Date.now(),
      processingMode: apiKey ? 'ai-assisted' : 'local',
      persistence: 'redis-v2',
      sourceHealth,
    };

    _memoryCache = { time: Date.now(), data: result };
    if (typeof global !== 'undefined') {
      global.f1_hot_topics_cache = _memoryCache;
    }
    await Promise.allSettled([
      writeCurrentHotTopics(result),
      writeSourceHealth({
        status: sourceHealth.status,
        lastCollectedAt: result.lastCollectedAt,
        totalItems: allItems.length,
        activeEvents: featured.length,
        summary: sourceHealth,
        sources,
      }),
    ]);

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.setHeader('X-Cache', 'fresh');
    return res.status(200).json(result);

  } catch (error) {
    console.error('hot-topics API 故障:', error);
    try {
      const persisted = await readCurrentHotTopics();
      if (persisted?.topics) {
        res.setHeader('X-Cache', 'redis-stale');
        return res.status(200).json({ ...persisted, stale: true });
      }
    } catch {
      // Redis 也不可用时继续使用进程内缓存。
    }
    if (_memoryCache) {
      res.setHeader('X-Cache', 'error-fallback');
      return res.status(200).json(_memoryCache.data);
    }
    return res.status(500).json({ topics: [], lowScoreTopics: [], dailyBriefing: { raceSpeed: [], techDig: [], paddockVoice: [] }, error: 'aggregation failed' });
  }
}
