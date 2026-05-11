// F1 热点识别引擎 — 用于 Vercel API Route

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
  crash: 'crash, collision, accident, dnf, retired, red flag',
  contract: 'contract, signed, extension, leaving, joining, transfer, silly season',
  protest: 'protest, appeal, investigation, summoned',
  upgrade: 'upgrade, update, package, new parts',
  podium: 'podium, win, won, victory, winner, champion',
  pole: 'pole position, pole, qualifying, quali',
  drama: 'blames, angry, furious, slams, hits back, tension, conflict',
  regulation: 'regulation, rules, FIA, FOM',
  budget: 'budget cap, cost cap',
};

function extractEntities(title) {
  const lower = title.toLowerCase();
  const entities = [];

  for (const [displayName, driverId, ...aliases] of DRIVER_ENTITIES) {
    for (const name of [displayName, ...aliases]) {
      if (name.length >= 3 && lower.includes(name.toLowerCase())) {
        entities.push(`driver:${driverId}`);
        break;
      }
    }
  }

  for (const [displayName, constructorId, ...aliases] of TEAM_ENTITIES) {
    for (const name of [displayName, ...aliases]) {
      if (name.length >= 2 && lower.includes(name.toLowerCase())) {
        entities.push(`team:${constructorId}`);
        break;
      }
    }
  }

  for (const [eventKey, keywordStr] of Object.entries(EVENT_KEYWORDS)) {
    for (const kw of keywordStr.split(', ')) {
      if (kw.length >= 3 && lower.includes(kw)) {
        entities.push(`event:${eventKey}`);
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

export function detectHotTopics(items, { threshold = 0.20, minSources = 2, maxTopics = 10 } = {}) {
  if (!items || items.length === 0) return [];

  const clusters = [];
  const now = Date.now();
  const HOUR = 3600000;

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

  return clusters
    .map(c => ({
      entities: c.entities,
      items: c.items,
      sourceCount: new Set(c.items.map(i => i.sourceLabel)).size,
      sources: [...new Set(c.items.map(i => i.sourceLabel))],
      sourceTypes: [...new Set(c.items.map(i => i.source))],
      itemCount: c.items.length,
      totalScore: c.items.reduce((s, i) => s + (i.score || 0), 0),
      totalComments: c.items.reduce((s, i) => s + (i.comments || 0), 0),
      latestAt: Math.max(...c.items.map(i => new Date(i.publishedAt).getTime())),
      topItem: [...c.items].sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0))[0],
    }))
    .filter(c => c.sourceCount >= minSources)
    .sort((a, b) => {
      const heatA = a.sources.length * 20 + Math.log10(a.totalScore + a.totalComments + 1) * 15 + (now - a.latestAt < HOUR ? 10 : 0);
      const heatB = b.sources.length * 20 + Math.log10(b.totalScore + b.totalComments + 1) * 15 + (now - b.latestAt < HOUR ? 10 : 0);
      return heatB - heatA;
    })
    .slice(0, maxTopics)
    .map((c, i) => ({
      rank: i + 1,
      id: c.topItem?.id || String(i),
      title: c.topItem?.title || 'Unknown',
      sources: c.sources,
      sourceTypes: c.sourceTypes,
      sourceCount: c.sourceCount,
      itemCount: c.itemCount,
      totalComments: c.totalComments,
      ageMinutes: Math.round((now - c.latestAt) / 60000),
      relatedItems: c.items
        .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0))
        .slice(0, 5)
        .map(i => ({
          title: i.title,
          url: i.url,
          source: i.sourceLabel,
          score: i.score || 0,
          comments: i.comments || 0,
          publishedAt: i.publishedAt,
        })),
    }));
}
