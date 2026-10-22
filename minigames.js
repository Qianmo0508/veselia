/* ═══════════════════════════════════════════════════════════
   minigames.js · 4 个小游戏 + 梦域 Roguelike
   依赖 index.html 暴露的 window.NF
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.NF) { console.error('[minigames] window.NF 未找到'); return; }
  const NF = window.NF;
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp = (v,a,b) => Math.max(a, Math.min(b, v));

  /* 快捷：拿当前 state（注意可能为 null） */
  const getState = () => NF.state();
  /* 奖励函数 */
  function reward(silver, affObj) {
    const s = getState();
    if (!s) return;
    if (silver) s.stats.silver = (s.stats.silver || 0) + silver;
    if (affObj) {
      for (const k in affObj) s.affection[k] = (s.affection[k] || 0) + affObj[k];
    }
    NF.saveNow();
  }

  /* ═══════════════════════════════════════════════════════════
     1) 调酒 QTE
     ═══════════════════════════════════════════════════════════ */
  function openPour() {
    NF.openModal({
      title: '日 不 落 酒 馆 · 调 酒',
      body:
        '<div class="mini-title">◈ 调 酒 ◈</div>' +
        '<div class="mini-sub">按住按钮注入酒液。在标记线处松开手。</div>' +
        '<div class="mini-hud"><div class="mini-hud-item">轮次<b id="pourRound">1 / 2</b></div><div class="mini-hud-item">误差<b id="pourErr">--</b></div></div>' +
        '<div class="pour-stage"><div class="glass">' +
          '<div class="glass-marker m1" style="bottom:40%;"><span class="mlabel">40ml</span></div>' +
          '<div class="glass-marker m2" style="bottom:60%;"><span class="mlabel">60ml</span></div>' +
          '<div class="glass-liquid" id="pourLiquid"></div>' +
        '</div></div>' +
        '<button class="pour-btn" id="pourBtn">按 住 倒 酒</button>' +
        '<div class="pour-feedback" id="pourFeedback"></div>',
      footHTML: '<button class="btn ghost" id="pourClose">关闭</button>',
      onMount: (w) => {
        const liquid = w.querySelector('#pourLiquid');
        const btn = w.querySelector('#pourBtn');
        const fb = w.querySelector('#pourFeedback');
        const roundEl = w.querySelector('#pourRound');
        const errEl = w.querySelector('#pourErr');
        let level = 0, round = 1, pouring = false, timer = null, done1 = false;
        const t1 = 40, t2 = 60;
        function setLevel(v) { level = clamp(v, 0, 100); if (liquid) liquid.style.height = level + '%'; }
        function start() {
          if (pouring) return;
          if (round === 2 && !done1) return;
          pouring = true; btn.classList.add('pouring');
          timer = setInterval(() => { setLevel(level + 0.8); if (level >= 100) stop(); }, 30);
        }
        function stop() {
          if (!pouring) return;
          pouring = false; btn.classList.remove('pouring');
          clearInterval(timer); timer = null;
          if (round === 1) {
            const err = Math.abs(level - t1);
            if (errEl) errEl.textContent = err.toFixed(1) + 'ml';
            if (err <= 4) {
              NF.Sfx.success();
              if (fb) { fb.style.color = '#9dd0a0'; fb.textContent = '◈ 完美！威士忌 40ml'; }
              done1 = true; round = 2;
              if (roundEl) roundEl.textContent = '2 / 2';
              setTimeout(() => { if (fb) fb.textContent = '继续：柠檬汁 60ml。'; }, 1200);
            } else {
              NF.Sfx.fail();
              if (fb) { fb.style.color = '#d08a9c'; fb.textContent = '✕ 误差过大（' + err.toFixed(1) + 'ml）。重来。'; }
              setTimeout(() => { setLevel(0); if (errEl) errEl.textContent = '--'; if (fb) fb.textContent = ''; }, 1400);
            }
          } else {
            const err = Math.abs(level - t2);
            if (errEl) errEl.textContent = err.toFixed(1) + 'ml';
            if (err <= 5) { NF.Sfx.success(); setTimeout(() => win(w), 400); }
            else {
              NF.Sfx.fail();
              if (fb) { fb.style.color = '#d08a9c'; fb.textContent = '✕ 误差过大（' + err.toFixed(1) + 'ml）。重来。'; }
              setTimeout(() => { setLevel(0); round = 1; done1 = false; if (roundEl) roundEl.textContent = '1 / 2'; if (errEl) errEl.textContent = '--'; if (fb) fb.textContent = ''; }, 1400);
            }
          }
        }
        btn.addEventListener('mousedown', start);
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); start(); }, { passive: false });
        ['mouseup','mouseleave','touchend','touchcancel'].forEach(ev => {
          btn.addEventListener(ev, (e) => { if (ev.startsWith('touch')) e.preventDefault(); stop(); }, { passive: false });
        });
        w.querySelector('#pourClose').onclick = () => { if (timer) clearInterval(timer); NF.Sfx.click(); NF.closeModal(w); };
        function win(w) {
          reward(20, { fiman: 8 });
          NF.closeModal(w);
          NF.openModal({
            title: '调 酒 · 完 成',
            body: '<div class="ending-card"><span class="e-icon">✦</span><div class="e-title">完美比例</div><div class="e-sub">Perfect Mix</div><div class="e-desc">你把调好的酒推到菲曼面前。她尝了一口，眉毛微微抬起。<br><br>"Not bad. Not bad at all."<br>「不错。相当不错。」<br><br>银镑 +20 · 菲曼亲密 +8</div></div>',
            footHTML: '<button class="btn primary" id="pOk">好的</button>',
            onMount: (w2) => { w2.querySelector('#pOk').onclick = () => { NF.closeModal(w2); NF.showScreen('map'); }; }
          });
        }
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     2) 证据链连线
     ═══════════════════════════════════════════════════════════ */
  function openEvidence() {
    const cards = [
      { id:'a', ico:'🪶', name:'染血乌鸦羽毛' },
      { id:'b', ico:'♜', name:'封印战场焦土' },
      { id:'c', ico:'✉', name:'第三日战报' },
      { id:'d', ico:'☽', name:'梦域扩张地图' },
      { id:'e', ico:'♔', name:'缇斯身份记录' },
      { id:'f', ico:'☠', name:'未归之人名单' }
    ];
    const pairs = [['a','e'],['b','c'],['d','f']];
    NF.openModal({
      title: '档 案 室 · 证 据 链',
      body:
        '<div class="mini-title">◈ 证 据 链 ◈</div>' +
        '<div class="mini-sub">点击两张相关卡片，建立证据链。连错损失理智。</div>' +
        '<div class="mini-hud"><div class="mini-hud-item">已连线<b id="evDone">0 / 3</b></div><div class="mini-hud-item">理智<b id="evSan">100</b></div></div>' +
        '<div class="mini-stage evidence-area" id="evArea"></div>',
      footHTML: '<button class="btn ghost" id="evClose">关闭</button>',
      onMount: (w) => {
        const area = w.querySelector('#evArea');
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'ev-svg');
        area.appendChild(svg);
        let san = 100, found = 0, selected = null;
        const positions = {};
        const W = area.clientWidth || 300;
        const H = area.clientHeight || 340;
        cards.forEach((c, i) => {
          const el = document.createElement('div');
          el.className = 'ev-card';
          const x = 10 + (i % 2) * (W / 2 - 10) + Math.random() * 20;
          const y = 10 + Math.floor(i / 2) * (H / 3) + Math.random() * 20;
          el.style.left = clamp(x, 4, W - 92) + 'px';
          el.style.top = clamp(y, 4, H - 70) + 'px';
          el.innerHTML = '<div class="ev-ico">' + c.ico + '</div>' + c.name;
          area.appendChild(el);
          positions[c.id] = el;
          el.onclick = () => {
            if (el.classList.contains('done')) return;
            if (!selected) { selected = c.id; el.classList.add('sel'); NF.Sfx.click(); }
            else if (selected === c.id) { el.classList.remove('sel'); selected = null; NF.Sfx.click(); }
            else {
              const p = pairs.find(pr => (pr[0]===selected && pr[1]===c.id) || (pr[1]===selected && pr[0]===c.id));
              const fromEl = positions[selected];
              if (p) {
                NF.Sfx.success();
                fromEl.classList.remove('sel'); fromEl.classList.add('done'); el.classList.add('done');
                drawLine(fromEl, el, '#c9a961');
                found++;
                w.querySelector('#evDone').textContent = found + ' / 3';
                selected = null;
                if (found >= 3) setTimeout(() => win(w), 500);
              } else {
                NF.Sfx.fail();
                san -= 15;
                if (window.NF?.settings?.().shake && navigator.vibrate) try { navigator.vibrate(120); } catch(e){}
                w.querySelector('#evSan').textContent = san;
                drawLine(fromEl, el, '#c04060', true);
                fromEl.classList.remove('sel');
                selected = null;
                if (san <= 0) setTimeout(() => fail(w), 500);
              }
            }
          };
        });
        function drawLine(f, t, color, temp) {
          const fr = f.getBoundingClientRect(), tr = t.getBoundingClientRect(), ar = area.getBoundingClientRect();
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', fr.left - ar.left + fr.width / 2);
          line.setAttribute('y1', fr.top - ar.top + fr.height / 2);
          line.setAttribute('x2', tr.left - ar.left + tr.width / 2);
          line.setAttribute('y2', tr.top - ar.top + tr.height / 2);
          line.setAttribute('stroke', color);
          line.setAttribute('stroke-width', '2');
          line.setAttribute('stroke-dasharray', '5,3');
          line.setAttribute('opacity', temp ? '0.6' : '0.9');
          svg.appendChild(line);
          if (temp) setTimeout(() => line.remove(), 600);
        }
        function win(w) {
          NF.Sfx.success();
          reward(15, null);
          NF.closeModal(w);
          NF.openModal({
            title: '证 据 链 · 完 成',
            body: '<div class="ending-card"><span class="e-icon">✦</span><div class="e-title">证据链成立</div><div class="e-sub">Complete</div><div class="e-desc">三组线索相互印证。<br><br>银镑 +15</div></div>',
            footHTML: '<button class="btn primary" id="evOk">好的</button>',
            onMount: (w2) => { w2.querySelector('#evOk').onclick = () => { NF.closeModal(w2); NF.showScreen('map'); }; }
          });
        }
        function fail(w) {
          NF.Sfx.fail();
          NF.closeModal(w);
          NF.openModal({
            title: '理 智 崩 溃',
            body: '<div class="ending-card"><span class="e-icon" style="color:#c04060;">☠</span><div class="e-title" style="color:#c04060;">线索断裂</div><div class="e-sub">Sanity Depleted</div><div class="e-desc">太多错误的连接让你的思路一片混乱。</div></div>',
            footHTML: '<button class="btn primary" id="evBack">返回</button>',
            onMount: (w2) => { w2.querySelector('#evBack').onclick = () => { NF.closeModal(w2); NF.showScreen('map'); }; }
          });
        }
        w.querySelector('#evClose').onclick = () => { NF.Sfx.click(); NF.closeModal(w); };
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     3) 棋局走位
     ═══════════════════════════════════════════════════════════ */
  function openChess() {
    const death = { '1-0':true, '2-1':true, '3-2':true, '1-2':true };
    const GOAL = { r: 3, c: 3 };
    NF.openModal({
      title: '伊 林 堡 · 棋 局',
      body:
        '<div class="mini-title">◈ 残 局 走 位 ◈</div>' +
        '<div class="mini-sub">你是一枚兵。5 步内抵达升变格。</div>' +
        '<div class="mini-hud"><div class="mini-hud-item">步数<b id="chMoves">0 / 5</b></div><div class="mini-hud-item">理智<b id="chSan">100</b></div></div>' +
        '<div class="chess-board" id="chessBoard"></div>',
      footHTML: '<button class="btn ghost" id="chClose">关闭</button>',
      onMount: (w) => {
        const board = w.querySelector('#chessBoard');
        const movesEl = w.querySelector('#chMoves');
        const sanEl = w.querySelector('#chSan');
        let pos = { r: 0, c: 0 }, moves = 0, san = 100, playing = true;
        const MAX = 5;
        function render() {
          board.innerHTML = '';
          for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
            const cell = document.createElement('div');
            cell.className = 'chess-cell ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
            if (death[r + '-' + c]) cell.classList.add('death');
            if (r === GOAL.r && c === GOAL.c) cell.classList.add('goal');
            if (r === pos.r && c === pos.c) cell.classList.add('player');
            if (playing && !death[r + '-' + c]) {
              const dr = r - pos.r, dc = Math.abs(c - pos.c);
              if (dr === 1 && dc <= 1) { cell.classList.add('valid'); cell.onclick = () => move(r, c); }
            } else if (playing && death[r + '-' + c]) {
              const dr = r - pos.r, dc = Math.abs(c - pos.c);
              if (dr === 1 && dc <= 1) cell.onclick = () => hit();
            }
            board.appendChild(cell);
          }
        }
        function move(r, c) {
          if (!playing) return;
          NF.Sfx.click(); moves++; pos = { r, c };
          if (movesEl) movesEl.textContent = moves + ' / ' + MAX;
          render();
          if (r === GOAL.r && c === GOAL.c) { playing = false; setTimeout(() => win(w), 300); return; }
          if (moves >= MAX) { playing = false; setTimeout(() => fail(w), 400); }
        }
        function hit() {
          if (!playing) return;
          NF.Sfx.fail();
          if (window.NF?.settings?.().shake && navigator.vibrate) try { navigator.vibrate(150); } catch(e){}
          san -= 25;
          if (sanEl) sanEl.textContent = Math.max(0, san);
          if (san <= 0) { playing = false; setTimeout(() => fail(w), 400); }
        }
        function win(w) {
          NF.Sfx.success();
          reward(25, null);
          NF.closeModal(w);
          NF.openModal({
            title: '棋 局 · 完 成',
            body: '<div class="ending-card"><span class="e-icon">♔</span><div class="e-title">升变</div><div class="e-sub">Promotion</div><div class="e-desc">你的兵走完了最后一步，落在了棋盘的尽头。<br><br>银镑 +25</div></div>',
            footHTML: '<button class="btn primary" id="chOk">好的</button>',
            onMount: (w2) => { w2.querySelector('#chOk').onclick = () => { NF.closeModal(w2); NF.showScreen('map'); }; }
          });
        }
        function fail(w) {
          NF.Sfx.fail();
          NF.closeModal(w);
          NF.openModal({
            title: '棋 局 · 失 败',
            body: '<div class="ending-card"><span class="e-icon" style="color:#c04060;">☠</span><div class="e-title" style="color:#c04060;">兵被吃掉了</div><div class="e-sub">Pawn Captured</div><div class="e-desc">下次，先看清楚哪些格子是活着的。</div></div>',
            footHTML: '<button class="btn primary" id="chBack">返回</button>',
            onMount: (w2) => { w2.querySelector('#chBack').onclick = () => { NF.closeModal(w2); NF.showScreen('map'); }; }
          });
        }
        render();
        w.querySelector('#chClose').onclick = () => { NF.Sfx.click(); NF.closeModal(w); };
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     4) 光影拼图（滑块 3x3）
     ═══════════════════════════════════════════════════════════ */
  function openPuzzle() {
    const SYMS = ['✦','☽','♔','❖','✧','✶','☩','♕'];
    let tiles = [1,2,3,4,5,6,7,8,0];
    function neighbors(i) {
      const r = Math.floor(i / 3), c = i % 3, o = [];
      if (r > 0) o.push(i - 3);
      if (r < 2) o.push(i + 3);
      if (c > 0) o.push(i - 1);
      if (c < 2) o.push(i + 1);
      return o;
    }
    function shuffle() {
      for (let k = 0; k < 80; k++) {
        const e = tiles.indexOf(0);
        const ns = neighbors(e);
        const p = ns[Math.floor(Math.random() * ns.length)];
        tiles[e] = tiles[p];
        tiles[p] = 0;
      }
    }
    shuffle();
    NF.openModal({
      title: '卡 特 琳 教 堂 · 拼 图',
      body:
        '<div class="mini-title">◈ 光 影 拼 图 ◈</div>' +
        '<div class="mini-sub">滑动方块，拼出完整图案。</div>' +
        '<div class="mini-hud"><div class="mini-hud-item">步数<b id="pzMoves">0</b></div></div>' +
        '<div class="puzzle-stage" id="puzzleStage"></div>',
      footHTML: '<button class="btn ghost" id="pzClose">关闭</button><button class="btn" id="pzReset">重置</button>',
      onMount: (w) => {
        const stage = w.querySelector('#puzzleStage');
        const movesEl = w.querySelector('#pzMoves');
        let moves = 0;
        function render() {
          stage.innerHTML = '';
          tiles.forEach((v, i) => {
            const el = document.createElement('div');
            el.className = 'puzzle-tile' + (v === 0 ? ' empty' : '');
            if (v === 0) { stage.appendChild(el); return; }
            const row = Math.floor(i / 3), col = i % 3;
            el.style.left = (col * 33.3333) + '%';
            el.style.top = (row * 33.3333) + '%';
            el.textContent = SYMS[v - 1];
            el.onclick = () => tryMove(i);
            stage.appendChild(el);
          });
        }
        function tryMove(idx) {
          const e = tiles.indexOf(0);
          const r1 = Math.floor(idx / 3), c1 = idx % 3;
          const r2 = Math.floor(e / 3), c2 = e % 3;
          if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return;
          NF.Sfx.click();
          tiles[e] = tiles[idx]; tiles[idx] = 0; moves++;
          if (movesEl) movesEl.textContent = moves;
          render();
          setTimeout(check, 300);
        }
        function check() {
          const ok = tiles.every((v, i) => i === 8 ? v === 0 : v === i + 1);
          if (ok) {
            NF.Sfx.success();
            reward(30, null);
            NF.closeModal(w);
            NF.openModal({
              title: '拼 图 · 完 成',
              body: '<div class="ending-card"><span class="e-icon">✦</span><div class="e-title">光影复原</div><div class="e-sub">Restored</div><div class="e-desc">彩绘玻璃重新拼合。阳光穿过，在地上投下完整的神明图案。<br><br>银镑 +30</div></div>',
              footHTML: '<button class="btn primary" id="pzOk">好的</button>',
              onMount: (w2) => { w2.querySelector('#pzOk').onclick = () => { NF.closeModal(w2); NF.showScreen('map'); }; }
            });
          }
        }
        render();
        w.querySelector('#pzClose').onclick = () => { NF.Sfx.click(); NF.closeModal(w); };
        w.querySelector('#pzReset').onclick = () => {
          NF.Sfx.click();
          tiles = [1,2,3,4,5,6,7,8,0];
          shuffle(); moves = 0;
          if (movesEl) movesEl.textContent = 0;
          render();
        };
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     5) 梦域 Roguelike
     ═══════════════════════════════════════════════════════════ */
  function openDream() {
    NF.openModal({
      title: '梦 域 · 规 则 怪 谈',
      body:
        '<div class="mini-title">☽ 进 入 梦 域 ☾</div>' +
        '<div class="mini-sub">在踏入银杏林边缘的裂隙之前，请牢记以下规则。</div>' +
        '<div style="border:1px solid var(--line);padding:16px;background:rgba(0,0,0,.25);">' +
          '<p style="font-size:13px;line-height:2.2;color:var(--text);">' +
            '<span style="color:var(--gold);">一、</span> 绝对不能触碰地上的乌鸦烙印。<br>' +
            '<span style="color:var(--gold);">二、</span> 如果有人叫你的名字，先确认对方有影子。<br>' +
            '<span style="color:var(--gold);">三、</span> 骰子掷出大于 10 的点数，你才能继续前进。<br>' +
            '<span style="color:var(--gold);">四、</span> 理智归零者，将成为未归之人。' +
          '</p>' +
        '</div>',
      footHTML: '<button class="btn ghost" id="drCancel">离开</button><button class="btn primary" id="drEnter">进 入</button>',
      onMount: (w) => {
        w.querySelector('#drCancel').onclick = () => { NF.Sfx.click(); NF.closeModal(w); };
        w.querySelector('#drEnter').onclick = () => { NF.Sfx.click(); NF.closeModal(w); setTimeout(startDreamBattle, 200); };
      }
    });
  }

  function startDreamBattle() {
    const b = { playerSan: 100, playerHp: 100, enemyHp: 100, over: false, diceRolled: false };
    NF.openModal({
      title: '梦 域 · 焦 土 残 影',
      body:
        '<div class="mini-title">☽ 焦 土 残 影 ☾</div>' +
        '<div class="mini-sub">梦域的守卫正在苏醒。</div>' +
        '<div class="battle-bar">' +
          '<div class="battle-name"><span>你</span><span>HP <b id="bPhp">100</b> · SAN <b id="bPsan">100</b></span></div>' +
          '<div class="battle-track"><div class="battle-fill hp" id="bPhpBar" style="width:100%"></div></div>' +
          '<div class="battle-track" style="margin-top:4px;"><div class="battle-fill san" id="bPsanBar" style="width:100%"></div></div>' +
        '</div>' +
        '<div class="battle-bar">' +
          '<div class="battle-name"><span>焦土残影</span><span>HP <b id="bEhp">100</b></span></div>' +
          '<div class="battle-track"><div class="battle-fill" id="bEhpBar" style="width:100%"></div></div>' +
        '</div>' +
        '<div class="dice-area"><div class="dice" id="drDice">?</div><div style="font-size:11px;color:var(--text-d);letter-spacing:.1em;" id="drDiceMsg">掷骰以决定行动成败</div></div>' +
        '<div style="display:flex;gap:10px;"><button class="btn" id="drRoll" style="flex:1;">掷 骰</button><button class="btn" id="drAttack" style="flex:1;" disabled>攻 击</button><button class="btn" id="drDefend" style="flex:1;" disabled>防 御</button></div>' +
        '<div style="text-align:center;margin-top:14px;font-size:11px;color:var(--text-d);" id="drLog">—</div>',
      footHTML: '<button class="btn ghost" id="drFlee">逃 离 梦 域</button>',
      onMount: (w) => {
        const diceEl = w.querySelector('#drDice');
        const msgEl = w.querySelector('#drDiceMsg');
        const logEl = w.querySelector('#drLog');
        const rollBtn = w.querySelector('#drRoll');
        const atkBtn = w.querySelector('#drAttack');
        const defBtn = w.querySelector('#drDefend');
        let lastRoll = 0;
        function updateBars() {
          w.querySelector('#bPhp').textContent = Math.max(0, b.playerHp);
          w.querySelector('#bPsan').textContent = Math.max(0, b.playerSan);
          w.querySelector('#bEhp').textContent = Math.max(0, b.enemyHp);
          w.querySelector('#bPhpBar').style.width = clamp(b.playerHp, 0, 100) + '%';
          w.querySelector('#bPsanBar').style.width = clamp(b.playerSan, 0, 100) + '%';
          w.querySelector('#bEhpBar').style.width = clamp(b.enemyHp, 0, 100) + '%';
        }
        function roll() {
          if (b.over || b.diceRolled) return;
          NF.Sfx.dice();
          rollBtn.disabled = true;
          let c = 0;
          const iv = setInterval(() => {
            diceEl.textContent = Math.floor(Math.random() * 20) + 1;
            c++;
            if (c >= 10) {
              clearInterval(iv);
              lastRoll = Math.floor(Math.random() * 20) + 1;
              diceEl.textContent = lastRoll;
              if (window.gsap) { try { gsap.fromTo(diceEl, { scale: 0.8, rotation: -20 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'elastic.out(1,0.5)' }); } catch(e){} }
              if (lastRoll > 10) {
                NF.Sfx.success();
                msgEl.textContent = '◈ 判定成功（' + lastRoll + ' > 10）';
                msgEl.style.color = '#9dd0a0';
              } else {
                NF.Sfx.fail();
                msgEl.textContent = '✕ 判定失败（' + lastRoll + ' ≤ 10）· 理智 -10';
                msgEl.style.color = '#d08a9c';
                b.playerSan -= 10;
                updateBars();
                if (window.NF?.settings?.().shake && navigator.vibrate) try { navigator.vibrate(100); } catch(e){}
              }
              b.diceRolled = true;
              atkBtn.disabled = false;
              defBtn.disabled = false;
              if (b.playerSan <= 0) end('lose');
            }
          }, 80);
        }
        function doAction(type) {
          if (b.over || !b.diceRolled) return;
          atkBtn.disabled = true;
          defBtn.disabled = true;
          if (type === 'attack') {
            NF.Sfx.hit();
            if (window.NF?.settings?.().shake && navigator.vibrate) try { navigator.vibrate(60); } catch(e){}
            let dmg = lastRoll * 2 + Math.floor(Math.random() * 10);
            if (lastRoll > 15) dmg += 15;
            b.enemyHp -= dmg;
            logEl.textContent = '你造成 ' + dmg + ' 点伤害。';
          } else {
            b.playerSan = Math.min(100, b.playerSan + 8);
            logEl.textContent = '你稳住了心神。理智 +8。';
          }
          updateBars();
          if (b.enemyHp <= 0) { setTimeout(() => end('win'), 500); return; }
          setTimeout(() => {
            const dmg = 8 + Math.floor(Math.random() * 12);
            b.playerSan -= dmg;
            b.playerHp -= Math.floor(dmg / 2);
            logEl.textContent += ' 残影反击，理智 -' + dmg + '。';
            NF.Sfx.hit();
            if (window.NF?.settings?.().shake && navigator.vibrate) try { navigator.vibrate(80); } catch(e){}
            updateBars();
            if (b.playerSan <= 0 || b.playerHp <= 0) { setTimeout(() => end('lose'), 400); return; }
            b.diceRolled = false;
            rollBtn.disabled = false;
            msgEl.textContent = '新回合。再次掷骰。';
            msgEl.style.color = '';
          }, 900);
        }
        function end(result) {
          b.over = true;
          rollBtn.disabled = true; atkBtn.disabled = true; defBtn.disabled = true;
          if (result === 'win') {
            NF.Sfx.success();
            const silver = 30 + Math.floor(Math.random() * 20);
            reward(silver, null);
            setTimeout(() => {
              NF.closeModal(w);
              NF.openModal({
                title: '梦 域 · 胜 利',
                body: '<div class="ending-card"><span class="e-icon">✦</span><div class="e-title">残影消散</div><div class="e-sub">Dream Shard Collected</div><div class="e-desc">焦土残影在你面前化为灰烬。灰烬中落下一枚梦域碎片。<br><br>银镑 +' + silver + '</div></div>',
                footHTML: '<button class="btn primary" id="drBack">返回地图</button>',
                onMount: (w2) => { w2.querySelector('#drBack').onclick = () => { NF.closeModal(w2); NF.showScreen('map'); }; }
              });
            }, 500);
          } else {
            NF.Sfx.fail();
            setTimeout(() => {
              NF.closeModal(w);
              NF.openModal({
                title: '梦 域 · 沦 陷',
                body: '<div class="ending-card"><span class="e-icon" style="color:#c04060;">☠</span><div class="e-title" style="color:#c04060;">未归之人</div><div class="e-sub">The Unreturned</div><div class="e-desc">你的意识正在沉入梦域的底部。在最后一刻，你被一只黑鸦拖了回来。<br><br>（你失败了。但至少，你还活着。）</div></div>',
                footHTML: '<button class="btn primary" id="drBack">返回地图</button>',
                onMount: (w2) => { w2.querySelector('#drBack').onclick = () => { NF.closeModal(w2); NF.showScreen('map'); }; }
              });
            }, 500);
          }
        }
        rollBtn.onclick = roll;
        atkBtn.onclick = () => doAction('attack');
        defBtn.onclick = () => doAction('defend');
        w.querySelector('#drFlee').onclick = () => {
          if (b.over || confirm('确定要逃离梦域？')) { NF.Sfx.click(); NF.closeModal(w); NF.showScreen('map'); }
        };
        updateBars();
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     入口
     ═══════════════════════════════════════════════════════════ */
  window.Minigames = {
    open: function (id) {
      if (id === 'pour') openPour();
      else if (id === 'evidence') openEvidence();
      else if (id === 'chess') openChess();
      else if (id === 'puzzle') openPuzzle();
      else if (id === 'dream') openDream();
      else NF.toast('小游戏未实现：' + id, 'warn');
    }
  };

})();
