// Vercel Serverless Function — 代理 F1 LiveTiming API
// 使用方式: /api/f1proxy?path=2026/Index.json

export default async function handler(req, res) {
  const targetPath = req.query.path;
  if (!targetPath) {
    return res.status(400).json({ error: '缺少 path 参数' });
  }

  const targetUrl = `https://livetiming.formula1.com/static/${targetPath}`;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'F1-Dashboard/1.0',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `上游返回 ${response.status}` });
    }

    const data = await response.text();
    res.setHeader('Cache-Control', getCacheControl(targetPath));
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(data);
  } catch (error) {
    console.error('代理请求失败:', error);
    return res.status(502).json({ error: '代理请求失败', message: error.message });
  }
}

function getCacheControl(path) {
  const value = String(path);
  if (value.endsWith('TimingData.json')) {
    return 's-maxage=30, stale-while-revalidate=30';
  }
  if (value.endsWith('Index.json')) {
    return 's-maxage=300, stale-while-revalidate=120';
  }
  return 's-maxage=120, stale-while-revalidate=60';
}
