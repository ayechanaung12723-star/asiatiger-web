import { db } from "./firebaseAdmin";

export default async function handler(req, res) {
  const { gameId } = req.query;

  if (!gameId) {
    return res.status(400).json({ error: "gameId required" });
  }

  try {
    const doc = await db.collection("users").doc(gameId).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      balance: doc.data().balance,
      username: doc.data().username,
    });
  } catch (e) {
    res.status(500).json({ error: "Server error", details: e.message });
  }
}
