import { readSourceHealth } from '../lib/redis.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const health = await readSourceHealth();
    return res.status(200).json(health || {
      status: 'warming-up',
      lastCollectedAt: null,
      message: '云端采集尚未完成首次运行',
    });
  } catch (error) {
    return res.status(503).json({ status: 'unavailable', error: error.message });
  }
}
