(function(){
  const symbols = ['🏯','💰','🪙','🌸','🛕','A','K','Q','J'];
  const pay = {'🏯':300,'💰':180,'🪙':100,'🌸':60,'🛕':30};
  const C = 5, R = 4;

  const reelsEl = document.getElementById('myanmar-reels');
  const payEl = document.getElementById('myanmar-pay');
  if (payEl) payEl.innerHTML = Object.entries(pay).map(([sym,val]) => `<div style="padding:6px">${sym} ×3+ = ${val}</div>`).join('');

  function genReels(){
    const g = [];
    for(let c=0;c<C;c++){
      g[c] = [];
      for(let r=0;r<R;r++){
        g[c].push(symbols[Math.floor(Math.random()*symbols.length)]);
      }
    }
    return g;
  }

  function render(g){
    if(!reelsEl) return;
    reelsEl.innerHTML = '';
    g.forEach(col=>{
      const c = document.createElement('div');
      c.className = 'col';
      col.forEach(s=>{
        const d = document.createElement('div');
        d.className = 'cell';
        d.textContent = s;
        c.appendChild(d);
      });
      reelsEl.appendChild(c);
    });
  }

  const paylines = [
    [1,1,1,1,1],
    [0,1,2,3,3],
    [3,2,1,0,0],
  ];

  function lineWins(g){
    let total = 0;
    for(const line of paylines){
      const first = g[0][line[0]];
      if(!pay[first]) continue;
      let count = 1;
      for(let c=1;c<C;c++){
        const r = line[c] ?? line[line.length-1];
        if(g[c][r] === first) count++;
        else break;
      }
      if(count >= 3){
        total += pay[first] * (count - 2);
      }
    }
    return total;
  }

  function scatterCount(g){
    let s = 0;
    for(let c=0;c<C;c++) for(let r=0;r<R;r++){
      if(g[c][r] === '🌸') s++;
    }
    return s;
  }

  function bonusScroll(){
    const prizes = [80,120,200,300,500,800];
    return prizes[Math.floor(Math.random()*prizes.length)];
  }

  window.spinMyanmar = async function(){
    const bet = parseInt(document.getElementById('betInput-myanmar').value, 10);
    if (isNaN(bet) || bet < 100 || bet > 3000) { alert('Invalid bet'); return; }

    document.getElementById('spinSound').play();

    let grid = genReels();
    render(grid);

    let total = lineWins(grid);

    const scat = scatterCount(grid);
    if(scat >= 4){
      let bonus = 0;
      const spins = 3 + Math.floor(Math.random()*3);
      for(let i=0;i<spins;i++){
        bonus += bonusScroll();
      }
      total += bonus;
      document.getElementById('myanmar-res').textContent = `Lotus Scatter! +${bonus} coins — Total ${total}`;
    } else {
      document.getElementById('myanmar-res').textContent = total>0 ? `Won ${total} coins` : 'No win';
    }

    const win = Math.floor(total * vipRtpMultiplier(vip));
    if (win > 0) document.getElementById('winSound').play();

    await applySpin('slot-myanmar', bet, win);
  }
})();
