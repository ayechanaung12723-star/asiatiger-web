// games/aphogyi.js
(function(){
  const defaultSymbols = ['👑','💰','🪙','🧧','🔔','A','K','Q'];

  function qs(sel){ return document.querySelector(sel); }
  function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }

  window.initAphogyiGame = function(opts = {}){
    const gameId = opts.gameId || 'aphogyi';
    const spinEndpoint = opts.spinEndpoint || '/api/spin';
    const s = opts.selectors || {};

    const betInput = qs(s.betInput || '#betInput-aphogyi');
    const spinBtn = qs(s.spinBtn || '.controls button');
    const reelsEl = qs(s.reels || '#aphogyi-reels');
    const balanceEl = qs(s.balance || '#balanceDisplay');
    const resultEl = qs(s.result || '#aphogyi-res');
    const tgidDisplay = qs(s.tgidDisplay || '#tgidDisplay');
    const demoBtn = qs(s.demoAuthBtn || '#demoAuthBtn');

    let demoTgid = null;
    let currentBalance = 0;

    function getTgidFromUrl(){
      try{
        const p = new URLSearchParams(location.search);
        const t = p.get('tgid');
        return t && t.trim() ? t.trim() : null;
      }catch(e){ return null; }
    }

    function setTgidDisplay(){
      tgidDisplay.textContent = 'TGID: ' + (demoTgid || getTgidFromUrl() || '—');
    }
    setTgidDisplay();

    // demo TGID button
    if(demoBtn){
      demoBtn.addEventListener('click',()=>{
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
        div.textContent = sym;
        reelsEl.appendChild(div);
      });
    }

    function updateBalance(v){
      currentBalance = Number.isFinite(Number(v)) ? Number(v) : currentBalance;
      balanceEl.textContent = currentBalance;
    }
    updateBalance(currentBalance);

    async function doSpin(){
      const tgid = demoTgid || getTgidFromUrl();
      if(!tgid){ alert('TGID missing'); return; }

      const bet = Number(betInput.value||0);
      if(!Number.isFinite(bet) || bet<100 || bet>3000){ alert('Invalid bet'); return; }
      if(bet>currentBalance){ alert('Insufficient balance'); return; }

      // play spin sound
      const spinSound = qs('#spinSound'); spinSound?.play();
      const winSound = qs('#winSound');

      // start spinning animation
      renderReels(['❓','❓','❓']);

      // call API
      let resJson = null;
      try{
        const resp = await fetch(spinEndpoint,{
          method:'POST',
          headers:{
            'Content-Type':'application/json',
            'Authorization':'Bearer ' + tgid
          },
          body: JSON.stringify({tgid, game: gameId, bet})
        });
        resJson = await resp.json();
        if(!resp.ok) throw new Error(resJson?.error || 'Spin failed');
      }catch(e){
        console.warn('API fail, using local demo spin', e);
        resJson = {
          ok:true,
          reels:[
            defaultSymbols[Math.floor(Math.random()*defaultSymbols.length)],
            defaultSymbols[Math.floor(Math.random()*defaultSymbols.length)],
            defaultSymbols[Math.floor(Math.random()*defaultSymbols.length)]
          ],
          new_balance: currentBalance - bet,
          win:0
        };
      }

      renderReels(resJson.reels || ['❓','❓','❓']);
      updateBalance(resJson.new_balance || currentBalance);

      if(resJson.win>0){
        winSound?.play();
        resultEl.textContent = '🎉 WIN: +' + resJson.win;
      }else{
        resultEl.textContent = '— No win';
      }
    }

    if(spinBtn) spinBtn.addEventListener('click', doSpin);

    return {
      getBalance: ()=> currentBalance,
      setDemoTgid: (v)=>{ demoTgid = v; setTgidDisplay(); }
    };
  };

  // auto-init if Aphogyi HTML uses default selectors
  if(qs('#aphogyi-reels')) window.initAphogyiGame();
})();
