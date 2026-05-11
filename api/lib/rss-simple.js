// 简易 RSS 解析器 — Vercel 版本
// 从 RSS 2.0 / Atom XML 中提取标题和链接

function getTagContent(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = xml.match(re);
  if (!m) return '';
  return m[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').replace(/<[^>]*>/g, '').trim();
}

function getAtomTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = xml.match(re);
  if (!m) return '';
  return m[1].replace(/<[^>]*>/g, '').trim();
}

export function parseRSS(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const title = getTagContent(m[1], 'title');
    const link = getTagContent(m[1], 'link');
    const pubDate = getTagContent(m[1], 'pubDate');
    if (title && link) {
      items.push({
        title,
        url: link,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : null,
      });
    }
  }
  return items;
}

// 如果 RSS 解析失败，尝试 Atom 格式
export function parseAtom(xml) {
  const items = [];
  const re = /<entry>([\s\S]*?)<\/entry>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const title = getAtomTag(m[1], 'title');
    const linkHref = (m[1].match(/<link[^>]*href="([^"]*)"/) || [])[1] || '';
    const published = getAtomTag(m[1], 'published') || getAtomTag(m[1], 'updated');
    if (title && linkHref) {
      items.push({
        title,
        url: linkHref,
        publishedAt: published ? new Date(published).toISOString() : null,
      });
    }
  }
  return items;
}

const FEEDS = [
  { url: 'https://www.autosport.com/rss/feed/f1', label: 'Autosport' },
  { url: 'https://the-race.com/feed/', label: 'The Race' },
  { url: 'https://www.racefans.net/feed/', label: 'RaceFans' },
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
        return items.map(item => ({
          id: btoa(item.url).slice(0, 12),
          source: 'rss',
          sourceLabel: feed.label,
          title: item.title,
          url: item.url,
          publishedAt: item.publishedAt,
          score: 8,
          comments: 0,
          engagementScore: 8,
        }));
      } catch {
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
