// F1 智能资讯平台 (F1HOT) 核心分析与聚类去重引擎 v3
// 完全遵循自媒体 AI 选选题（“AIHOT” 系统）的过滤、打分、去重和折叠机制

const DRIVER_ENTITIES = [
  ['Verstappen', 'max_verstappen', 'Max'],
  ['Norris', 'norris', 'Lando'],
  ['Leclerc', 'leclerc', 'Charles'],
  ['Hamilton', 'hamilton', 'Lewis'],
  ['Sainz', 'sainz', 'Carlos'],
  ['Russell', 'russell', 'George'],
  ['Piastri', 'piastri', 'Oscar'],
  ['Alonso', 'alonso', 'Fernando'],
  ['Stroll', 'stroll', 'Lance'],
  ['Gasly', 'gasly', 'Pierre'],
  ['Ocon', 'ocon', 'Esteban'],
  ['Albon', 'albon', 'Alex'],
  ['Hulkenberg', 'hulkenberg', 'Nico'],
  ['Tsunoda', 'tsunoda', 'Yuki'],
  ['Bottas', 'bottas', 'Valtteri'],
  ['Perez', 'perez', 'Sergio', 'Checo'],
  ['Lawson', 'lawson', 'Liam'],
  ['Bearman', 'bearman', 'Oliver'],
  ['Hadjar', 'hadjar', 'Isack'],
  ['Antonelli', 'antonelli', 'Kimi'],
  ['Bortoleto', 'bortoleto', 'Gabriel'],
  ['Lindblad', 'arvid_lindblad', 'Arvid'],
];

const TEAM_ENTITIES = [
  ['Red Bull', 'red_bull', 'RBR'],
  ['Ferrari', 'ferrari'],
  ['McLaren', 'mclaren'],
  ['Mercedes', 'mercedes'],
  ['Aston Martin', 'aston_martin', 'AMR'],
  ['Williams', 'williams'],
  ['Alpine', 'alpine'],
  ['Haas', 'haas'],
  ['Racing Bulls', 'rb', 'RB', 'VCARB', 'AlphaTauri'],
  ['Audi', 'audi', 'Sauber'],
  ['Cadillac', 'cadillac'],
];

// F1 核心词丛（预筛选匹配，过滤互联网纯灌水/非F1噪音）
const F1_KEY_PATTERN = /f1|formula\s*1|grand\s*prix|gp|fia|fom|paddock|stewards|lap|circuit|tire|tyre|wing|aero|chassis|telemetry|pit\s*stop|overtake|drs|silly\s*season|contract|verstappen|norris|leclerc|hamilton|alonso|perez|piastri|sainz|russell|gasly|ocon|albon|tsunoda|lawson|bearman|hadjar|antonelli|bortoleto|lindblad/i;

// N-gram 分词清洗：转小写、去掉标点与虚词，为文本相似度匹配打基础
function getCleanWords(title) {
  const stopwords = new Set([
    'the', 'a', 'an', 'to', 'for', 'in', 'on', 'at', 'of', 'and', 'with', 
    'after', 'about', 'is', 'are', 'was', 'were', 'by', 'from', 'that', 
    'this', 'but', 'how', 'why', 'what', 'will', 'has', 'have', 'had', 'been'
  ]);
  return title.toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=_`~()?"'-]/g, "")
    .split(/\s+/)
    .filter(w => w.length >= 3 && !stopwords.has(w));
}

// 计算两条标题的 Jaccard 文本级别交并相似度 (彻底解决“只要谈论同一个人就被误并成同一个卡片”的顽疾！)
export function getTitleSimilarity(titleA, titleB) {
  const wordsA = new Set(getCleanWords(titleA));
  const wordsB = new Set(getCleanWords(titleB));
  
  const intersection = [...wordsA].filter(x => wordsB.has(x)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  
  return union === 0 ? 0 : intersection / union;
}

// 模拟 DeepSeek 的高保真 5 维度客观打分引擎 (支持无缝对接未来在线 API)
function calculateLocalDimensions(item) {
  const title = item.title.toLowerCase();
  
  // 1. 技术深度分 (Technical Depth)：技术专业词汇与技术探讨板打高分
  let technicalDepth = 3;
  if (/aero|engine|wing|chassis|telemetry|setup|tire|tyre|suspension|floor|diffuser|downforce/i.test(title)) {
    technicalDepth = 8;
  }
  if (item.sourceLabel === 'r/F1Technical') {
    technicalDepth = Math.max(technicalDepth, 9);
  } else if (item.sourceLabel === 'The Race') {
    technicalDepth = Math.max(technicalDepth, 7);
  }

  // 2. 突发指数 (Breaking Value)：重大官宣、撞车、红旗、重罚打高分
  let breakingValue = 3;
  if (/breaking|crash|collision|dnf|retired|accident|red\s*flag|safety\s*car|penalty|penalised|fine|stewards|signed|signed|transfer/i.test(title)) {
    breakingValue = 8;
  }
  if (item.sourceCategory === 'new' && (item.engagementScore || 0) > 10) {
    breakingValue = Math.max(breakingValue, 7);
  }

  // 3. 受众价值 (Audience Value)：根据网友的真实互动(Comments/Score)进行换算
  let audienceValue = 4;
  const engagement = item.engagementScore || 1;
  if (engagement > 100) audienceValue = 9;
  else if (engagement > 50) audienceValue = 8;
  else if (engagement > 20) audienceValue = 7;
  else if (engagement > 8) audienceValue = 6;

  // 4. 冲突/八卦戏剧度 (Drama Index)：争议、愤怒、转会绯闻、传闻打高分
  let dramaIndex = 3;
  if (/blames|angry|furious|slams|tension|conflict|dispute|rumour|rumor|rumored|speculation|talks|silly\s*season/i.test(title)) {
    dramaIndex = 8;
  }

  // 5. 可信度 (Truthfulness)：根据信源的分级 Tier 来做客观映射
  let truthfulness = 5;
  if (item.tier === 'T1') {
    truthfulness = 9; // 官方及权威外媒极度可信
  } else if (item.tier === 'T1.5') {
    truthfulness = 7; // 专业社区和技术版基本可靠
  } else if (item.tier === 'T2') {
    truthfulness = 4; // 玩家大社区杂谈多传闻，较低
  }

  return { technicalDepth, breakingValue, audienceValue, dramaIndex, truthfulness };
}

// 代码公式计算最终 F1HOT 质量分 (QualityScore) — 百分制，极度可控
function calculateQualityScore(dims, weight) {
  const { technicalDepth, breakingValue, audienceValue, dramaIndex, truthfulness } = dims;
  
  // 加权公式：技术深度2.0 + 突发指数2.5 + 受众价值2.5 + 冲突指数1.5 + 可信度1.5 = 满分100
  let rawScore = (technicalDepth * 2.0) + 
                 (breakingValue * 2.5) + 
                 (audienceValue * 2.5) + 
                 (dramaIndex * 1.5) + 
                 (truthfulness * 1.5);
                 
  // 乘上信源 Tier 权威权重 (T1*1.25, T2*0.75)
  let finalScore = rawScore * (weight || 1.0);
  
  return Math.round(Math.min(100, finalScore));
}

// 核心热点分析与聚类算法
export function detectHotTopics(items, { threshold = 0.28, maxTopics = 12 } = {}) {
  if (!items || items.length === 0) return [];

  const now = Date.now();

  // === 第一阶段：预筛选 + 5维度客观打分 ===
  const scoredItems = items
    .filter(item => {
      // 预筛选：如果与 F1 词丛不相关，直接物理丢弃，零 Token 消耗
      return F1_KEY_PATTERN.test(item.title);
    })
    .map(item => {
      const dimensions = calculateLocalDimensions(item);
      const qualityScore = calculateQualityScore(dimensions, item.weight);
      return {
        ...item,
        dimensions,
        qualityScore
      };
    });

  // === 第二阶段：基于标题 Jaccard 文本相似度的语义事件聚类 ===
  const clusters = [];
  for (const item of scoredItems) {
    let bestCluster = null;
    let bestSim = 0;
    
    for (const cluster of clusters) {
      // 拿新文章标题与这个事件簇的主条目标题计算文本重叠相似度
      const sim = getTitleSimilarity(item.title, cluster.mainItem.title);
      if (sim > threshold && sim > bestSim) {
        bestCluster = cluster;
        bestSim = sim;
      }
    }
    
    if (bestCluster) {
      bestCluster.items.push(item);
      // 自动选出质量分最高、信源评级最优的作为当前事件的主卡片标题
      if (item.qualityScore > bestCluster.mainItem.qualityScore) {
        bestCluster.mainItem = item;
      }
    } else {
      clusters.push({
        mainItem: item,
        items: [item]
      });
    }
  }

  // === 第三阶段：事件热度加权与排序 ===
  const processed = clusters.map(c => {
    const main = c.mainItem;
    const sources = [...new Set(c.items.map(i => i.sourceLabel))];
    const sourceTypes = [...new Set(c.items.map(i => i.source))];
    const totalComments = c.items.reduce((sum, i) => sum + (i.comments || 0), 0);
    const latestAt = Math.max(...c.items.map(i => new Date(i.publishedAt).getTime()));
    
    // 综合热度公式：质量分为基底 + 评论数对数增益 + 聚类多源增益
    let heatScore = main.qualityScore + 
                    (12 * Math.log10(totalComments + 1)) + 
                    (10 * (c.items.length - 1));

    // 时效性衰减 (超过 12 小时降热度)
    const ageHours = (now - latestAt) / 3600000;
    if (ageHours < 1) heatScore += 20;      // 极速新料加分
    else if (ageHours < 3) heatScore += 10;
    else if (ageHours > 12) heatScore -= 15; // 陈年旧闻降热度

    return {
      mainItem: main,
      sources,
      sourceTypes,
      sourceCount: sources.length,
      itemCount: c.items.length,
      totalComments,
      latestAt,
      heatScore,
      items: c.items
    };
  });

  // === 第四阶段：精选排序与徽章配置 ===
  const result = processed
    .sort((a, b) => b.heatScore - a.heatScore)
    .slice(0, maxTopics)
    .map((c, i) => {
      const main = c.mainItem;
      const dims = main.dimensions;
      
      // 根据维度高低，为 F1HOT 精选打上极其逼真的“AI特质徽章”
      let badge = null;
      if (main.tier === 'T1' && dims.breakingValue >= 8) badge = '官方重磅';
      else if (dims.technicalDepth >= 8) badge = '深度技术';
      else if (dims.breakingValue >= 8) badge = '突发焦点';
      else if (dims.dramaIndex >= 8) badge = '传闻热议';
      else if (main.sourceCategory === 'new') badge = '新信号';

      return {
        rank: i + 1,
        id: main.id,
        title: main.title,
        badge,
        qualityScore: main.qualityScore,
        dimensions: main.dimensions,
        tier: main.tier,
        weight: main.weight,
        url: main.url,
        sourceCount: c.sourceCount,
        sources: c.sources,
        sourceTypes: c.sourceTypes,
        itemCount: c.itemCount,
        totalComments: c.totalComments,
        ageMinutes: Math.round((now - c.latestAt) / 60000),
        relatedItems: c.items
          .sort((a, b) => b.qualityScore - a.qualityScore)
          .map(i => ({
            title: i.title,
            url: i.url,
            source: i.sourceLabel,
            author: i.author || null,
            description: i.description || null,
            score: i.score || 0,
            comments: i.comments || 0,
            publishedAt: i.publishedAt,
            qualityScore: i.qualityScore,
            tier: i.tier
          }))
      };
    });

  return result;
}

export { calculateLocalDimensions, calculateQualityScore };
