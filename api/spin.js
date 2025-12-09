// api/spin.js  (overwrite in your repo, demo mode, no SERVICE_ACCOUNT required)
const ipBuckets = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 1000;
const RATE_LIMIT_MAX = 10;

function getClientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (xf) return xf.split(',')[0].trim();
  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : 'unknown';
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://asiatiger-web.vercel.app'); // fixed origin
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // rate limit
    const ip = getClientIp(req);
    const now = Date.now();
    const bucket = ipBuckets.get(ip) || { count: 0, start: now };
    if (now - bucket.start > RATE_LIMIT_WINDOW_MS) { bucket.count = 0; bucket.start = now; }
    bucket.count += 1;
    ipBuckets.set(ip, bucket);
    if (bucket.count > RATE_LIMIT_MAX) return res.status(429).json({ error: 'Too many requests' });

    // parse body
    const { tgid, game, bet } = req.body || {};
    if (!tgid || !game || !bet) return res.status(400).json({ error: 'Missing params' });
    const betNum = Number(bet);
    if (!Number.isFinite(betNum) || betNum <= 0) return res.status(400).json({ error: 'Invalid bet' });

    // simulate auth check (demo)
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    // decode token simulation
    const authUid = authHeader.split(' ')[1]; // just use token string as UID

    if (String(authUid) !== String(tgid)) {
      return res.status(403).json({ error: 'tgid mismatch' });
    }

    // simulate win/loss
    const win = Math.random() < 0.15; // 15% win chance
    const payout = win ? Math.round(betNum * 2) : 0;

    // simulate balances (demo only, no DB)
    const prevBalance = 1000; // dummy starting balance
    const newBalance = prevBalance - betNum + payout;

    // generate random reels
    const symbols = ['🍒','🍋','🔔','⭐','7️⃣'];
    const reels = [
      symbols[Math.floor(Math.random()*symbols.length)],
      symbols[Math.floor(Math.random()*symbols.length)],
      symbols[Math.floor(Math.random()*symbols.length)]
    ];

    return res.status(200).json({
      ok: true,
      tgid,
      game,
      bet: betNum,
      win: payout,
      payout,
      prev_balance: prevBalance,
      new_balance: newBalance,
      reels,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('spin handler error', err);
    return res.status(500).json({ error: err.message || 'internal' });
  }
}
