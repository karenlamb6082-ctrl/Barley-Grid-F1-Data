// F1 热点识别引擎 v2
// 双通道：热度聚类 + 信任源直通车

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

const EVENT_KEYWORDS = {
  penalty: 'stewards, penalty, penalised, penalized, fine, grid drop',
  crash: 'crash, collision, accident, dnf, retired, red flag, safety car',
  contract: 'contract, signed, extension, leaving, joining, transfer, silly season',
  protest: 'protest, appeal, investigation, summoned',
  upgrade: 'upgrade, update, package, new parts, brought',
  podium: 'podium, win, won, victory, winner, champion',
  pole: 'pole position, pole, qualifying, quali',
  drama: 'blames, angry, furious, slams, hits back, tension, conflict',
  regulation: 'regulation, rules, FIA, FOM',
  budget: 'budget cap, cost cap',
  rumour: 'rumour, rumor, rumored, reported, sources say, could, might, set to',
};

// 信任源列表 — 知名 F1 博主 / 数据分析师 / 内部人士
// 可根据观察持续补充
const TRUSTED_AUTHORS = new Set([
  // F1 数据分析
  'u/F1DataAnalysis',
  // 如果发现其他知名ID，加到这里
]);

// 信任源发帖加分
const TRUSTED_BOOST = 30;
const NEW_FRESH_BONUS = 15; // new 分类时效加分

function extractEntities(title) {
  const lower = title.toLowerCase();
  const entities = [];

  for (const [displayName, driverId, ...aliases] of DRIVER_ENTITIES) {
    for (const name of [displayName, ...aliases]) {
      if (name.length >= 3 && lower.includes(name.toLowerCase())) {
        entities.push('driver:' + driverId);
        break;
      }
    }
  }

  for (const [displayName, constructorId, ...aliases] of TEAM_ENTITIES) {
    for (const name of [displayName, ...aliases]) {
      if (name.length >= 2 && lower.includes(name.toLowerCase())) {
        entities.push('team:' + constructorId);
        break;
      }
    }
  }

  for (const [eventKey, keywordStr] of Object.entries(EVENT_KEYWORDS)) {
    for (const kw of keywordStr.split(', ')) {
      if (kw.length >= 3 && lower.includes(kw)) {
        entities.push('event:' + eventKey);
        break;
      }
    }
  }

  return [...new Set(entities)];
}

function jaccardSimilarity(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

export function detectHotTopics(items, { threshold = 0.18, minSources = 2, maxTopics = 12 } = {}) {
  if (!items || items.length === 0) return [];

  const now = Date.now();
  const HOUR = 3600000;

  // === 通道一：多源热度聚类 ===
  const clusters = [];
  for (const item of items) {
    const entities = extractEntities(item.title);
    if (entities.length === 0) continue;

    let bestCluster = null;
    let bestScore = 0;
    for (const cluster of clusters) {
      const score = jaccardSimilarity(entities, cluster.entities);
      if (score > threshold && score > bestScore) {
        bestCluster = cluster;
        bestScore = score;
      }
    }

    if (bestCluster) {
      bestCluster.items.push(item);
      bestCluster.entities = [...new Set([...bestCluster.entities, ...entities])];
    } else {
      clusters.push({ entities: [...entities], items: [item] });
    }
  }

  const clustered = clusters
    .map(c => {
      const sources = [...new Set(c.items.map(i => i.sourceLabel))];
      const sourceTypes = [...new Set(c.items.map(i => i.source))];
      const totalScore = c.items.reduce((s, i) => s + (i.score || 0), 0);
      const totalComments = c.items.reduce((s, i) => s + (i.comments || 0), 0);
      const latestAt = Math.max(...c.items.map(i => new Date(i.publishedAt).getTime()));
      const topItem = [...c.items].sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0))[0];
      const hasTrusted = c.items.some(i => i.author && TRUSTED_AUTHORS.has('u/' + i.author));
      const isFresh = c.items.some(i => i.sourceCategory === 'new');
      const isRumour = c.entities.some(e => e.startsWith('event:rumour'));

      return {
        sources,
        sourceTypes,
        sourceCount: sources.length,
        itemCount: c.items.length,
        totalScore,
        totalComments,
        latestAt,
        topItem,
        hasTrusted,
        isFresh,
        isRumour,
        items: c.items,
      };
    });

  // === 通道二：信任源直通车 ===
  // 信任源发的帖如果互动高，即使单源也上榜
  const trustedItems = items.filter(i => {
    if (!i.author || !TRUSTED_AUTHORS.has('u/' + i.author)) return false;
    return (i.engagementScore || 0) >= 5; // 最低互动门槛
  });

  const trustSourced = trustedItems
    .filter(ti => !clustered.some(c => c.items.some(ci => ci.id === ti.id))) // 排除已在聚类中的
    .map(ti => ({
      sources: [ti.sourceLabel],
      sourceTypes: [ti.source],
      sourceCount: 1,
      itemCount: 1,
      totalScore: ti.score || 0,
      totalComments: ti.comments || 0,
      latestAt: new Date(ti.publishedAt).getTime(),
      topItem: ti,
      hasTrusted: true,
      isFresh: ti.sourceCategory === 'new',
      isRumour: false,
      items: [ti],
      isTrustSignal: true, // 标记为信任源独发
    }));

  // === 通道三：高热度单帖补位 ===
  // 互动很高的单帖，即使没聚类，也值得展示
  const allClusteredIds = new Set(clustered.flatMap(c => c.items.map(i => i.id)));
  const highEngageItems = items
    .filter(i => {
      if (allClusteredIds.has(i.id)) return false;
      if (TRUSTED_AUTHORS.has('u/' + (i.author || ''))) return false; // 已在通道二
      return (i.comments || 0) >= 15 || (i.score || 0) >= 50;
    })
    .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0))
    .slice(0, 5);

  const highEngageSourced = highEngageItems.map(ti => ({
    sources: [ti.sourceLabel],
    sourceTypes: [ti.source],
    sourceCount: 1,
    itemCount: 1,
    totalScore: ti.score || 0,
    totalComments: ti.comments || 0,
    latestAt: new Date(ti.publishedAt).getTime(),
    topItem: ti,
    hasTrusted: false,
    isFresh: ti.sourceCategory === 'new',
    isRumour: false,
    items: [ti],
    isHotSignal: true, // 标记为高热度单帖
  }));

  // === 合并 + 排序 ===
  const allCandidates = [...clustered, ...trustSourced, ...highEngageSourced];

  const result = allCandidates
    .filter(c => c.sourceCount >= minSources || c.isTrustSignal || c.isHotSignal)
    .sort((a, b) => {
      const heatA = calculateHeatScore(a, now);
      const heatB = calculateHeatScore(b, now);
      return heatB - heatA;
    })
    .slice(0, maxTopics)
    .map((c, i) => {
      // 生成 badge
      let badge = null;
      if (c.isTrustSignal) badge = '独家';
      else if (c.isHotSignal) badge = '热议';
      else if (c.hasTrusted) badge = '可靠源';
      else if (c.isRumour) badge = '传闻';
      else if (c.isFresh && c.sourceCount < 2) badge = '新信号';

      return {
        rank: i + 1,
        id: c.topItem?.id || String(i),
        title: c.topItem?.title || 'Unknown',
        badge,
        sourceCount: c.sourceCount,
        sources: c.sources,
        sourceTypes: c.sourceTypes,
        itemCount: c.itemCount,
        totalComments: c.totalComments,
        ageMinutes: Math.round((now - c.latestAt) / 60000),
        author: c.isTrustSignal ? c.topItem?.author : null,
        relatedItems: c.items
          .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0))
          .slice(0, 6)
          .map(i => ({
            title: i.title,
            url: i.url,
            source: i.sourceLabel,
            author: i.author || null,
            score: i.score || 0,
            comments: i.comments || 0,
            publishedAt: i.publishedAt,
          })),
      };
    });

  return result;
}

function calculateHeatScore(c, now) {
  const HOUR = 3600000;
  let heat = 0;

  // 来源多样性
  heat += c.sourceCount * 18;

  // 互动量
  heat += Math.log10(c.totalScore + c.totalComments + 1) * 12;

  // 时效性
  const age = (now - c.latestAt) / HOUR;
  if (age < 0.5) heat += 25;      // 30 分钟内
  else if (age < 1) heat += 18;   // 1 小时内
  else if (age < 3) heat += 10;   // 3 小时内
  else if (age < 6) heat += 5;    // 6 小时内

  // 信任源加分
  if (c.hasTrusted || c.isTrustSignal) heat += TRUSTED_BOOST;

  // 新鲜度加分
  if (c.isFresh) heat += NEW_FRESH_BONUS;

  // 传闻加分（用户感兴趣）
  if (c.isRumour) heat += 8;

  return heat;
}

export { extractEntities, clusterItems(){} };
