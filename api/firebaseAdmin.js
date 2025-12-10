import * as admin from "firebase-admin";

function cleanKey(k) {
  if (!k) return null;
  return k.replace(/\\n/g, "\n");
}

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = cleanKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ Firebase ENV Missing", {
      projectId: !!projectId,
      clientEmail: !!clientEmail,
      privateKey: !!privateKey
    });
    throw new Error("Firebase Admin ENV Missing");
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    databaseURL: `https://${projectId}.firebaseio.com`,
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
