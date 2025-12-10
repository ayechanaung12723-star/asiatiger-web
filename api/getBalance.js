import { db } from "./firebaseAdmin.js";

export default async function handler(req, res) {
  const { tgid } = req.query;

  if (!tgid) {
    return res.status(400).json({ error: "tgid required" });
  }

  try {
    const doc = await db.collection("users").doc(String(tgid)).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      balance: doc.data().balance ?? 0,
      username: doc.data().username ?? "",
    });

  } catch (e) {
    return res.status(500).json({
      error: "Server error",
      details: e.message,
    });
  }
}
