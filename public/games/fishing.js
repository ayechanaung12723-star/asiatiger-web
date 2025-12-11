(function(){
  const canvas = document.getElementById('fish-canvas');
  const ctx = canvas.getContext('2d');

  function drawScene(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#013';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // fish
    for(let i=0;i<8;i++){
      const x = Math.random()*canvas.width;
      const y = 40+Math.random()*(canvas.height-80);
      ctx.fillStyle = i%2===0 ? '#0cf' : '#fa0';
      ctx.beginPath(); ctx.arc(x,y,10,0,Math.PI*2); ctx.fill();
    }
  }

  window.startFishing = async function(){
    const bet = parseInt(document.getElementById('betInput-fishing').value,10);
    if(isNaN(bet)||bet<100||bet>3000){ alert('Invalid bet'); return; }
    drawScene();
    // simple RNG
    const hits = Math.floor(Math.random()*4); // 0-3 hits
    const rewardPerHit = 60;
    const total = hits * rewardPerHit;
    const win = Math.floor(total * vipRtpMultiplier(vip));
    document.getElementById('fishing-res').textContent = total>0 ? `Caught ${hits} fish — ${total} coins` : 'No catch';
    await applySpin('fishing-mini', bet, win);
  }

  drawScene();
})();
