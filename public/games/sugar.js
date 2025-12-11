(function(){
  const symbols=['🍬','🍭','🍫','🍪','🍓','🍇'];
  const pay={'🍬':8,'🍭':6,'🍫':10,'🍪':5,'🍓':12,'🍇':7};
  const el=document.getElementById('sugar-reels');

  function gen(){
    const R=6,C=6,g=[];
    for(let r=0;r<R;r++){ g[r]=[]; for(let c=0;c<C;c++){ g[r][c]=symbols[Math.floor(Math.random()*symbols.length)]; } }
    return g;
  }
  function render(grid){
    if(!el) return; el.innerHTML='';
    const wrap=document.createElement('div');
    wrap.style.display='grid'; wrap.style.gridTemplateColumns='repeat(6,48px)'; wrap.style.gap='6px'; wrap.style.justifyContent='center';
    grid.forEach(row=>row.forEach(cell=>{
      const d=document.createElement('div'); d.className='cell'; d.style.width='48px'; d.style.height='48px'; d.style.display='flex'; d.style.alignItems='center'; d.style.justifyContent='center'; d.textContent=cell; d.style.background='#0f0f0f'; d.style.borderRadius='6px';
      wrap.appendChild(d);
    }));
    el.appendChild(wrap);
  }
  function clusters(grid){
    const R=6,C=6,seen=Array.from({length:R},()=>Array(C).fill(false)),out=[];
    function dfs(r,c,sym,acc){
      if(r<0||c<0||r>=R||c>=C) return;
      if(seen[r][c]||grid[r][c]!==sym) return;
      seen[r][c]=true; acc.push([r,c]);
      dfs(r+1,c,sym,acc); dfs(r-1,c,sym,acc); dfs(r,c+1,sym,acc); dfs(r,c-1,sym,acc);
    }
    for(let r=0;r<R;r++) for(let c=0;c<C;c++){
      if(!seen[r][c]){ const acc=[]; dfs(r,c,grid[r][c],acc); if(acc.length>=4) out.push({sym:grid[r][c], size:acc.length}); }
    }
    return out;
  }

  window.spinSugar = async function(){
    const bet=parseInt(document.getElementById('betInput-sugar').value,10);
    if(isNaN(bet)||bet<100||bet>3000){ alert('Invalid bet'); return; }
    document.getElementById('spinSound').play();
    const grid=gen(); render(grid); const cl=clusters(grid);
    let total=0; cl.forEach(x=> total += (pay[x.sym]||0)*x.size );
    const win=Math.floor(total*vipRtpMultiplier(vip));
    if(win>0) document.getElementById('winSound').play();
    document.getElementById('sugar-res').textContent = total>0?`Cluster win ${total} coins`:'No win';
    await applySpin('slot-sugar', bet, win);
  }
})();
