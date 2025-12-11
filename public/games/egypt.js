// games/egypt.js
// Game adapter for "egypt" theme. Keep generic small — symbols + UI wiring.
// Exposes window.initEgyptGame(opts)

(function(){
  const defaultSymbols = ['🏺','🐫','👑','🔶','⭐']; // Egypt-themed emoji
  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

  window.initEgyptGame = function(opts = {}) {
    const gameId = opts.gameId || 'egypt';
    const spinEndpoint = opts.spinEndpoint || '/api/spin';
    const s = opts.selectors || {};
    const betInput = qs(s.betInput || '#betInput');
    const spinBtn = qs(s.spinBtn || '#spinBtn');
    const reelsEls = (s.reels || ['#r1','#r2','#r3']).map(sel => qs(sel));
    const balanceEl = qs(s.balance || '#balance');
    const resultEl = qs(s.result || '#result');
    const statusEl = qs(s.status || '#statusText');
    const tgidDisplay = qs(s.tgidDisplay || '#tgidDisplay');
    const demoAuthBtn = qs(s.demoAuthBtn || '#demoAuthBtn');

    // helpers: read tgid from URL param ?tgid=...
    function getTgidFromUrl() {
      try {
        const p = new URLSearchParams(location.search);
        const t = p.get('tgid');
        return t && t.trim() ? t.trim() : null;
      } catch(e){ return null; }
    }

    // store demo tgid in-memory (for quick testing)
    let demoTgid = getTgidFromUrl();

    function setTgidDisplay() {
      tgidDisplay.textContent = 'TGID: ' + (demoTgid || '—');
    }
    setTgidDisplay();

    // spin UI helpers
    function randomSymbols(n=3) {
      const out = [];
      for(let i=0;i<n;i++) out.push(defaultSymbols[Math.floor(Math.random()*defaultSymbols.length)]);
      return out;
    }

    function animateStart() {
      reelsEls.forEach(el => el.classList.add('spinning'));
    }
    function animateStop(finalSymbols) {
      reelsEls.forEach((el, idx) => {
        el.classList.remove('spinning');
        el.textContent = finalSymbols[idx] || '❓';
      });
    }

    // demo balance default (will update from API if available)
    let currentBalance = 1000;
    function updateBalance(v) {
      currentBalance = Number.isFinite(Number(v)) ? Number(v) : currentBalance;
      balanceEl.textContent = 'Balance: ' + currentBalance;
    }
    updateBalance(currentBalance);

    // demo auth button to set tgid quickly
    if (demoAuthBtn) {
      demoAuthBtn.addEventListener('click', () => {
        const entered = prompt('Enter demo TGID to use as token (example: demo-user)').trim();
        if (entered) {
          demoTgid = entered;
          setTgidDisplay();
          alert('Demo TGID set. Now SPIN will send Authorization: Bearer ' + demoTgid);
        }
      });
    }

    async function doSpin() {
      // validate TGID
      const tgid = demoTgid || getTgidFromUrl();
      if (!tgid) {
        alert('Missing TGID. Add ?tgid=YOUR_TGID in URL or click "Set Demo TGID"');
        return;
      }

      const bet = Number(betInput.value || 0);
      if (!Number.isFinite(bet) || bet <= 0) {
        alert('Enter valid bet');
        return;
      }
      if (bet > currentBalance) {
        alert('Insufficient balance');
        return;
      }

      // start animation
      statusEl.textContent = 'Spinning…';
      resultEl.textContent = '';
      animateStart();

      // call API
      let resJson = null;
      try {
        const resp = await fetch(spinEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + tgid
          },
          body: JSON.stringify({
            tgid,
            game: gameId,
            bet
          })
        });
        resJson = await resp.json();
        if (!resp.ok) throw new Error(resJson?.error || 'Server error');
      } catch (err) {
        // network / server error -> fallback: local simulation
        console.warn('spin API failed, using local simulation', err);
        resJson = {
          ok: true,
          reels: randomSymbols(3),
          prev_balance: currentBalance,
          new_balance: currentBalance - bet + (Math.random() < 0.15 ? Math.round(bet*2) : 0),
          win: Math.random() < 0.15 ? Math.round(bet*2) : 0
        };
      }

      // stop animation and show result
      setTimeout(() => {
        animateStop(resJson.reels || randomSymbols(3));
        updateBalance(resJson.new_balance ?? currentBalance);
        if (resJson.win && Number(resJson.win) > 0) {
          resultEl.textContent = '🎉 WIN: +' + resJson.win;
        } else {
          resultEl.textContent = '— No win';
        }
        statusEl.textContent = 'Last spin: ' + (new Date()).toLocaleTimeString();
      }, 900);
    }

    // attach click
    if (spinBtn) spinBtn.addEventListener('click', doSpin);

    // expose quick helpers for debugging
    return {
      setDemoTgid: (v)=> { demoTgid = v; setTgidDisplay(); },
      getBalance: ()=> currentBalance
    };
  }; // initEgyptGame
})();
