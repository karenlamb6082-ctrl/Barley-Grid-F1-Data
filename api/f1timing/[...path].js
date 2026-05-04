// Vercel serverless proxy for F1 LiveTiming static JSON.
// /api/f1timing/{path} -> https://livetiming.formula1.com/static/{path}

export default async function handler(req, res) {
  const { path } = req.query;
  const targetPath = Array.isArray(path) ? path.join('/') : path;
  const targetUrl = `https://livetiming.formula1.com/static/${targetPath}`;

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

    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream returned ${response.status}` });
    }

    const data = await response.text();
    res.setHeader('Cache-Control', getCacheControl(targetPath));
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(data);
  } catch (error) {
    console.error('LiveTiming proxy failed:', error);
    return res.status(502).json({ error: 'Proxy request failed', message: error.message });
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
