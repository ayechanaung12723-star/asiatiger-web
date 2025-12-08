(function(){
  const symbols=['🐫','☥','🪙','🔶','🌙','A','K','Q'];
  const paytable={'🐫':200,'☥':120,'🪙':80,'🔶':40,'🌙':25};
  const paylines=[[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2]];
  const reelsEl=document.getElementById('egypt-reels');
  const payEl=document.getElementById('egypt-pay');
  if (payEl) payEl.innerHTML=Object.entries(paytable).map(e=>`<div style="padding:6px">${e[0]} ×3+ = ${e[1]}</div>`).join('');

  function genReels(){ const r=[]; for(let c=0;c<5;c++){ r[c]=[]; for(let rI=0;rI<3;rI++) r[c].push(symbols[Math.floor(Math.random()*symbols.length)]); } return r; }
  function render(reels){ if(!reelsEl) return; reelsEl.innerHTML=''; reels.forEach(col=>{ const c=document.createElement('div'); c.className='col'; col.forEach(s=>{ const cell=document.createElement('div'); cell.className='cell'; cell.textContent=s; c.appendChild(cell); }); reelsEl.appendChild(c); }); }
  function calc(reels){ let total=0; let scat=0; paylines.forEach(line=>{ const sym=reels[0][line[0]]; if(!paytable[sym]) return; let count=1; for(let i=1;i<5;i++){ if(reels[i][line[i]]===sym) count++; else break; } if(count>=3) total += paytable[sym] * (count-2); }); for(let c=0;c<5;c++) for(let r=0;r<3;r++) if(reels[c][r]==='🌙') scat++; if(scat>=3) total += 100 * scat; return {total,scat}; }

  window.spinEgypt = async function(){
    const bet = parseInt(document.getElementById('betInput-egypt').value, 10); if (isNaN(bet)||bet<100||bet>3000){ alert('Invalid bet'); return; }
    document.getElementById('spinSound').play();
    const reels=genReels(); render(reels); const res=calc(reels);
    const win = Math.floor(res.total * vipRtpMultiplier(vip)); if (win>0) document.getElementById('winSound').play();
    document.getElementById('egypt-res').textContent = res.total>0?`Won ${res.total} coins`:`No win${res.scat>=3?' — Scatter! Free spins unlocked':''}`;
    await applySpin('slot-egypt', bet, win);
  }
})();
