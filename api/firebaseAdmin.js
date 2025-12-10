import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ Missing Firebase environment variables");
  }

  let fixedKey = privateKey;
  try {
    // Handle escaped newlines
    fixedKey = privateKey.replace(/\\n/g, "\n");
  } catch (e) {
    console.error("❌ Private key replace() failed", e);
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: fixedKey,
      }),
    });
  } catch (error) {
    console.error("🔥 Firebase Admin init error:", error);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
