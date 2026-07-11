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

const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_TOTAL_LENGTH = 12000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 20;
const rateLimitStore = new Map();

function getClientId(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  return String(Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket?.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();
}

function isRateLimited(req) {
  const key = getClientId(req);
  const now = Date.now();
  const recent = (rateLimitStore.get(key) || []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitStore.set(key, recent);
    return true;
  }
  recent.push(now);
  rateLimitStore.set(key, recent);
  return false;
}

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return null;
  let totalLength = 0;
  const safeMessages = [];
  for (const message of messages) {
    if (!message || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string') return null;
    const content = message.content.trim();
    if (!content || content.length > MAX_MESSAGE_LENGTH) return null;
    totalLength += content.length;
    if (totalLength > MAX_TOTAL_LENGTH) return null;
    safeMessages.push({ role: message.role, content });
  }
  return safeMessages;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (isRateLimited(req)) {
    res.setHeader('Retry-After', '600');
    return res.status(429).json({ error: '提问有点太快了，请稍后再试' });
  }

  // 1. 获取前端传入的对话历史、赛事数据 Context 以及模型参数
  const { messages, f1Context, model } = req.body || {};
  const safeMessages = validateMessages(messages);
  if (!safeMessages) {
    return res.status(400).json({ error: '对话内容无效、过长或消息数量过多' });
  }

  // 2. 检查 DeepSeek 密钥
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: '未配置 DEEPSEEK_API_KEY，无法与 AI 对话' });
  }

  // 3. RAG 联网检索数据组装 —— 动态拼接系统时间、赛历日程与今日 F1HOT 实事头条
  let realtimeNewsText = '';
  const cachedData = (typeof global !== 'undefined' ? global.f1_hot_topics_cache : null);
  
  if (cachedData?.data?.topics) {
    const topics = cachedData.data.topics || [];
    realtimeNewsText += `【今日围场最新实时头条新闻（已通过 F1HOT 联网拉取）】\n`;
    topics.slice(0, 10).forEach((t, i) => {
      const title = t.titleCN || t.title;
      realtimeNewsText += `${i + 1}. ${title} (发布来源: ${t.sourceLabel || '网络媒体'}, 监控质量分: ${t.qualityScore})\n`;
    });
  }

  let scheduleContextText = '';
  if (f1Context?.nextRace) {
    const nr = f1Context.nextRace;
    scheduleContextText += `【下一站正赛实时日程】\n`;
    scheduleContextText += `- 分站名称：${nr.name}\n`;
    scheduleContextText += `- 赛道与国家：${nr.circuit || '未知赛道'} · ${nr.country || '未知'}\n`;
    if (nr.date) {
      const localTime = new Date(nr.date).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
      scheduleContextText += `- 正赛时间：${localTime} (北京时间)\n`;
    }
  }

  if (f1Context?.seasonProgress) {
    scheduleContextText += `- 当前赛季进度：已完成 ${f1Context.seasonProgress.completed} 站，全年总共 ${f1Context.seasonProgress.total} 站。\n`;
  }

  // 整理全年赛历列表
  if (f1Context?.schedule && Array.isArray(f1Context.schedule) && f1Context.schedule.length > 0) {
    scheduleContextText += `\n【2026赛季全年赛历表】\n`;
    f1Context.schedule.forEach(s => {
      const dateStr = s.date ? new Date(s.date).toLocaleDateString('zh-CN') : '未定';
      scheduleContextText += `- Rnd ${s.round}: ${s.name} (${s.circuit}) - ${dateStr} [${s.status === 'completed' ? '已完赛' : '未进行'}]\n`;
    });
  }

  let standingsContextText = '';
  if (f1Context?.driverStandings && Array.isArray(f1Context.driverStandings) && f1Context.driverStandings.length > 0) {
    standingsContextText += `【当前赛季车手积分榜（实时数据）】\n`;
    f1Context.driverStandings.slice(0, 22).forEach(d => {
      standingsContextText += `- 第${d.rank || '?'}名: ${d.firstName || ''} ${d.lastName || '未知车手'} (${d.points || 0}分)\n`;
    });
  }
  if (f1Context?.teamStandings && Array.isArray(f1Context.teamStandings) && f1Context.teamStandings.length > 0) {
    standingsContextText += `\n【当前赛季车队积分榜（实时数据）】\n`;
    f1Context.teamStandings.forEach(t => {
      standingsContextText += `- 第${t.rank || '?'}名: ${t.name || '未知车队'} (${t.points || 0}分)\n`;
    });
  }

  // 整理已完赛历史分站的具体成绩和DNF信息
  let historyRacesText = '';
  if (f1Context?.allRaces && Array.isArray(f1Context.allRaces) && f1Context.allRaces.length > 0) {
    historyRacesText += `【已完赛大奖赛历史详细正赛结果（按排名列出车手及分数/DNF）】\n`;
    f1Context.allRaces.forEach(race => {
      historyRacesText += `- 第${race.round}站: ${race.raceName} (${race.Circuit?.circuitName || race.circuit || ''})\n`;
      if (race.Results && Array.isArray(race.Results)) {
        const resultsSummary = race.Results.map(r => {
          const isRet = r.status !== 'Finished' && !r.status?.includes('Lap');
          return `${r.position}.${r.Driver?.familyName || '未知车手'}(${isRet ? 'DNF' : r.points + '分'})`;
        }).join(', ');
        historyRacesText += `  成绩单: ${resultsSummary}\n`;
      }
    });
  }

  const systemPromptContent = `
你是一个专业的 F1（一级方程式）围场资深技术分析师与围场百事通。

【关于本看板的 F1HOT 板块介绍与打分聚类算法说明】
F1HOT（本看板的热点快讯与日报板块）是智能资讯聚合与提炼系统。如果用户询问起 F1HOT 的评分机制，请向用户解释以下核心协同逻辑：
1. 【本地粗筛与初打分】：首先由本地分析引擎根据正则词丛匹配（如技术词、突发词、冲突词）与 Reddit 真实热度互动，进行毫秒级初筛，并初步打出 5 维评分（技术深度、突发大料、受众价值、冲突八卦、权威可信，均为 1-10分）和质量分 (Quality Score，简称 QS，加权计算公式为：(技术深度*2.0 + 突发大料*2.5 + 受众吸引*2.5 + 冲突八卦*1.5 + 权威可信*1.5) * 信源权重)。
2. 【DeepSeek-AI 复审二次打分（AI 亲笔打分）】：在第二阶段，当筛选出最核心的精选热点并发送给我（DeepSeek-AI）进行汉化翻译与重写时，我会对 featured 列表中的文章进行资深新闻主编级的“二次专业复审与重新评分”，我评估修正后的五维评分和重新计算的 QS 质量分将直接覆盖并回填到卡片中。因此，用户在网页卡片上看到的最终五维评分与 QS 质量分是真正经过我二次评审修正后的高质量结果！
3. 【语义去重聚类】：采用 Jaccard 文本相似度算法（阈值 0.28），去除标题虚词并分词，计算文本重叠率大于 0.28 的报道被折叠进同一个事件簇内，选举出质量分最高的为主卡片展出，彻底解决重复报道堆砌的顽疾。
4. 【综合热度排序与徽章】：热度依据“QS + 12 * log10(总评论数 + 1) + 10 * (重复报道数 - 1)”计算并随时效衰减，前列精选卡片将被打上“官方重磅”、“深度技术”、“突发焦点”等 AI 徽章。

为了让你能获取到最实时的赛历、积分榜、各已完赛大奖赛正赛结果以及全网突发新闻，系统已通过【联网增强数据流】为您实时注入了以下围场数据：

[系统时间]：${new Date().toLocaleDateString('zh-CN')}
${scheduleContextText || '（暂无最新分站赛历数据）'}
${standingsContextText || '（暂无当前赛季积分排行榜数据）'}
${historyRacesText || '（暂无已完赛大奖赛历史正赛结果数据）'}
${realtimeNewsText || '（暂无今日全网最新实时新闻数据）'}

请使用专业、客观且风趣幽默的中文，结合上述联网注入的最新实时资讯、全年赛历、各完赛分站详细成绩单与积分排行榜，回答用户的问题。如果用户询问关于“F1HOT 的评分机制”、“F1HOT 是什么”、“今日有什么新爆料”等问题，请直接从上面提供的数据中以及内置的 F1HOT 板块介绍中提取并给出极其精准的解答！
`;

  const deepseekModel = model || process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';

  try {
    const targetModel = mapModelName(deepseekModel);
    console.log(`[DeepSeek] 收到聊天请求，正在通过模型 [${targetModel}]（原始输入: ${deepseekModel}）进行联网分析解答...`);
    
    // 4. 向 DeepSeek 大模型发起请求，设定 15 秒超时保护
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
          model: targetModel,
          messages: [
            {
              role: 'system',
              content: systemPromptContent
            },
            ...safeMessages
          ],
          temperature: 0.7
        })
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response || !response.ok) {
      throw new Error(response ? `HTTP 异常 ${response.status}` : '连接超时/未响应');
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '围场里的风太大了，AI 没听清，请重新问一次。';
    
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('[Chat API Error]:', error.message);
    return res.status(500).json({ error: '与 DeepSeek 连接故障: ' + error.message });
  }
}
