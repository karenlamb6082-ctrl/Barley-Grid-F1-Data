// RSS 多源聚合器
// Reddit 原生 RSS + F1 新闻媒体 RSS，零配置

function getTagContent(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = xml.match(re);
  if (!m) return '';
  return m[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').replace(/<[^>]*>/g, '').trim();
}

function parseRSS(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const title = getTagContent(m[1], 'title');
    const link = getTagContent(m[1], 'link');
    const pubDate = getTagContent(m[1], 'pubDate');
    const author = getTagContent(m[1], 'author');
    const description = getTagContent(m[1], 'description');
    if (title && link) {
      items.push({
        title,
        url: link,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : null,
        author: author ? author.replace('/u/', '') : null,
        description: description ? description.slice(0, 500) : null,
      });
    }
  }
  return items;
}

function parseAtom(xml) {
  const items = [];
  const re = /<entry>([\s\S]*?)<\/entry>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const title = (m[1].match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1] || '';
    const linkHref = (m[1].match(/<link[^>]*href="([^"]*)"/) || [])[1] || '';
    const published = (m[1].match(/<published>([\s\S]*?)<\/published>/) || [])[1] || '';
    if (title && linkHref) {
      items.push({
        title: title.replace(/<[^>]*>/g, '').trim(),
        url: linkHref,
        publishedAt: published ? new Date(published).toISOString() : null,
      });
    }
  }
  return items;
}

const FEEDS = [
  // T1: 官方及顶级权威外媒 (权重倍率 1.25)
  { url: 'https://www.autosport.com/rss/feed/f1', label: 'Autosport', category: 'news', tier: 'T1', weight: 1.25 },
  { url: 'https://the-race.com/feed/', label: 'The Race', category: 'news', tier: 'T1', weight: 1.25 },

  // T1.5: 专业硬核技术与直观自媒体 (权重倍率 1.0)
  { url: 'https://www.reddit.com/r/F1Technical/hot.rss', label: 'r/F1Technical', category: 'hot', tier: 'T1.5', weight: 1.0 },
  { url: 'https://www.racefans.net/feed/', label: 'RaceFans', category: 'news', tier: 'T1.5', weight: 1.0 },

  // T2: 普通大众社区讨论（用于看热闹和搜集话题讨论度）(权重倍率 0.75)
  { url: 'https://www.reddit.com/r/formula1/hot.rss', label: 'r/formula1', category: 'hot', tier: 'T2', weight: 0.75 },
  { url: 'https://www.reddit.com/r/formula1/new.rss?limit=15', label: 'r/formula1', category: 'new', tier: 'T2', weight: 0.75 }
];

export async function fetchAllRSS() {
  const results = await Promise.allSettled(
    FEEDS.map(async feed => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 5000);
        const res = await fetch(feed.url, {
          headers: { 'User-Agent': 'BarleyGrid/1.0', 'Accept': 'application/rss+xml, text/xml, */*' },
          signal: ctrl.signal,
        });
        clearTimeout(t);
        if (!res.ok) return [];
        const xml = await res.text();
        let items = parseRSS(xml);
        if (items.length === 0) items = parseAtom(xml);

        return items.map(item => {
          let score = 1;
          let comments = 0;
          if (item.description) {
            const scoreMatch = item.description.match(/score">(\d+)/);
            const commentsMatch = item.description.match(/comments">(\d+)/);
            if (scoreMatch) score = parseInt(scoreMatch[1]) || 1;
            if (commentsMatch) comments = parseInt(commentsMatch[1]) || 0;
          }

          // 新帖时效加分
          if (feed.category === 'new') {
            const ageMinutes = item.publishedAt
              ? (Date.now() - new Date(item.publishedAt).getTime()) / 60000
              : 999;
            if (ageMinutes < 30) score += 15;
            else if (ageMinutes < 60) score += 8;
          }

          return {
            id: btoa(item.url).slice(0, 12),
            source: feed.label.startsWith('r/') ? 'reddit' : 'rss',
            sourceLabel: feed.label,
            sourceCategory: feed.category,
            tier: feed.tier,
            weight: feed.weight,
            title: item.title,
            url: item.url,
            publishedAt: item.publishedAt,
            author: item.author || null,
            description: item.description || null,
            score,
            comments,
            engagementScore: score + comments * 2,
          };
        });
      } catch (e) {
        console.error(`[RSS] ${feed.label}/${feed.category} 失败:`, e.message);
        return [];
      }
    })
  );

  const all = [];
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value);
  }

  // 如果所有 RSS 真实源都因本地网络连接超时或中断失败，自动导入 Mock 数据兜底，保障网站的可用性
  if (all.length === 0) {
    const { MOCK_RSS_ITEMS } = await import('./mock-rss.js');
    console.warn('[RSS] 所有真实源请求均超时或失败，已自动载入高保真本地 Mock 数据兜底！');
    return MOCK_RSS_ITEMS;
  }

  return all;
}

export { FEEDS, parseRSS, parseAtom };
