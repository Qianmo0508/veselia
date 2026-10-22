// Canvas 地图
const Map = {
  canvas: null, ctx: null, onPick: null,
  W: 1000, H: 800,
  scale: 1, offsetX: 0, offsetY: 0,
  dragging: false, moved: false, lastX: 0, lastY: 0,
  points: [],

  init(canvas, onPick){
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onPick = onPick;
    this.points = [];
    this.bindEvents();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.draw();
  },

  resize(){
    if(!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.cw = rect.width;
    this.ch = rect.height;
    // 适配：整张地图放进屏幕，留边
    const s = Math.min(rect.width / this.W, rect.height / this.H) * 0.92;
    this.scale = s;
    this.offsetX = (rect.width - this.W * s) / 2;
    this.offsetY = (rect.height - this.H * s) / 2;
    this.draw();
  },

  toScreen(x, y){
    return { x: this.offsetX + x * this.scale, y: this.offsetY + y * this.scale };
  },

  bindEvents(){
    const c = this.canvas;
    c.addEventListener('pointerdown', e => {
      this.dragging = true; this.moved = false;
      this.lastX = e.clientX; this.lastY = e.clientY;
    });
    c.addEventListener('pointermove', e => {
      if(!this.dragging) return;
      const dx = e.clientX - this.lastX, dy = e.clientY - this.lastY;
      if(Math.abs(dx) + Math.abs(dy) > 4) this.moved = true;
      this.lastX = e.clientX; this.lastY = e.clientY;
    });
    c.addEventListener('pointerup', e => {
      this.dragging = false;
      if(this.moved) return;
      // 点击检测
      const rect = c.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      let hit = null;
      for(const p of this.points){
        const d = Math.hypot(px - p.sx, py - p.sy);
        if(d < p.r + 10){ hit = p; break; }
      }
      if(hit && this.onPick) this.onPick(hit.loc);
    });
  },

  draw(){
    if(!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cw, this.ch);

    // 背景
    const bg = ctx.createLinearGradient(0, 0, 0, this.ch);
    bg.addColorStop(0, 'rgba(20,14,30,1)');
    bg.addColorStop(1, 'rgba(10,8,16,1)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.cw, this.ch);

    // 国家板块
    WORLD.nations.forEach(n => {
      const locs = WORLD.locations.filter(l => l.nation === n.id);
      if(!locs.length) return;
      const xs = locs.map(l => this.toScreen(l.x, l.y));
      const minX = Math.min(...xs.map(p => p.x)) - 50;
      const maxX = Math.max(...xs.map(p => p.x)) + 50;
      const minY = Math.min(...xs.map(p => p.y)) - 40;
      const maxY = Math.max(...xs.map(p => p.y)) + 40;
      ctx.fillStyle = n.color;
      ctx.strokeStyle = n.border;
      ctx.lineWidth = 1;
      this.roundRect(ctx, minX, minY, maxX - minX, maxY - minY, 14);
      ctx.fill(); ctx.stroke();
      // 国家名
      ctx.fillStyle = 'rgba(220,200,160,.55)';
      ctx.font = `${Math.max(11, 14 * this.scale)}px "Noto Serif SC", serif`;
      ctx.textAlign = 'center';
      ctx.fillText(n.name, (minX + maxX) / 2, minY + 22);
    });

    // 地点
    this.points = [];
    WORLD.locations.forEach(loc => {
      const p = this.toScreen(loc.x, loc.y);
      const r = Math.max(6, 9 * this.scale);
      const locked = loc.unlocked === false;

      // 光晕
      if(!locked){
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
        g.addColorStop(0, 'rgba(201,169,97,.35)');
        g.addColorStop(1, 'rgba(201,169,97,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2); ctx.fill();
      }

      // 菱形
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = locked ? 'rgba(60,50,70,.9)' : 'rgba(201,169,97,.95)';
      ctx.strokeStyle = locked ? 'rgba(120,100,140,.7)' : 'rgba(232,213,160,1)';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-r, -r, r * 2, r * 2);
      ctx.strokeRect(-r, -r, r * 2, r * 2);
      ctx.restore();

      // 名字
      ctx.fillStyle = locked ? 'rgba(140,125,150,.7)' : 'rgba(232,213,160,.95)';
      ctx.font = `${Math.max(10, 12 * this.scale)}px "Noto Serif SC", serif`;
      ctx.textAlign = 'center';
      ctx.fillText(loc.name, p.x, p.y + r + 16);

      this.points.push({ loc, sx: p.x, sy: p.y, r });
    });

    // 中央装饰
    ctx.fillStyle = 'rgba(201,169,97,.06)';
    ctx.font = `${Math.max(20, 30 * this.scale)}px "Cormorant Garamond", serif`;
    ctx.textAlign = 'center';
    ctx.fillText('VESELIA', this.cw / 2, this.ch - 30);
  },

  roundRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
};
