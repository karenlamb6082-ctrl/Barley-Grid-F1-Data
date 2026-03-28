// Vercel Serverless Function — 代理 F1 LiveTiming API 请求
// 路径格式: /api/f1timing/{任意路径} → https://livetiming.formula1.com/static/{任意路径}

export default async function handler(req, res) {
  // 从请求路径中提取目标路径
  const { path } = req.query;
  const targetPath = Array.isArray(path) ? path.join('/') : path;
  const targetUrl = `https://livetiming.formula1.com/static/${targetPath}`;

  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'F1-Dashboard/1.0',
      },
    });

    // 透传状态码
    if (!response.ok) {
      return res.status(response.status).json({ error: `上游返回 ${response.status}` });
    }

    const data = await response.text();
    
    // 设置缓存头（练习赛数据不会频繁变化，可以缓存 5 分钟）
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(data);
  } catch (error) {
    console.error('代理请求失败:', error);
    return res.status(502).json({ error: '代理请求失败', message: error.message });
  }
}
