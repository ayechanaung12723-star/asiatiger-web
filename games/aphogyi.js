// games/aphogyi.js
// Module-compatible, deploy-ready

import { getAuth } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

(function(){
  const symbols = ['👑','💰','🪙','🧧','🔔','A','K','Q'];
  const pay = {'👑':300,'💰':180,'🪙':100,'🧧':60,'🔔':30};

  const reelsEl = document.getElementById('aphogyi-reels');
  const balanceEl = document.getElementById('balanceDisplay');
  const tgidEl = document.getElementById('tgidDisplay');
  const spinBtn = document.querySelector('.controls button');

  let demoTgid = null;
  let currentBalance = 0;

  function getTgidFromUrl() {
    const p = new URLSearchParams(location.search);
    const t = p.get('tgid'); 
    return t ? t.trim() : null;
  }

  function setTgidDisplay() {
    tgidEl.textContent = 'TGID: ' + (demoTgid || getTgidFromUrl() || '—');
  }
  setTgidDisplay();

  const demoBtn = document.getElementById('demoAuthBtn');
  if(demoBtn){
    demoBtn.addEventListener('click', ()=>{
      const d = prompt('Enter demo TGID');
      if(d){ demoTgid = d.trim(); setTgidDisplay(); }
    });
  }

  function renderReels(reels){
    if(!reelsEl) return;
    reelsEl.innerHTML = '';
    reels.forEach(sym=>{
      const div = document.createElement('div');
      div.className='cell';
      div.textContent=sym;
      reelsEl.appendChild(div);
    });
  }

  async function applySpin(gameId, bet, win){
    const tgid = demoTgid || getTgidFromUrl();
    if(!tgid) return;

    try {
      const res = await fetch('/api/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + tgid
        },
        body: JSON.stringify({ tgid, game: gameId, bet })
      });
      const data = await res.json();
      if(res.ok){
        currentBalance = data.new_balance ?? currentBalance;
        balanceEl.textContent = currentBalance;
      }
    } catch(e){ console.error(e); }
  }

  async function doSpin(){
    const tgid = demoTgid || getTgidFromUrl();
    if(!tgid){ alert('TGID missing'); return; }

    const betInput = document.getElementById('betInput-aphogyi');
    const bet = Number(betInput.value||0);
    if(!Number.isFinite(bet) || bet<100 || bet>3000){ alert('Invalid bet'); return; }
    if(bet>currentBalance){ alert('Insufficient balance'); return; }

    document.getElementById('spinSound').play();

    let resJson = null;
    try{
      const resp = await fetch('/api/spin',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization':'Bearer '+tgid
        },
        body: JSON.stringify({ tgid, game:'aphogyi', bet })
      });
      resJson = await resp.json();
      if(!resp.ok) throw new Error(resJson?.error || 'Spin failed');
    }catch(e){
      console.warn('API fail, fallback local spin', e);
      resJson = {
        ok:true,
        reels:[symbols[Math.floor(Math.random()*symbols.length)],
               symbols[Math.floor(Math.random()*symbols.length)],
               symbols[Math.floor(Math.random()*symbols.length)]],
        new_balance: currentBalance - bet,
        win:0
      };
    }

    renderReels(resJson.reels||['❓','❓','❓']);
    currentBalance = resJson.new_balance ?? currentBalance;
    balanceEl.textContent = currentBalance;

    if(resJson.win>0){
      document.getElementById('winSound').play();
      document.getElementById('aphogyi-res').textContent = '🎉 WIN: +' + resJson.win;
    }else{
      document.getElementById('aphogyi-res').textContent = '— No win';
    }

    await applySpin('slot-aphogyi', bet, resJson.win || 0);
  }

  if(spinBtn) spinBtn.addEventListener('click', doSpin);
})();
