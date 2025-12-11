(function(){
  const symbols=['🐼','🍚','🎋','🔔','💠','A','K','Q'];
  const payouts={'🐼':300,'🍚':120,'🎋':80,'🔔':40,'💠':20};
  const reelsEl=document.getElementById('panda-reels');

  function genReels(){ const r=[]; for(let i=0;i<6;i++){ const h=3+Math.floor(Math.random()*2); r[i]=[]; for(let j=0;j<h;j++) r[i].push(symbols[Math.floor(Math.random()*symbols.length)]); } return r; }
  function render(reels){ if(!reelsEl) return; reelsEl.innerHTML=''; reels.forEach(col=>{ const c=document.createElement('div'); c.className='col'; col.forEach(s=>{ const cell=document.createElement('div'); cell.className='cell'; cell.textContent=s; c.appendChild(cell); }); reelsEl.appendChild(c); }); }
  function calc(reels){ let total=0; const rows=[]; for(let i=0;i<reels.length;i++) rows.push(Math.floor(Math.random()*reels[i].length)); const first=reels[0][rows[0]]; if(!payouts[first]) return total; let count=1; for(let i=1;i<reels.length;i++){ if(reels[i][rows[i]]===first) count++; else break; } if(count>=3) total += payouts[first] * (count-2); return total; }

  window.spinPanda = async function(){
    const bet = parseInt(document.getElementById('betInput-panda').value, 10); if (isNaN(bet)||bet<100||bet>3000){ alert('Invalid bet'); return; }
    document.getElementById('spinSound').play();
    const reels=genReels(); render(reels); const raw=calc(reels);
    const win = Math.floor(raw * vipRtpMultiplier(vip)); if (win>0) document.getElementById('winSound').play();
    document.getElementById('panda-res').textContent = raw>0?`Won ${raw} coins`:'No win';
    await applySpin('slot-panda', bet, win);
  }
})();
