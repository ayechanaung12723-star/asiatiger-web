(function(){
  // Kywe — Buffalo Festival (3×3)
  const symbols = ['🐃','🌾','🎉','🍃','🪙','A','K','Q'];
  const pay = {'🐃':200,'🌾':120,'🎉':80,'🍃':40,'🪙':20};

  const reelsEl = document.getElementById('kywe-reels');

  function genReels(){
    const g = [];
    for (let c = 0; c < 3; c++){
      g[c] = [];
      for (let r = 0; r < 3; r++){
        g[c].push(symbols[Math.floor(Math.random()*symbols.length)]);
      }
    }
    return g;
  }

  function render(g){
    if (!reelsEl) return;
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

  function calc(g){
    // Simple horizontal line wins on 3×3
    let total = 0;
    for (let r = 0; r < 3; r++){
      const first = g[0][r];
      if (!pay[first]) continue;
      let count = 1;
      for (let c = 1; c < 3; c++){
        if (g[c][r] === first) count++;
        else break;
      }
      if (count >= 3){
        total += pay[first] * (count - 2); // only 3-in-a-row possible
      }
    }
    return total;
  }

  window.spinKywe = async function(){
    const bet = parseInt(document.getElementById('betInput-kywe').value, 10);
    if (isNaN(bet) || bet < 100 || bet > 3000){ alert('Invalid bet'); return; }

    document.getElementById('spinSound').play();

    const reels = genReels();
    render(reels);

    const raw = calc(reels);
    const win = Math.floor(raw * vipRtpMultiplier(vip));

    if (win > 0) document.getElementById('winSound').play();

    document.getElementById('kywe-res').textContent = raw > 0 ? `Won ${raw} coins` : 'No win';

    await applySpin('slot-kywe', bet, win);
  };
})();
