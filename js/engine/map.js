const Map = {
  canvas: null, ctx: null, onPick: null, W: 1000, H: 800,
  scale: 1, offsetX: 0, offsetY: 0, dragging: false, moved: false, lastX: 0, lastY: 0, points: [],
  init(canvas, onPick){
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.onPick = onPick; this.points = [];
    this.bindEvents(); this.resize(); window.addEventListener('resize', () => this.resize()); this.draw();
  },
  resize(){
    if(!this.canvas) return; const rect = this.canvas.parentElement.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr; this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px'; this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.cw = rect.width; this.ch = rect.height;
    const s = Math.min(rect.width / this.W, rect.height / this.H) * 0.9; this.scale = s;
    this.offsetX = (rect.width - this.W * s) / 2; this.offsetY = (rect.height - this.H * s) / 2; this.draw();
  },
  toScreen(x, y){ return { x: this.offsetX + x * this.scale, y: this.offsetY + y * this.scale }; },
  bindEvents(){
    const c = this.canvas;
    c.addEventListener('pointerdown', e => { this.dragging = true; this.moved = false; this.lastX = e.clientX; this.lastY = e.clientY; });
    c.addEventListener('pointermove', e => { if(!this.dragging) return; const dx = e.clientX - this.lastX, dy = e.clientY - this.lastY; if(Math.abs(dx) + Math.abs(dy) > 4) this.moved = true; this.lastX = e.clientX; this.lastY = e.clientY; });
    c.addEventListener('pointerup', e => {
      this.dragging = false; if(this.moved) return;
      const rect = c.getBoundingClientRect(); const px = e.clientX - rect.left, py = e.clientY - rect.top;
      let hit = null; for(const p of this.points){ if(Math.hypot(px - p.sx, py - p.sy) < p.r + 20){ hit = p; break; } }
      if(hit && this.onPick) this.onPick(hit.loc);
    });
  },
  draw(){
    if(!this.ctx) return; const ctx = this.ctx; 
    // 关键修复：读取 html 的 data-theme
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    ctx.clearRect(0, 0, this.cw, this.ch);
    
    // 画路线
    const routes = [ ['solma', 'yingyue'], ['yingyue', 'riwang'], ['solma', 'rumeng'], ['riwang', 'yingyue'], ['elynburg', 'arena'], ['arena', 'catrin'], ['catrin', 'jingmeng'] ];
    ctx.setLineDash([5, 5]); ctx.lineWidth = 2;
    routes.forEach(([from, to]) => {
      const locA = WORLD.locations.find(l => l.id === from); const locB = WORLD.locations.find(l => l.id === to);
      if(locA && locB) { const pA = this.toScreen(locA.x, locA.y); const pB = this.toScreen(locB.x, locB.y); ctx.beginPath(); ctx.moveTo(pA.x, pA.y); ctx.lineTo(pB.x, pB.y); ctx.strokeStyle = isDark ? 'rgba(201,169,97,0.2)' : 'rgba(166,124,82,0.25)'; ctx.stroke(); }
    });
    ctx.setLineDash([]);

    // 版块
    WORLD.nations.forEach(n => {
      const locs = WORLD.locations.filter(l => l.nation === n.id); if(!locs.length) return;
      const xs = locs.map(l => this.toScreen(l.x, l.y));
      const minX = Math.min(...xs.map(p => p.x)) - 80; const maxX = Math.max(...xs.map(p => p.x)) + 80;
      const minY = Math.min(...xs.map(p => p.y)) - 60; const maxY = Math.max(...xs.map(p => p.y)) + 60;
      const w = maxX - minX, h = maxY - minY;
      ctx.save(); ctx.beginPath();
      if (n.id === 'alaregia') { ctx.roundRect(minX, minY, w, h, 4); } else { ctx.roundRect(minX, minY, w, h, 40); }
      ctx.fillStyle = isDark ? n.color : 'rgba(255,255,255,0.4)'; ctx.fill();
      
      // 王翼棋盘格与索姆尼亚纹理
      if (n.id === 'alaregia') { 
        ctx.clip(); const gridSize = 20 * this.scale; 
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'; 
        for(let i = minX; i < maxX; i += gridSize) { for(let j = minY; j < maxY; j += gridSize) { if((Math.floor(i/gridSize) + Math.floor(j/gridSize)) % 2 === 0) { ctx.fillRect(i, j, gridSize, gridSize); } } } 
      } else { 
        ctx.clip(); ctx.fillStyle = isDark ? 'rgba(150,100,200,0.05)' : 'rgba(200,150,100,0.1)'; 
        for(let k=0; k<30; k++) { const rx = minX + Math.random() * w; const ry = minY + Math.random() * h; ctx.beginPath(); ctx.arc(rx, ry, Math.random() * 2, 0, Math.PI * 2); ctx.fill(); } 
      }
      
      ctx.restore(); ctx.strokeStyle = isDark ? n.border : 'rgba(166,124,82,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = isDark ? 'rgba(220,200,160,0.7)' : 'rgba(100,80,60,0.7)'; ctx.font = `bold ${Math.max(14, 18 * this.scale)}px "Noto Serif SC", serif`; ctx.textAlign = 'center'; ctx.fillText(n.name, (minX + maxX) / 2, minY + 30);
    });

    // 节点
    this.points = [];
    WORLD.locations.forEach(loc => {
      const p = this.toScreen(loc.x, loc.y); const r = Math.max(8, 12 * this.scale); const locked = loc.unlocked === false;
      if(!locked){ const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4); g.addColorStop(0, isDark ? 'rgba(201,169,97,0.4)' : 'rgba(166,124,82,0.3)'); g.addColorStop(1, 'transparent'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r * 4, 0, Math.PI * 2); ctx.fill(); }
      ctx.save(); ctx.translate(p.x, p.y); ctx.shadowBlur = locked ? 0 : (isDark ? 15 : 10); ctx.shadowColor = isDark ? '#C9A961' : '#A67C52'; ctx.rotate(Math.PI / 4);
      const colorMain = locked ? (isDark ? '#333' : '#ccc') : (isDark ? '#C9A961' : '#A67C52'); const colorBorder = locked ? (isDark ? '#555' : '#aaa') : (isDark ? '#FFF' : '#FFF');
      ctx.fillStyle = colorMain; ctx.strokeStyle = colorBorder; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(-r, -r, r * 2, r * 2, 4); ctx.fill(); ctx.stroke();
      if(!locked) { ctx.fillStyle = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.moveTo(-r/2, -r/2); ctx.lineTo(0, -r/2); ctx.lineTo(-r/2, 0); ctx.fill(); }
      ctx.restore();
      ctx.font = `bold ${Math.max(12, 14 * this.scale)}px "Noto Serif SC", serif`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = isDark ? '#08060A' : '#F2E8D5';
      const textY = p.y + r + 20; ctx.strokeText(loc.name, p.x, textY);
      ctx.fillStyle = locked ? (isDark ? 'rgba(140,125,150,.7)' : 'rgba(150,140,130,.8)') : (isDark ? '#E8D5A0' : '#3E362E'); ctx.fillText(loc.name, p.x, textY);
      this.points.push({ loc, sx: p.x, sy: p.y, r });
    });
  }
};
