// RSS 多源聚合器 — 包含 Reddit 原生 RSS（无需 API 凭证）

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
        author: author || null,
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
  // Reddit — 原生 RSS，无需 API 凭证
  { url: 'https://www.reddit.com/r/formula1/hot.rss', label: 'r/formula1', baseScore: 20 },
  { url: 'https://www.reddit.com/r/F1Technical/hot.rss', label: 'r/F1Technical', baseScore: 12 },

  // F1 新闻媒体 RSS
  { url: 'https://www.autosport.com/rss/feed/f1', label: 'Autosport', baseScore: 8 },
  { url: 'https://the-race.com/feed/', label: 'The Race', baseScore: 8 },
  { url: 'https://www.racefans.net/feed/', label: 'RaceFans', baseScore: 8 },
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
          // Reddit RSS description 里可能有互动数据
          let score = feed.baseScore;
          let comments = 0;
          if (item.description) {
            const scoreMatch = item.description.match(/score">(\d+)/);
            const commentsMatch = item.description.match(/comments">(\d+)/);
            if (scoreMatch) score = parseInt(scoreMatch[1]) || feed.baseScore;
            if (commentsMatch) comments = parseInt(commentsMatch[1]) || 0;
          }

          return {
            id: btoa(item.url).slice(0, 12),
            source: feed.label.startsWith('r/') ? 'reddit' : 'rss',
            sourceLabel: feed.label,
            title: item.title,
            url: item.url,
            publishedAt: item.publishedAt,
            author: item.author || null,
            score,
            comments,
            engagementScore: score + comments * 2,
          };
        });
      } catch (e) {
        console.error(`[RSS] ${feed.label} 失败:`, e.message);
        return [];
      }
    })
  );

  const all = [];
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value);
  }
  return all;
}

export { FEEDS, parseRSS, parseAtom };
