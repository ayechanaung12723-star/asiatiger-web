// test_query.js (temporary)
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

async function test() {
  try {
    const from = admin.firestore.Timestamp.fromDate(new Date('2025-12-04T00:00:00Z'));
    const to = admin.firestore.Timestamp.fromDate(new Date('2025-12-04T23:59:59Z'));
    const q = db.collectionGroup('game_tx').where('ts','>=',from).where('ts','<=',to).limit(1);
    const snap = await q.get();
    console.log('OK, docs:', snap.size);
    snap.forEach(d => console.log(d.id, d.data()));
  } catch (e) {
    console.error('TEST ERROR:', e.code, e.message);
    if (e.details) console.error('details:', e.details);
    if (e.metadata) console.error('metadata:', e.metadata);
  }
}
test();
