// Reddit OAuth 数据源 — Vercel 版本
// 环境变量: REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET

let _tokenCache = null;

async function getRedditToken() {
  if (_tokenCache && _tokenCache.expiresAt > Date.now()) {
    return _tokenCache.token;
  }

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null; // 静默降级，不抛错
  }

  // 用 Buffer 做 base64 编码（Vercel Edge Runtime 兼容）
  const auth = btoa(`${clientId}:${clientSecret}`);

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'BarleyGrid/1.0',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    console.error('Reddit OAuth 失败:', res.status);
    return null;
  }

  const data = await res.json();
  _tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return _tokenCache.token;
}

export async function fetchRedditHot(limit = 25) {
  const token = await getRedditToken();
  if (!token) return [];

  try {
    const res = await fetch(
      `https://oauth.reddit.com/r/formula1/hot.json?limit=${limit}&raw_json=1`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'BarleyGrid/1.0',
        },
      }
    );

    if (!res.ok) return [];

    const json = await res.json();
    return json.data.children
      .filter(c => c.kind === 't3')
      .map(post => {
        const d = post.data;
        return {
          id: d.id,
          source: 'reddit',
          sourceLabel: 'r/formula1',
          sourceIcon: 'reddit',
          title: d.title,
          url: `https://reddit.com${d.permalink}`,
          publishedAt: new Date(d.created_utc * 1000).toISOString(),
          score: d.score,
          comments: d.num_comments,
          engagementScore: d.score + d.num_comments * 2,
          flair: d.link_flair_text || null,
        };
      });
  } catch (e) {
    console.error('Reddit fetch 失败:', e.message);
    return [];
  }
}
