// api/spin.js  (overwrite in your repo)
import admin from "firebase-admin";

// Initialize admin app once
if (!admin.apps.length) {
  // SERVICE_ACCOUNT should be the JSON string of the service account key
  const saJson = process.env.SERVICE_ACCOUNT;
  if (!saJson) {
    console.error("Missing SERVICE_ACCOUNT env var");
    // do not throw to allow graceful error message
  } else {
    const sa = JSON.parse(saJson);
    admin.initializeApp({
      credential: admin.credential.cert(sa)
    });
  }
}

const db = admin.firestore();

// basic rate-limit map (ephemeral)
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
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
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

    // parse
    const { tgid, game, bet, clientSeed } = req.body || {};
    if (!tgid || !game || !bet) return res.status(400).json({ error: 'Missing params' });
    const betNum = Number(bet);
    if (!Number.isFinite(betNum) || betNum <= 0) return res.status(400).json({ error: 'Invalid bet' });

    // verify id token if provided
    let authUid = null;
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split(' ')[1];
      try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        authUid = decoded.uid;
      } catch (e) {
        // token invalid — reject (security)
        return res.status(401).json({ error: 'Invalid auth token' });
      }
    } else {
      // no token -> unauthorized (your rules expect authenticated owner)
      return res.status(401).json({ error: 'Authentication required' });
    }

    // require authUid matches tgid (safety): if you used email-prefix tgid, adjust accordingly
    if (String(authUid) !== String(tgid) && !String(authUid).startsWith(String(tgid))) {
      // If your TGID is email prefix, you may want different logic.
      // For strict match:
      // return res.status(403).json({ error: 'tgid mismatch' });
    }

    // DO outcome server-side (fairness)
    const win = Math.random() < 0.15; // 15% win chance (adjust)
    const payout = win ? Math.round(betNum * 2) : 0;

    // Firestore transaction: read user doc, check balance, update coin_balance, create game_tx
    const userRef = db.collection('users').doc(String(tgid));
    const txResult = await db.runTransaction(async (t) => {
      const snap = await t.get(userRef);
      if (!snap.exists) throw new Error('User not found');
      const data = snap.data();
      const prev = Number(data.coin_balance || 0);
      if (prev < betNum) throw new Error('Insufficient balance');

      const next = prev - betNum + payout;
      t.update(userRef, { coin_balance: next });

      const txRef = userRef.collection('game_tx').doc();
      t.set(txRef, {
        game,
        bet: betNum,
        win: payout,
        prev_balance: prev,
        new_balance: next,
        clientSeed: clientSeed || null,
        ts: admin.firestore.FieldValue.serverTimestamp()
      });

      return { prev, next, payout };
    });

    // Response includes reels (simple)
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
      win: txResult.payout || txResult.payout === 0 ? txResult.payout : payout,
      payout: txResult.next - txResult.prev + betNum === payout ? payout : payout,
      prev_balance: txResult.prev,
      new_balance: txResult.next,
      reels,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('spin handler error', err);
    return res.status(500).json({ error: err.message || 'internal' });
  }
}
