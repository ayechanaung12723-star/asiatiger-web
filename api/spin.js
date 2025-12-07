// api/spin.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tgid, game, bet, clientSeed } = req.body || {};
    if (!tgid || !game) return res.status(400).json({ error: 'Missing parameters' });

    // Demo logic — replace with real validation and game logic later
    const win = Math.random() < 0.5;
    const payout = win ? Number(bet) * 2 : 0;

    const result = {
      tgid,
      game,
      bet: Number(bet),
      clientSeed,
      win,
      payout,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(result);
  } catch (err) {
    console.error('api/spin error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
