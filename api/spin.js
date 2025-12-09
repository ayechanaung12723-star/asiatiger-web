// api/spin.js
import admin from "firebase-admin";

// -------- Firebase Admin Init --------
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// -------- Helpers --------
function getClientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (xf) return xf.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

const ipBuckets = new Map();
const RATE_LIMIT_WINDOW_MS = 5000;
const RATE_LIMIT_MAX = 12;

// -------- Handler --------
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "https://asiatiger-web.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // -----------------------------
    // 1. Rate limit
    // -----------------------------
    const ip = getClientIp(req);
    const now = Date.now();
    const bucket = ipBuckets.get(ip) || { count: 0, start: now };

    if (now - bucket.start > RATE_LIMIT_WINDOW_MS) {
      bucket.count = 0;
      bucket.start = now;
    }
    bucket.count += 1;
    ipBuckets.set(ip, bucket);

    if (bucket.count > RATE_LIMIT_MAX) {
      return res.status(429).json({ error: "Too many spins, slow down" });
    }

    // -----------------------------
    // 2. Parse + Auth
    // -----------------------------
    const { tgid, game, bet } = req.body || {};
    if (!tgid || !game || !bet) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const betNum = Number(bet);
    if (!Number.isFinite(betNum) || betNum <= 0) {
      return res.status(400).json({ error: "Invalid bet" });
    }

    // login token
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const authUid = authHeader.split(" ")[1]; // token = uid
    if (String(authUid) !== String(tgid)) {
      return res.status(403).json({ error: "tgid mismatch" });
    }

    const userRef = db.collection("users").doc(String(tgid));

    // -----------------------------
    // 3. Run Transaction (REAL DATABASE)
    // -----------------------------
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw new Error("User not found");

      const user = snap.data();
      const prevBalance = Number(user.coin_balance || 0);

      if (prevBalance < betNum) throw new Error("Insufficient balance");

      // Game logic
      const winChance = 0.14;
      const isWin = Math.random() < winChance;
      const payout = isWin ? Math.round(betNum * 2.1) : 0;

      const newBalance = prevBalance - betNum + payout;

      // Update balance
      tx.update(userRef, {
        coin_balance: newBalance,
        last_game: game,
        last_play: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Write tx doc
      const txRef = userRef.collection("game_tx").doc();
      tx.set(txRef, {
        tgid,
        game,
        bet: betNum,
        win: payout,
        prev_balance: prevBalance,
        new_balance: newBalance,
        ts: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Frontend needs reels
      const symbols = ["🍒", "🍋", "🔔", "⭐", "7️⃣"];
      const reels = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ];

      return { prevBalance, newBalance, payout, reels };
    });

    return res.status(200).json({
      ok: true,
      tgid,
      game,
      bet: betNum,
      win: result.payout,
      payout: result.payout,
      prev_balance: result.prevBalance,
      new_balance: result.newBalance,
      reels: result.reels,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error("spin.js error:", err);
    return res.status(500).json({ error: err.message || "internal" });
  }
}
