window.startPourGame = function() {
  const wrap = NF.openModal({
    title: '调 酒 · 日不落酒馆',
    body: `<div style="text-align:center;margin:20px 0;"><div style="width:90px;height:200px;border:1px solid var(--line);border-top:none;background:rgba(0,0,0,.3);margin:0 auto;overflow:hidden;clip-path:polygon(10% 0,90% 0,100% 100%,0 100%);position:relative;"><div style="position:absolute;left:0;right:0;height:2px;background:#fff;bottom:40%;"></div><div style="position:absolute;left:0;right:0;height:2px;background:#fff;bottom:60%;"></div><div id="pLiquid" style="position:absolute;bottom:0;left:0;right:0;height:0;background:var(--gold);transition:height .04s;"></div></div></div><button class="btn primary" id="pBtn" style="width:100%;height:50px;">按住倒酒 (在40-60ml之间松手)</button>`,
    onMount: (w) => {
      const l = w.querySelector('#pLiquid'), b = w.querySelector('#pBtn'); let level = 0, pour = false, tm = null;
      const start = (e) => { if(e) e.preventDefault(); pour = true; tm = setInterval(() => { level += 1.5; l.style.height = level + '%'; if(level>=100) stop(); }, 30); };
      const stop = (e) => { if(e) e.preventDefault(); if(!pour) return; pour = false; clearInterval(tm);
        if(level >= 40 && level <= 60) { NF.toast('◈ 完美！', 'ok'); NF.state.stats.silver += 50; } else { NF.toast('✕ 倒歪了。', 'warn'); }
        setTimeout(() => w.remove(), 800);
      };
      b.addEventListener('mousedown', start); b.addEventListener('touchstart', start);
      b.addEventListener('mouseup', stop); b.addEventListener('touchend', stop);
    }
  });
};

window.startEvidenceGame = function() {
  const wrap = NF.openModal({
    title: '档 案 室 · 证据链',
    body: `<div id="evArea" style="position:relative;height:300px;background:rgba(0,0,0,.2);border:1px solid var(--line);"></div>`,
    onMount: (w) => {
      const cards = [ {id:'a', text:'乌鸦羽毛'}, {id:'b', text:'焦土样本'}, {id:'c', text:'第三日战报'}, {id:'d', text:'缇斯记录'}, {id:'e', text:'梦域地图'}, {id:'f', text:'未归之人名单'} ];
      const pairs = [['a','d'], ['b','c'], ['e','f']]; const area = w.querySelector('#evArea'); let selected = null, found = 0;
      cards.forEach((c, i) => {
        const el = document.createElement('div'); el.className = 'ev-card'; el.textContent = c.text; el.style.cssText = `position:absolute;width:80px;padding:7px;border:1px solid var(--line);text-align:center;font-size:10px;cursor:pointer;left:${(i%2)*120+20}px;top:${Math.floor(i/2)*80+20}px;`;
        el.onclick = () => {
          if (el.style.pointerEvents === 'none') return;
          if (!selected) { selected = { id: c.id, el }; el.style.borderColor = 'var(--gold)'; }
          else if (selected.id === c.id) { selected = null; el.style.borderColor = 'var(--line)'; }
          else {
            const isMatch = pairs.some(p => (p[0]===selected.id && p[1]===c.id) || (p[1]===selected.id && p[0]===c.id));
            if (isMatch) { selected.el.style.pointerEvents = 'none'; el.style.pointerEvents = 'none'; selected.el.style.opacity='.5'; el.style.opacity='.5'; found++; selected = null; if (found === 3) { NF.toast('◈ 证据链完成！', 'ok'); setTimeout(() => w.remove(), 800); } }
            else { NF.toast('连错了', 'warn'); selected.el.style.borderColor = 'var(--line)'; selected = null; }
          }
        };
        area.appendChild(el);
      });
    }
  });
};

window.startChessGame = function() {
  const wrap = NF.openModal({ title: '棋局厅', body: `<div id="cb" style="display:grid;grid-template-columns:repeat(4,1fr);gap:2px;max-width:300px;margin:0 auto;padding:5px;background:var(--panel);"></div>`, onMount: (w) => {
    const cb = w.querySelector('#cb'); let pos = 0, death = [1, 6, 11], goal = 15;
    for(let i=0; i<16; i++) {
      const c = document.createElement('div'); c.style.cssText = `aspect-ratio:1;background:${death.includes(i)?'rgba(160,60,80,.5)':(i===goal?'rgba(120,180,120,.5)':'rgba(255,255,255,.1)')};display:flex;align-items:center;justify-content:center;font-size:20px;`; if(i===pos) c.textContent = '♙';
      c.onclick = () => { if(i===pos+4 || i===pos+5 || i===pos+3) { pos = i; if(death.includes(pos)) { NF.toast('踩到死格', 'warn'); setTimeout(()=>w.remove(),800); return; } if(pos===goal) { NF.toast('升变成功！', 'ok'); setTimeout(()=>w.remove(),800); return; } window.startChessGame(); w.remove(); } };
      cb.appendChild(c);
    }
  }});
};

window.startPuzzleGame = function() {
  const wrap = NF.openModal({ title: '拼图', body: `<div id="ps" style="position:relative;width:280px;height:280px;margin:0 auto;border:1px solid var(--line);"></div>`, onMount: (w) => {
    let tiles = [1,2,3,4,5,6,7,8,0]; for(let i=0;i<30;i++){ let e=tiles.indexOf(0); let n=[e-3,e+3,e-1,e+1].filter(x=>x>=0&&x<9&&!(e%3===0&&x===e-1)&&!(e%3===2&&x===e+1)); let p=n[Math.floor(Math.random()*n.length)]; [tiles[e],tiles[p]]=[tiles[p],tiles[e]]; }
    const ps = w.querySelector('#ps'); const render = () => { ps.innerHTML = ''; tiles.forEach((v, i) => { const el = document.createElement('div'); el.style.cssText = `position:absolute;width:33.33%;height:33.33%;display:flex;align-items:center;justify-content:center;font-size:24px;border:1px solid var(--line);cursor:pointer;left:${(i%3)*33.33}%;top:${Math.floor(i/3)*33.33}%;`; if(v!==0) el.textContent = v; el.onclick = () => { let e = tiles.indexOf(0); if(Math.abs(e-i)===1 && Math.floor(e/3)===Math.floor(i/3) || Math.abs(e-i)===3) { [tiles[e], tiles[i]] = [tiles[i], tiles[e]]; render(); if(tiles.join('')==='123456780'){ NF.toast('拼图完成！','ok'); setTimeout(()=>w.remove(),800); } } }; ps.appendChild(el); }); }; render();
  }});
};
