const Map = {
  canvas: null, ctx: null, onPick: null,
  W: 1000, H: 800,
  scale: 1, offsetX: 0, offsetY: 0,
  dragging: false, moved: false, lastX: 0, lastY: 0,
  points: [],

  init(canvas, onPick){
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.onPick = onPick; this.points = [];
    this.bindEvents(); this.resize();
    window.addEventListener('resize', () => this.resize());
    this.draw();
  },

  resize(){
    if(!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr; this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px'; this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.cw = rect.width; this.ch = rect.height;
    const s = Math.min(rect.width / this.W, rect.height / this.H) * 0.92;
    this.scale = s;
    this.offsetX = (rect.width - this.W * s) / 2; this.offsetY = (rect.height - this.H * s) / 2;
    this.draw();
  },

  toScreen(x, y){ return { x: this.offsetX + x * this.scale, y: this.offsetY + y * this.scale }; },

  bindEvents(){
    const c = this.canvas;
    c.addEventListener('pointerdown', e => { this.dragging = true; this.moved = false; this.lastX = e.clientX; this.lastY = e.clientY; });
    c.addEventListener('pointermove', e => {
      if(!this.dragging) return;
      const dx = e.clientX - this.lastX, dy = e.clientY - this.lastY;
      if(Math.abs(dx) + Math.abs(dy) > 4) this.moved = true;
      this.lastX = e.clientX; this.lastY = e.clientY;
    });
    c.addEventListener('pointerup', e => {
      this.dragging = false; if(this.moved) return;
      const rect = c.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      let hit = null;
      for(const p of this.points){
        if(Math.hypot(px - p.sx, py - p.sy) < p.r + 15){ hit = p; break; }
      }
      if(hit && this.onPick) this.onPick(hit.loc);
    });
  },

  draw(){
    if(!this.ctx) return;
    const ctx = this.ctx;
    const isDark = document.body.classList.contains('dark');
    ctx.clearRect(0, 0, this.cw, this.ch);

    // 背景透明，依靠 CSS 的渐变
    // 画国家板块
    WORLD.nations.forEach(n => {
      const locs = WORLD.locations.filter(l => l.nation === n.id);
      if(!locs.length) return;
      const xs = locs.map(l => this.toScreen(l.x, l.y));
      const minX = Math.min(...xs.map(p => p.x)) - 50; const maxX = Math.max(...xs.map(p => p.x)) + 50;
      const minY = Math.min(...xs.map(p => p.y)) - 40; const maxY = Math.max(...xs.map(p => p.y)) + 40;
      
      ctx.fillStyle = isDark ? n.color : 'rgba(200,180,150,0.1)';
      ctx.strokeStyle = isDark ? n.border : 'rgba(166,124,82,0.3)';
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.roundRect(minX, minY, maxX - minX, maxY - minY, 16);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = isDark ? 'rgba(220,200,160,.55)' : 'rgba(100,80,60,.5)';
      ctx.font = `bold ${Math.max(12, 14 * this.scale)}px "Noto Serif SC", serif`;
      ctx.textAlign = 'center';
      ctx.fillText(n.name, (minX + maxX) / 2, minY + 24);
    });

    // 地点
    this.points = [];
    WORLD.locations.forEach(loc => {
      const p = this.toScreen(loc.x, loc.y);
      const r = Math.max(6, 10 * this.scale);
      const locked = loc.unlocked === false;

      if(!locked){
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
        g.addColorStop(0, isDark ? 'rgba(201,169,97,.35)' : 'rgba(166,124,82,.25)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2); ctx.fill();
      }

      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(Math.PI / 4);
      ctx.fillStyle = locked ? (isDark ? 'rgba(60,50,70,.9)' : 'rgba(200,190,180,.9)') : (isDark ? '#C9A961' : '#A67C52');
      ctx.strokeStyle = isDark ? 'rgba(232,213,160,1)' : '#FFF';
      ctx.lineWidth = 2;
      ctx.fillRect(-r, -r, r * 2, r * 2); ctx.strokeRect(-r, -r, r * 2, r * 2);
      ctx.restore();

      ctx.fillStyle = locked ? (isDark ? 'rgba(140,125,150,.7)' : 'rgba(150,140,130,.8)') : (isDark ? '#E8D5A0' : '#3E362E');
      ctx.font = `bold ${Math.max(11, 13 * this.scale)}px "Noto Serif SC", serif`;
      ctx.textAlign = 'center';
      ctx.fillText(loc.name, p.x, p.y + r + 18);

      this.points.push({ loc, sx: p.x, sy: p.y, r });
    });
  }
};
