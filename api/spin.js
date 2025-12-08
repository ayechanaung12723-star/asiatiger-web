// api/spin.js

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { tgid, game, bet } = req.body || {};
    if (!tgid || !game || !bet) return res.status(400).json({ error: 'Missing parameters' });

    const betNum = Number(bet);
    if (!Number.isFinite(betNum) || betNum <= 0) return res.status(400).json({ error: 'Invalid bet amount' });

    // Demo spin logic
    const win = Math.random() < 0.5;
    const payout = win ? Math.round(betNum * 2) : 0;

    return res.status(200).json({
      tgid,
      game,
      bet: betNum,
      win,
      payout,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("Spin API error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
