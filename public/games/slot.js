// games/slot.js
(function(){
  const infoEl = document.getElementById('info');
  const resultEl = document.getElementById('result');
  const r1 = document.getElementById('r1');
  const r2 = document.getElementById('r2');
  const r3 = document.getElementById('r3');
  const spinBtn = document.getElementById('spinBtn');

  const SYMBOLS = ['🍒','🍋','⭐','🔔','7️⃣','💎'];
  const COST = 100;

  function getTgid() {
    try {
      if (window.currentTgid) return window.currentTgid;
      if (window.parent && window.parent.currentTgid) return window.parent.currentTgid;
      const p = new URLSearchParams(location.search).get('tgid');
      return p ? p.trim() : null;
    } catch (e) { return null; }
  }

  function randomSymbol(){ return SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)]; }

  function animateReels(finalSymbols = [], duration = 800) {
    const start = Date.now();
    function tick() {
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
    }
    requestAnimationFrame(tick);
  }

  // Interpret server response shape and return {win, next}
  function parseServerResult(payload) {
    if (!payload) return { win:0, next:null };
    if ('win' in payload) return { win: Number(payload.win||0), next: payload.next ?? null };
    if ('result' in payload && payload.result && 'win' in payload.result) return { win: Number(payload.result.win||0), next: payload.result.next ?? null };
    if ('won' in payload) return { win: Number(payload.won||0), next: payload.next ?? null };
    return { win:0, next: payload.next ?? null };
  }

  async function onSpinClick() {
    spinBtn.disabled = true;
    resultEl.textContent = 'Spinning…';
    animateReels();

    const tgid = getTgid();
    if (!tgid) {
      alert('You need to login first');
      spinBtn.disabled = false;
      return;
    }

    // Call server via window.doSpin (index.html provides it)
    try {
      const res = await window.doSpin('slot', COST);
      if (!res) {
        resultEl.textContent = 'Spin failed';
        spinBtn.disabled = false;
        return;
      }
      const { win, next } = parseServerResult(res);
      // show final symbols
      const finalSymbols = [randomSymbol(), randomSymbol(), randomSymbol()];
      animateReels(finalSymbols);
      setTimeout(()=> {
        if (win > 0) {
          resultEl.textContent = `You won ${win} coins!`;
          try { document.getElementById('winSound')?.play(); } catch(e){}
        } else {
          resultEl.textContent = 'No win this time.';
          try { document.getElementById('spinSound')?.play(); } catch(e){}
        }
        if (next !== null && next !== undefined) {
          infoEl.textContent = `TG: ${tgid} | Balance: ${next}`;
        } else {
          infoEl.textContent = `TG: ${tgid} | Balance: (updated)`;
        }
        spinBtn.disabled = false;
      }, 900);
    } catch (e) {
      console.error('spin error', e);
      resultEl.textContent = 'Spin failed';
      spinBtn.disabled = false;
    }
  }

  // init UI
  function init() {
    const tgid = getTgid();
    if (tgid) {
      infoEl.textContent = `TG: ${tgid} | Loading balance…`;
      // if parent has balanceDisplay, show it
      try {
        const parentBalance = window.parent && window.parent.document && window.parent.document.getElementById && window.parent.document.getElementById('balanceDisplay');
        if (parentBalance) infoEl.textContent = `TG: ${tgid} | Balance: ${parentBalance.textContent || '—'}`;
      } catch(e){}
    } else {
      infoEl.textContent = 'You need to Login first';
    }
    spinBtn.addEventListener('click', onSpinClick);
  }

  init();
})();
