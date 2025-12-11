// candy.js
const symbols = ['🍭','🍬','🍫','🍩','🍪'];
const pay = { '🍭':100, '🍬':80, '🍫':60, '🍩':40, '🍪':20 };
const cols = 5, rows = 3;
const reelsEl = document.getElementById('candy-reels');

function genGrid(){
  const g = [];
  for(let c=0;c<cols;c++){
    g[c]=[];
    for(let r=0;r<rows;r++){
      g[c].push(symbols[Math.floor(Math.random()*symbols.length)]);
    }
  }
  return g;
}

function render(g){
  reelsEl.innerHTML='';
  g.forEach(col=>{
    const c = document.createElement('div');
    c.className='col';
    col.forEach(s=>{
      const d = document.createElement('div');
      d.className='cell';
      d.textContent = s;
      c.appendChild(d);
    });
    reelsEl.appendChild(c);
  });
}

function calc(g){
  let total=0;
  for(let r=0;r<rows;r++){
    const first = g[0][r];
    if(!pay[first]) continue;
    let count=1;
    for(let c=1;c<cols;c++){
      if(g[c][r]===first) count++; else break;
    }
    if(count>=3) total+=pay[first]*(count-2);
  }
  return total;
}

async function spinCandy(){
  const bet = parseInt(document.getElementById('betInput-candy').value,10);
  if(isNaN(bet)||bet<100||bet>3000){ alert('Invalid bet'); return; }
  document.getElementById('spinSound').play();

  const grid = genGrid();
  render(grid);
  const raw = calc(grid);
  
  // fetch backend spin API
  try{
    const tgid = localStorage.getItem('tgid'); // or your way of getting current user
    const res = await fetch('/api/spin', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer '+tgid
      },
      body: JSON.stringify({ game:'candy', bet, tgid })
    });
    const data = await res.json();
    if(data.ok && data.win>0) document.getElementById('winSound').play();
    document.getElementById('candy-res').textContent = data.ok ? `Won ${data.win} coins` : 'No win';
  } catch(e){
    console.error(e);
    document.getElementById('candy-res').textContent='Error spinning';
  }
}

document.getElementById('spinCandyBtn').addEventListener('click',spinCandy);
