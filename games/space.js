(function(){
  const symbols=['🚀','🪐','🌌','👾','🔭','A','K','Q'];
  const pay={'🚀':200,'🪐':120,'🌌':80,'👾':40,'🔭':20};
  const reelsEl=document.getElementById('space-reels');

  function genReels(){
    const r=[];
    for(let c=0;c<5;c++){
      r[c]=[];
      for(let rI=0;rI<3;rI++){
        r[c].push(symbols[Math.floor(Math.random()*symbols.length)]);
      }
    }
    return r;
  }

  function render(reels){
    if(!reelsEl) return;
    reelsEl.innerHTML='';
    reels.forEach(col=>{
      const c=document.createElement('div');
      c.className='col';
      col.forEach(s=>{
        const cell=document.createElement('div');
        cell.className='cell';
        cell.textContent=s;
        c.appendChild(cell);
      });
      reelsEl.appendChild(c);
    });
  }

  function calc(reels){
    let total=0;
    for(let r=0;r<3;r++){
      const sym=reels[0][r];
      if(!pay[sym]) continue;
      let count=1;
      for(let c=1;c<5;c++){
        if(reels[c][r]===sym) count++;
        else break;
      }
      if(count>=3) total += pay[sym] * (count-2);
    }
    return total;
  }

  window.spinSpace = async function(){
    const bet = parseInt(document.getElementById('betInput-space').value, 10);
    if (isNaN(bet)||bet<100||bet>3000){ alert('Invalid bet'); return; }
    document.getElementById('spinSound').play();
    const reels=genReels(); render(reels); const raw=calc(reels);
    const win = Math.floor(raw * vipRtpMultiplier(vip));
    if (win>0) document.getElementById('winSound').play();
    document.getElementById('space-res').textContent = raw>0?`Won ${raw} coins`:'No win';
    await applySpin('slot-space', bet, win);
  }
})();
