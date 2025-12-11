// create_user_worker.js
// Run on your admin machine (trusted). Requires serviceAccountKey.json in same folder.
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const keyPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(keyPath)) {
  console.error('Missing serviceAccountKey.json in this folder. Place your service account key here.');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) });
const db = admin.firestore();

async function processPending() {
  console.log('Checking for pending create_user requests...');
  const q = db.collection('admin_requests').where('type', '==', 'create_user').where('status', '==', 'pending').orderBy('created_at').limit(10);
  const snap = await q.get();
  if (snap.empty) {
    console.log('No pending requests.');
    return;
  }
  for (const doc of snap.docs) {
    const req = doc.data();
    const id = doc.id;
    const tgid = String(req.tgid);
    const password = String(req.password);
    const initialCoins = Number(req.initial_coins || 0);
    console.log(`Processing request ${id} for tgid=${tgid}`);

    try {
      // Create Auth user with uid = tgid (if not exists)
      let userRecord;
      try {
        userRecord = await admin.auth().getUser(tgid);
        console.log('User already exists in Auth:', tgid);
      } catch (e) {
        // not found -> create
        userRecord = await admin.auth().createUser({
          uid: tgid,
          email: `${tgid}@asiatiger.local`,
          password: password,
          emailVerified: false,
          disabled: false
        });
        console.log('Auth user created:', userRecord.uid);
      }

      // Create or update users/{tgid} doc
      const userRef = db.collection('users').doc(tgid);
      const snapUser = await userRef.get();
      const prevBalance = snapUser.exists ? Number(snapUser.data().coin_balance || 0) : 0;
      const newBalance = prevBalance + initialCoins;

      await userRef.set({
        email: `${tgid}@asiatiger.local`,
        coin_balance: newBalance,
        vip_tier: (snapUser.exists && snapUser.data().vip_tier) ? snapUser.data().vip_tier : 'Bronze',
        must_change_password: false,
        created_by: req.created_by || 'admin_worker',
        created_at: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Write a game_tx audit entry
      const txRef = userRef.collection('game_tx').doc();
      await txRef.set({
        game: 'admin_create',
        bet: 0,
        win: initialCoins,
        prev_balance: prevBalance,
        new_balance: newBalance,
        vip_tier: (snapUser.exists && snapUser.data().vip_tier) ? snapUser.data().vip_tier : 'Bronze',
        note: 'initial topup on create',
        ts: admin.firestore.FieldValue.serverTimestamp(),
        admin: req.created_by || 'admin_worker'
      });

      // Mark request processed
      await db.collection('admin_requests').doc(id).update({
        status: 'done',
        processed_at: admin.firestore.FieldValue.serverTimestamp(),
        processed_by: 'admin_worker'
      });

      // Log admin action
      await db.collection('admin_logs').add({
        admin_email: req.created_by || 'admin_worker',
        tgid,
        action: 'create_user',
        amount: initialCoins,
        prev_balance: prevBalance,
        new_balance: newBalance,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Request ${id} processed successfully for ${tgid}`);
    } catch (err) {
      console.error('Error processing request', id, err);
      // mark failed
      await db.collection('admin_requests').doc(id).update({
        status: 'error',
        error_message: String(err.message || err),
        processed_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }
}

async function loop() {
  while (true) {
    try {
      await processPending();
    } catch (e) {
      console.error('Worker error', e);
    }
    // wait 6 seconds before next check
    await new Promise(r => setTimeout(r, 6000));
  }
}

loop();
