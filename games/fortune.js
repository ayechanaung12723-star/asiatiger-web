(function(){
  const symbols=['🐯','🧧','💰','🎋','🔔','A','K','Q'];
  const pay={'🐯':260,'🧧':150,'💰':90,'🎋':60,'🔔':30};
  const el=document.getElementById('fortune-reels');

  function gen(){
    const g=[]; for(let c=0;c<5;c++){ g[c]=[]; for(let r=0;r<3;r++){ g[c].push(symbols[Math.floor(Math.random()*symbols.length)]); } }
    return g;
  }
  function render(g){
    if(!el) return; el.innerHTML='';
    g.forEach(col=>{
      const c=document.createElement('div'); c.className='col';
      col.forEach(s=>{ const d=document.createElement('div'); d.className='cell'; d.textContent=s; c.appendChild(d); });
      el.appendChild(c);
    });
  }
  function calc(g){
    let total=0;
    for(let r=0;r<3;r++){
      const first=g[0][r]; if(!pay[first]) continue;
      let count=1; for(let c=1;c<5;c++){ if(g[c][r]===first) count++; else break; }
      if(count>=3) total += pay[first] * (count-2);
    }
    return total;
  }

  window.spinFortune = async function(){
    const bet=parseInt(document.getElementById('betInput-fortune').value,10);
    if(isNaN(bet)||bet<100||bet>3000){ alert('Invalid bet'); return; }
    document.getElementById('spinSound').play();
    const reels=gen(); render(reels);
    const raw=calc(reels);
    const win=Math.floor(raw*vipRtpMultiplier(vip));
    if(win>0) document.getElementById('winSound').play();
    document.getElementById('fortune-res').textContent = raw>0?`Won ${raw} coins`:'No win';
    await applySpin('slot-fortune', bet, win);
  }
})();
