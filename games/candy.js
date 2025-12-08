(function(){
  const symbols=['🍬','🍭','🍫','🍪','🍓','🍇'];
  const payouts={'🍬':8,'🍭':6,'🍫':10,'🍪':5,'🍓':12,'🍇':7};
  const gridEl=document.getElementById('candy-reels');

  function genGrid(){
    const cols=6, rows=6;
    const g=[];
    for(let r=0;r<rows;r++){
      g[r]=[];
      for(let c=0;c<cols;c++){
        g[r][c]=symbols[Math.floor(Math.random()*symbols.length)];
      }
    }
    return g;
  }

  function renderGrid(grid){
    if(!gridEl) return;
    gridEl.innerHTML='';
    const wrap=document.createElement('div');
    wrap.style.display='grid';
    wrap.style.gridTemplateColumns='repeat(6,48px)';
    wrap.style.justifyContent='center';
    wrap.style.gap='6px';
    grid.forEach(row=>row.forEach(cell=>{
      const d=document.createElement('div');
      d.style.width='48px';
      d.style.height='48px';
      d.style.display='flex';
      d.style.alignItems='center';
      d.style.justifyContent='center';
      d.style.fontSize='22px';
      d.style.background='#0f0f0f';
      d.style.borderRadius='6px';
      d.textContent=cell;
      wrap.appendChild(d);
    }));
    gridEl.appendChild(wrap);
  }

  function findClusters(grid){
    const R=6,C=6;
    const seen=Array.from({length:R},()=>Array(C).fill(false));
    const clusters=[];
    function dfs(r,c,sym,acc){
      if(r<0||c<0||r>=R||c>=C) return;
      if(seen[r][c]) return;
      if(grid[r][c]!==sym) return;
      seen[r][c]=true;
      acc.push([r,c]);
      dfs(r+1,c,sym,acc);
      dfs(r-1,c,sym,acc);
      dfs(r,c+1,sym,acc);
      dfs(r,c-1,sym,acc);
    }
    for(let r=0;r<R;r++) for(let c=0;c<C;c++){
      if(!seen[r][c]){
        const acc=[];
        dfs(r,c,grid[r][c],acc);
        if(acc.length>=4) clusters.push({sym:grid[r][c],size:acc.length});
      }
    }
    return clusters;
  }

  window.spinCandy = async function(){
    const bet = parseInt(document.getElementById('betInput-candy').value, 10);
    if (isNaN(bet)||bet<100||bet>3000){ alert('Invalid bet'); return; }

    document.getElementById('spinSound').play();
    const grid=genGrid(); renderGrid(grid);
    const clusters=findClusters(grid);
    let total=0;
    clusters.forEach(cl=>{
      total += payouts[cl.sym] * cl.size;
    });

    const win = Math.floor(total * vipRtpMultiplier(vip));
    if (win>0) document.getElementById('winSound').play();

    document.getElementById('candy-res').textContent = total>0
      ? `Cluster win ${total} coins (clusters: ${clusters.map(c=>c.sym+':'+c.size).join(',')})`
      : 'No win';

    await applySpin('slot-candy', bet, win);
  }
})();
