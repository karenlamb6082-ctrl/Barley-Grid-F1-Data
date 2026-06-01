// e:\vibe\f1\scratch\ai-analyzer-test.js
// F1HOT AI 仿真沙盒 — 真实 DeepSeek 打分与增量持久化缓存核心模块

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 持久增量缓存文件路径 (在 scratch 目录下，读写 100% 自由)
const CACHE_PATH = path.join(__dirname, 'ai_scores_cache.json');

// 1. 初始化/读取增量缓存
function readIncrementCache() {
  if (!fs.existsSync(CACHE_PATH)) {
    fs.writeFileSync(CACHE_PATH, JSON.stringify({}), 'utf8');
    return {};
  }
  try {
    const raw = fs.readFileSync(CACHE_PATH, 'utf8');
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

// 2. 写入/更新增量缓存
function writeIncrementCache(cache) {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
  } catch (e) {
    console.error('[AI Cache] 写入持久缓存失败:', e.message);
  }
}

// 3. 计算新闻唯一 Key (标题+链接的 MD5 签名)
function getNewsHash(title, url) {
  return crypto.createHash('md5').update(`${title}-${url}`).digest('hex').slice(0, 16);
}

// 4. 本地高保真模拟打分 (降级保底策略，100% 确保系统永远不会因网络报错或卡死)
function fallbackLocalAnalysis(title, label) {
  const lower = title.toLowerCase();
  
  let technicalDepth = 3;
  if (/aero|engine|wing|chassis|telemetry|setup|tire|tyre|suspension|floor|diffuser|downforce/i.test(lower)) technicalDepth = 8;
  if (label === 'r/F1Technical') technicalDepth = Math.max(technicalDepth, 9);

  let breakingValue = 3;
  if (/breaking|crash|collision|dnf|retired|accident|red\s*flag|safety\s*car|penalty|penalised|fine|stewards|signed|extension|transfer/i.test(lower)) breakingValue = 8;

  let audienceValue = 5;
  if (/champion|win|podium|pole|ferrari|mclaren|verstappen|hamilton/i.test(lower)) audienceValue = 7;

  let dramaIndex = 3;
  if (/blames|angry|furious|slams|tension|conflict|rumour|rumor|speculation|silly\s*season/i.test(lower)) dramaIndex = 8;

  let truthfulness = 5;
  if (label === 'Autosport' || label === 'The Race') truthfulness = 9;
  else if (label === 'RaceFans' || label === 'r/F1Technical') truthfulness = 7;

  return {
    technicalDepth,
    breakingValue,
    audienceValue,
    dramaIndex,
    truthfulness,
    isLocalFallback: true // 标明是本地降级评分
  };
}

// 5. 对接真实 DeepSeek-V3 接口的高可用打分分析器
export async function analyzeNewsWithAI(title, description, sourceLabel, feedWeight, customApiKey = "") {
  const hash = getNewsHash(title, description);
  const cache = readIncrementCache();
  
  // === 第一通道：增量缓存检索 ===
  if (cache[hash]) {
    // 缓存命中：0 毫秒闪电响应，Token 消耗为 0！
    return {
      ...cache[hash],
      cacheHit: true
    };
  }

  // === 第二通道：尝试在线 DeepSeek-V3 智能多维度打分 ===
  // 优先级：用户临时传入的 Key > 环境变量中的 Key
  const apiKey = customApiKey || process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    // 若无 Key 或者是本地离线开发，自动且无缝触发“本地高保真模拟降级”，保底运转！
    const mockScores = fallbackLocalAnalysis(title, sourceLabel);
    mockScores.qualityScore = calculateScoreFromDims(mockScores, feedWeight);
    // 降级评分不写盘持久缓存，以便配置 Key 后能重新调用大模型打分
    return {
      ...mockScores,
      cacheHit: false
    };
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3500); // 强超时控制：3.5 秒未响应立刻 Abort，绝不拖卡前端！

    const prompt = `
你是一位拥有20年一级方程式(F1)围场报道经验的资深记者。请评估以下F1新闻的客观特质，并为以下5个维度打分（1-10分，保留整数）：

维度定义：
1. technicalDepth (技术深度)：讨论空气动力学、底盘升级、引擎布局、战术策略、数据分析的深度。
2. breakingValue (突发性)：属于重大官宣、突发撞车、重大退赛、干事重罚、临时更换车手的即时度。
3. audienceValue (受众价值)：对于核心车迷的阅读吸引力，是否是围场焦点大瓜或热门大势。
4. dramaIndex (戏剧指数)：是否包含争议、怒喷、围场冲突、转会传闻八卦等抓人眼球的内容。
5. truthfulness (可信度)：官方公告或权威外媒打高分(9-10)，匿名爆料或自媒体传闻打低分(3-6)。

新闻标题："${title}"
新闻描述："${description || ''}"

请必须严格以以下 JSON 格式输出，不要有任何 Markdown 包裹或多余解释：
{
  "technicalDepth": 8,
  "breakingValue": 5,
  "audienceValue": 9,
  "dramaIndex": 3,
  "truthfulness": 10
}
`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }, // 开启 JSON Mode，保证大模型 100% 输出合法 JSON
        temperature: 0.1 // 低随机度，保证评分极其客观、一致
      }),
      signal: ctrl.signal
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const resJson = await response.json();
    const dsResult = JSON.parse(resJson.choices[0].message.content.trim());
    
    // 代码公式计算最终质量分 QualityScore (百分制，极度可控)
    const qualityScore = calculateScoreFromDims(dsResult, feedWeight);

    const finalScores = {
      ...dsResult,
      qualityScore,
      isLocalFallback: false,
      analyzedAt: Date.now()
    };

    // 成功获取大模型打分，立刻写入持久缓存，下次免打分！
    cache[hash] = finalScores;
    writeIncrementCache(cache);

    return {
      ...finalScores,
      cacheHit: false
    };

  } catch (err) {
    console.warn(`[AI Sandbox] DeepSeek 调用受阻 (${err.message}) — 无缝激活本地高保真模拟降级`);
    // 3.5秒超时或报错触发“自动高保真模拟降级”，保底！
    const mockScores = fallbackLocalAnalysis(title, sourceLabel);
    mockScores.qualityScore = calculateScoreFromDims(mockScores, feedWeight);
    return {
      ...mockScores,
      cacheHit: false
    };
  }
}

// 代码公式算分规则
function calculateScoreFromDims(dims, weight) {
  const { technicalDepth, breakingValue, audienceValue, dramaIndex, truthfulness } = dims;
  let rawScore = (technicalDepth * 2.0) + 
                 (breakingValue * 2.5) + 
                 (audienceValue * 2.5) + 
                 (dramaIndex * 1.5) + 
                 (truthfulness * 1.5);
  return Math.round(Math.min(100, rawScore * (weight || 1.0)));
}
