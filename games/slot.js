// games/slot.js
// Slot visuals + spin integration for AsiaTiger
// Depends on: window.currentTgid or URL param, and window.doSpin / window.apiSpin or Firestore applySpin fallback.

(function(){
  // DOM refs
  const infoEl = document.getElementById('info');
  const resultEl = document.getElementById('result');
  const r1 = document.getElementById('r1');
  const r2 = document.getElementById('r2');
  const r3 = document.getElementById('r3');
  const spinBtn = document.getElementById('spinBtn');

  const symbols = ['🍒','🍋','⭐','🔔','7️⃣','💎'];
  const COST = 100;

  // Helper: get tgid from parent/window or URL
  function getTgid() {
    if (window.currentTgid) return window.currentTgid;
    if (window.parent && window.parent.currentTgid) return window.parent.currentTgid;
    const params = new URLSearchParams(location.search);
    const p = (params.get('tgid') || '').trim();
    if (p) return p;
    return null;
  }

  // Helper: simple reel animation
  function animateReels(finalSymbols = []) {
    const duration = 800;
    const start = Date.now();
    const tick = () => {
      const t = (Date.now() - start) / duration;
      if (t >= 1) {
        r1.textContent = finalSymbols[0] || randomSymbol();
        r2.textContent = finalSymbols[1] || randomSymbol();
        r3.textContent = finalSymbols[2] || randomSymbol();
        return;
      }
      r1.textContent = randomSymbol();
      r2.textContent = randomSymbol();
      r3.textContent = randomSymbol();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function randomSymbol(){ return symbols[Math.floor(Math.random()*symbols.length)]; }

  // Fallback local RNG (keeps same semantics as server demo)
  function localOutcome() {
    // small demo probabilities
    const r = Math.random();
    if (r < 0.02) return 500;
    if (r < 0.10) return 200;
    if (r < 0.20) return 100;
    if (r < 0.30) return 50;
    return 0;
  }

  // Try to call parent.doSpin or window.doSpin or fallback to local applySpin (Firestore)
  async function performSpin(bet) {
    const tgid = getTgid();
    if (!tgid) {
      alert('You need to login first');
      return { ok:false, reason:'no_tgid' };
    }

    // Prefer parent.doSpin / window.doSpin (server-backed)
    try {
      if (typeof window.doSpin === 'function') {
        const res = await window.doSpin('slot', bet);
        return { ok:true, result:res };
      }
      if (window.parent && typeof window.parent.doSpin === 'function') {
        const res = await window.parent.doSpin('slot', bet);
        return { ok:true, result:res };
      }
    } catch (e) {
      console.warn('doSpin failed', e);
      // continue to fallback
    }

    // Fallback: call apiSpin if available (sends id token if index.html configured it)
    try {
      if (typeof window.apiSpin === 'function') {
        const payload = { tgid, game:'slot', bet, clientSeed:'web' };
        const res = await window.apiSpin(payload);
        return { ok:true, result:res };
      }
    } catch (e) {
      console.warn('apiSpin failed', e);
    }

    // Final fallback: local RNG + Firestore client update if applySpin exists on page (slot.html uses applySpin)
    try {
      if (typeof window.applySpin === 'function') {
        const win = localOutcome();
        const res = await window.applySpin('slot', bet, win);
        return { ok:true, result:{ win, next: res && res.next } };
      }
    } catch (e) {
      console.warn('applySpin failed', e);
    }

    // Last resort: local-only outcome (no server update)
    const win = localOutcome();
    return { ok:true, result:{ win, next:null, local:true } };
  }

  // UI update after spin result
  function showResult(win, nextBalance, local=false) {
    if (win > 0) {
      resultEl.textContent = `You won ${win} coins!`;
      try { document.getElementById('winSound')?.play(); } catch(e) {}
    } else {
      resultEl.textContent = 'No win this time.';
      try { document.getElementById('spinSound')?.play(); } catch(e) {}
    }
    if (nextBalance !== null && nextBalance !== undefined) {
      infoEl.textContent = `TG: ${getTgid()} | Balance: ${nextBalance}`;
    } else if (local) {
      infoEl.textContent = `TG: ${getTgid()} | Balance: (local demo)`;
    }
  }

  // Main spin handler
  async function onSpinClick() {
    spinBtn.disabled = true;
    resultEl.textContent = 'Spinning…';
    // quick visual
    animateReels();

    const tgid = getTgid();
    if (!tgid) {
      alert('You need to login first');
      spinBtn.disabled = false;
      return;
    }

    // perform spin (server or fallback)
    const res = await performSpin(COST);

    // determine win and next balance from returned result
    let win = 0, next = null, local = false;
    if (!res.ok) {
      alert('Spin failed: ' + (res.reason || 'unknown'));
      spinBtn.disabled = false;
      return;
    }
    const payload = res.result;
    // payload may be server response or local object
    if (payload && typeof payload === 'object') {
      // common shapes: { win, next } or server-specific
      if ('win' in payload) win = Number(payload.win || 0);
      else if (payload.result && 'win' in payload.result) win = Number(payload.result.win || 0);
      else if (payload.won) win = Number(payload.won || 0);
      if ('next' in payload) next = payload.next;
      if (payload.local) local = true;
    }

    // final reel symbols (for fun)
    const finalSymbols = [randomSymbol(), randomSymbol(), randomSymbol()];
    animateReels(finalSymbols);

    // small delay to let animation finish
    setTimeout(()=> {
      showResult(win, next, local);
      spinBtn.disabled = false;
    }, 900);
  }

  // init: show tgid if available
  function init() {
    const tgid = getTgid();
    if (tgid) {
      infoEl.textContent = `TG: ${tgid} | Loading balance…`;
      // if parent has balance UI, try to read it
      try {
        const parentBalance = window.parent && window.parent.document && window.parent.document.getElementById && window.parent.document.getElementById('balanceDisplay');
        if (parentBalance) {
          infoEl.textContent = `TG: ${tgid} | Balance: ${parentBalance.textContent || '—'}`;
        }
      } catch(e){}
    } else {
      infoEl.textContent = 'You need to Login first';
    }
    spinBtn.addEventListener('click', onSpinClick);
  }

  // run init
  init();

})();
