// games/aphogyi.js
(function(){
  const symbols = ['👑','💰','🪙','🧧','🔔','A','K','Q'];

  const reelsWrap = document.getElementById('aphogyiReels');
  const balanceEl = document.getElementById('balance');
  const tgidEl = document.getElementById('tgidDisplay');
  const spinBtn = document.getElementById('spinBtn');
  const demoBtn = document.getElementById('demoAuthBtn');
  const betInput = document.getElementById('betInput');
  const resultEl = document.getElementById('result');

  let demoTgid = null;
  let currentBalance = 1000;
  balanceEl.textContent = 'Balance: ' + currentBalance;

  function getTgidFromUrl(){
    const p = new URLSearchParams(location.search);
    return (p.get('tgid') || '').trim() || null;
  }

  function updateTgidDisplay(){
    tgidEl.textContent = 'TGID: ' + (demoTgid || getTgidFromUrl() || '—');
  }
  updateTgidDisplay();

  if(demoBtn){
    demoBtn.addEventListener('click', ()=>{
      const val = prompt('Enter demo TGID');
      if(val){ demoTgid = val.trim(); updateTgidDisplay(); }
    });
  }

  function renderReels(reels){
    if(!reelsWrap) return;
    reelsWrap.innerHTML = '';
    reels.forEach(sym=>{
      const div = document.createElement('div');
      div.className = 'cell';
      div.textContent = sym;
      reelsWrap.appendChild(div);
    });
  }

  async function doSpin(){
    const tgid = demoTgid || getTgidFromUrl();
    if(!tgid){ alert('TGID missing'); return; }

    const bet = Number(betInput.value||0);
    if(!Number.isFinite(bet) || bet<100 || bet>3000){ alert('Invalid bet'); return; }
    if(bet>currentBalance){ alert('Insufficient balance'); return; }

    let reels = [];
    let win = 0;

    try{
      const res = await fetch('/api/spin',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization':'Bearer ' + tgid
        },
        body: JSON.stringify({ tgid, game:'slot-aphogyi', bet })
      });
      const data = await res.json();
      if(res.ok){
        reels = data.reels || ['❓','❓','❓'];
        win = data.win || 0;
        currentBalance = data.new_balance ?? currentBalance;
      }else{
        throw new Error(data.error || 'Spin failed');
      }
    }catch(e){
      console.warn('API fail, fallback local spin', e);
      reels = [symbols[Math.floor(Math.random()*symbols.length)],
               symbols[Math.floor(Math.random()*symbols.length)],
               symbols[Math.floor(Math.random()*symbols.length)]];
      win = 0;
      currentBalance -= bet;
    }

    renderReels(reels);
    balanceEl.textContent = 'Balance: ' + currentBalance;
    resultEl.textContent = win>0 ? '🎉 WIN: +' + win : '— No win';
  }

  if(spinBtn) spinBtn.addEventListener('click', doSpin);
})();
