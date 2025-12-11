// daily_report.js
const admin = require('firebase-admin');
const path = require('path');

const keyPath = path.join(__dirname, 'serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) });
const db = admin.firestore();

function startOfDay(d){ d.setHours(0,0,0,0); return d; }
function endOfDay(d){ d.setHours(23,59,59,999); return d; }

async function runFor(dateStr) {
  const date = new Date(dateStr);
  const from = admin.firestore.Timestamp.fromDate(startOfDay(date));
  const to = admin.firestore.Timestamp.fromDate(endOfDay(date));

  const q = db.collectionGroup('game_tx').where('ts','>=',from).where('ts','<=',to);
  const snap = await q.get();
  let totalIn = 0, totalOut = 0;
  const perUser = {}; // optional per-user totals
  snap.forEach(doc => {
    const d = doc.data();
    const win = Number(d.win || 0);
    if (win >= 0) totalIn += win; else totalOut += Math.abs(win);
    const uid = doc.ref.parent.parent ? doc.ref.parent.parent.id : 'unknown';
    perUser[uid] = perUser[uid] || 0;
    perUser[uid] += win;
  });

  const id = `daily_${dateStr}`;
  await db.collection('reports').doc(id).set({
    date: dateStr,
    total_in: totalIn,
    total_out: totalOut,
    tx_count: snap.size,
    generated_at: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('Report written', id, 'in', totalIn, 'out', totalOut, 'tx', snap.size);
}

const arg = process.argv[2];
const target = arg || (() => { const d=new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); })();
runFor(target).catch(e => { console.error(e); process.exit(1); });

runFor(target).then(()=> {
  console.log('Done');
  process.exit(0);
}).catch(e => {
  console.error('Report failed:', e && e.message ? e.message : e);
  console.error('Full error:', e);
  if (e && e.code === 9) {
    console.error('FAILED_PRECONDITION: likely missing or building index. Check Firestore Indexes console.');
  }
  process.exit(1);
});

