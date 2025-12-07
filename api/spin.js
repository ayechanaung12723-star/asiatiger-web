// api/spin.js
// Overwrite this file in your repo and push to trigger a Vercel redeploy.

const RATE_LIMIT_WINDOW_MS = 10 * 1000; // 10 seconds window
const RATE_LIMIT_MAX = 10; // max requests per IP per window (adjust as needed)
const ipBuckets = new Map(); // very basic in-memory bucket (ephemeral in serverless)

function getClientIp(req) {
  // Vercel sets x-forwarded-for; fallback to connection remoteAddress
  const xf = req.headers['x-forwarded-for'];
  if (xf) return xf.split(',')[0].trim();
  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : 'unknown';
}

export default async function handler(req, res) {
  // Allowed origin can be set via environment variable for safety
  const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
  // Optional demo key to protect public endpoint; set DEMO_KEY in Vercel env if you want
  const DEMO_KEY = process.env.DEMO_KEY || null;

  // CORS preflight handling
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-demo-key');
    res.setHeader('Access-Control-Max-Age', '600');
    return res.status(204).end();
  }

  // Always set CORS for actual responses
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-demo-key');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Optional demo key check
    if (DEMO_KEY) {
      const key = req.headers['x-demo-key'] || '';
      if (key !== DEMO_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    // Basic rate limiting per IP (in-memory)
    const ip = getClientIp(req);
    const now = Date.now();
    const bucket = ipBuckets.get(ip) || { count: 0, start: now };
    if (now - bucket.start > RATE_LIMIT_WINDOW_MS) {
      // reset window
      bucket.count = 0;
      bucket.start = now;
    }
    bucket.count += 1;
    ipBuckets.set(ip, bucket);
    if (bucket.count > RATE_LIMIT_MAX) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    // Parse body (Vercel usually parses JSON automatically)
    const { tgid, game, bet, clientSeed } = req.body || {};
    if (!tgid || !game) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    // Validate bet numeric and reasonable
    const betNum = Number(bet || 0);
    if (!Number.isFinite(betNum) || betNum <= 0 || betNum > 1000000) {
      return res.status(400).json({ error: 'Invalid bet amount' });
    }

    // Demo game logic
    const win = Math.random() < 0.5;
    const payout = win ? Math.round(betNum * 2) : 0;

    const result = {
      tgid,
      game,
      bet: betNum,
      clientSeed: clientSeed || null,
      win,
      payout,
      timestamp: new Date().toISOString()
    };

    // Optional: log minimal info for debugging
    console.log('spin', { ip, tgid, game, bet: betNum, win });

    return res.status(200).json(result);
  } catch (err) {
    console.error('api/spin error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
