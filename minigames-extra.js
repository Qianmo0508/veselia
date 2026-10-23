/* ═══════════════════════════════════════════════════════════
   minigames-extra.js · 每日限制 + 多酒谱 + 王翼棋局 + 学徒测验
   依赖 index.html 暴露的 window.NF 和 window.Minigames
   必须在 minigames.js 之后加载
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.NF) { console.error('[minigames-extra] NF 未找到'); return; }
  const NF = window.NF;
  const $ = s => document.querySelector(s);
  const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp = (v,a,b) => Math.max(a, Math.min(b,v));

  /* 保存原入口 —— 若 minigames.js 未加载则 fallback */
  const origOpen = (window.Minigames && window.Minigames.open) ? window.Minigames.open : function (id) {
    NF.toast('小游戏模块未加载：' + id, 'warn');
  };

  /* ═══════════════════════════════════════════════════════════
     每日限制核心
     ═══════════════════════════════════════════════════════════ */
  const K_LOG = 'nightfalling_v4_minigame_log';
  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function getLog() {
    try { return JSON.parse(localStorage.getItem(K_LOG) || '{}'); } catch(e) { return {}; }
  }
  function setLog(d) {
    try { localStorage.setItem(K_LOG, JSON.stringify(d)); } catch(e) {}
  }
  function canPlay(id) {
    const log = getLog();
    const today = todayStr();
    return !(log[today] && log[today][id]);
  }
  function markPlayed(id) {
    const log = getLog();
    const today = todayStr();
    if (!log[today]) log[today] = {};
    log[today][id] = Date.now();
    /* 清理 7 天前的旧记录 */
    const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
    for (const k in log) {
      if (!log[k] || typeof log[k] !== 'object') { delete log[k]; continue; }
      let hasRecent = false;
      for (const k2 in log[k]) {
        if (typeof log[k][k2] === 'number' && log[k][k2] > cutoff) hasRecent = true;
      }
      if (!hasRecent) delete log[k];
    }
    setLog(log);
  }

  /* ═══════════════════════════════════════════════════════════
     奖励函数
     ═══════════════════════════════════════════════════════════ */
  function reward(silver, affObj) {
    const s = NF.state();
    if (!s) return;
    if (silver) s.stats.silver = (s.stats.silver || 0) + silver;
    if (affObj) for (const k in affObj) s.affection[k] = (s.affection[k] || 0) + affObj[k];
    NF.saveNow();
  }

  /* ═══════════════════════════════════════════════════════════
     通用小工具：结算弹窗
     ═══════════════════════════════════════════════════════════ */
  function showWinModal(opts) {
    NF.openModal({
      title: opts.title || '完 成',
      body: '<div class="ending-card">' +
        '<span class="e-icon">' + (opts.icon || '✦') + '</span>' +
        '<div class="e-title">' + esc(opts.head || '') + '</div>' +
        '<div class="e-sub">' + esc(opts.sub || '') + '</div>' +
        '<div class="e-desc">' + (opts.desc || '') + '</div>' +
      '</div>',
      footHTML: '<button class="btn primary" id="wxOk">好的</button>',
      onMount: (w) => {
        w.querySelector('#wxOk').onclick = () => { NF.closeModal(w); if (opts.onClose) opts.onClose(); };
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     酒馆 · 多酒谱（英伦经典）
     ═══════════════════════════════════════════════════════════ */
  const POUR_RECIPES = [
    { key:'pour_whisky_lemon', name:'威士忌 · 柠檬', en:'Whisky & Lemon',
      desc:'最简单的一款。菲曼说，学徒先从这里开始。',
      parts: [
        { label:'威士忌', target:40, tol:3 },
        { label:'柠檬汁', target:20, tol:3 }
      ],
      reward: 10, aff: { fiman: 3 }
    },
    { key:'pour_gin_tonic', name:'金汤力', en:'Gin & Tonic',
      desc:'伦敦的黄昏味道。汤力水的气泡在玻璃杯里跳。',
      parts: [
        { label:'金酒', target:40, tol:3 },
        { label:'汤力水', target:60, tol:4 }
      ],
      reward: 14, aff: { fiman: 4 }
    },
    { key:'pour_pimms', name:'皮姆杯', en:"Pimm's Cup",
      desc:'英伦夏天的旧习——皮姆酒、柠檬汽水、一片黄瓜、几颗草莓。',
      parts: [
        { label:'皮姆酒', target:50, tol:3 },
        { label:'柠檬汽水', target:50, tol:4 }
      ],
      reward: 18, aff: { fiman: 5 }
    },
    { key:'pour_collins', name:'汤姆柯林斯', en:'Tom Collins',
      desc:'十九世纪的老配方。金酒、柠檬、糖、苏打水，加冰。',
      parts: [
        { label:'金酒', target:45, tol:3 },
        { label:'柠檬汁', target:30, tol:3 },
        { label:'苏打水', target:25, tol:3 }
      ],
      reward: 22, aff: { fiman: 6 }
    },
    { key:'pour_elderflower', name:'接骨木花柯林斯', en:'Elderflower Collins',
      desc:'旧书店里那种味道。花香、酸、冷。最贵的一款。',
      parts: [
        { label:'金酒', target:40, tol:3 },
        { label:'接骨木花糖浆', target:20, tol:3 },
        { label:'苏打水', target:40, tol:4 }
      ],
      reward: 28, aff: { fiman: 8 }
    }
  ];

  function showRecipeSelect() {
    const s = NF.state();
    const aff = (s?.affection?.fiman) || 0;
    let html = '<div style="margin-bottom:14px;font-size:11.5px;color:var(--text-d);letter-spacing:.06em;line-height:1.7;">' +
      '菲曼把酒单推过来，指尖停在几行字上。<br>「今天想试哪一款？」' +
      '<br><span style="color:var(--gold-d);">（今日仅可调一杯。好感越高，能调的越多。）</span></div>';
    html += '<div style="display:flex;flex-direction:column;gap:10px;">';
    POUR_RECIPES.forEach((r, i) => {
      const need = i === 0 ? 0 : i * 8;
      const unlocked = aff >= need;
      html += '<div class="gift-item" data-key="' + r.key + '" ' + (unlocked?'':'style="opacity:.5;cursor:not-allowed;"') + '>' +
        '<div class="gift-ico">♨</div>' +
        '<div class="gift-info">' +
          '<div class="gift-name">' + esc(r.name) + ' · ' + esc(r.en) + '</div>' +
          '<div class="gift-meta">' + esc(r.desc) + '</div>' +
          '<div class="gift-meta" style="margin-top:3px;color:var(--gold-d);">' +
            '银镑 +' + r.reward + ' · 菲曼 +' + r.aff.fiman +
            (unlocked ? '' : ' · 好感 ' + need + ' 解锁') +
          '</div>' +
        '</div>' +
      '</div>';
    });
    html += '</div>';
    NF.openModal({
      title:'日 不 落 酒 馆 · 酒 单',
      body: html,
      footHTML:'<button class="btn ghost" id="rsCancel">算了</button>',
      onMount: (w) => {
        w.querySelector('#rsCancel').onclick = () => { NF.Sfx.click(); NF.closeModal(w); };
        w.querySelectorAll('.gift-item').forEach((el, i) => {
          const r = POUR_RECIPES[i];
          const need = i === 0 ? 0 : i * 8;
          if (aff < need) return;
          el.onclick = () => { NF.Sfx.click(); NF.closeModal(w); openPourGame(r); };
        });
      }
    });
  }

  function openPourGame(recipe) {
    /* 生成进度面板 */
    let partsHTML = '';
    recipe.parts.forEach((p, i) => {
      const bottomPct = 20 + i * 25; // 视觉上错开
      partsHTML += '<div style="margin-bottom:6px;font-size:11px;color:var(--gold-d);">' +
        '第 ' + (i+1) + ' 步：' + esc(p.label) + '（目标 ' + p.target + 'ml ±' + p.tol + '）' +
      '</div>';
    });

    NF.openModal({
      title:'日 不 落 酒 馆 · 调 酒',
      body:
        '<div class="mini-title">◈ ' + esc(recipe.name) + ' ◈</div>' +
        '<div class="mini-sub">' + esc(recipe.en) + ' · 按住注入，到标记线松手。</div>' +
        '<div style="text-align:center;font-size:11.5px;color:var(--text-d);line-height:1.7;margin-bottom:14px;">' + esc(recipe.desc) + '</div>' +
        '<div class="mini-hud">' +
          '<div class="mini-hud-item">步骤<b id="pourRound">1 / ' + recipe.parts.length + '</b></div>' +
          '<div class="mini-hud-item">当前目标<b id="pourTarget">' + recipe.parts[0].target + 'ml</b></div>' +
          '<div class="mini-hud-item">误差<b id="pourErr">--</b></div>' +
        '</div>' +
        '<div class="pour-stage"><div class="glass">' +
          '<div class="glass-marker m1" id="pourMarker" style="bottom:' + recipe.parts[0].target + '%;"><span class="mlabel" id="pourMarkerLabel">' + recipe.parts[0].target + 'ml</span></div>' +
          '<div class="glass-liquid" id="pourLiquid"></div>' +
        '</div></div>' +
        '<button class="pour-btn" id="pourBtn">按 住 倒 酒</button>' +
        '<div class="pour-feedback" id="pourFeedback"></div>',
      footHTML:'<button class="btn ghost" id="pourClose">关 闭</button>',
      onMount: (w) => {
        const liquid = w.querySelector('#pourLiquid');
        const btn = w.querySelector('#pourBtn');
        const fb = w.querySelector('#pourFeedback');
        const roundEl = w.querySelector('#pourRound');
        const errEl = w.querySelector('#pourErr');
        const targetEl = w.querySelector('#pourTarget');
        const marker = w.querySelector('#pourMarker');
        const markerLabel = w.querySelector('#pourMarkerLabel');

        let step = 0, level = 0, pouring = false, timer = null;
        let stepLevels = [];

        function setLevel(v) {
          level = clamp(v, 0, 100);
          if (liquid) liquid.style.height = level + '%';
        }

        function updateMarker() {
          const p = recipe.parts[step];
          if (marker) marker.style.bottom = p.target + '%';
          if (markerLabel) markerLabel.textContent = p.target + 'ml';
          if (targetEl) targetEl.textContent = p.target + 'ml';
          if (roundEl) roundEl.textContent = (step + 1) + ' / ' + recipe.parts.length;
        }

        function start() {
          if (pouring) return;
          pouring = true; btn.classList.add('pouring');
          timer = setInterval(() => {
            setLevel(level + 0.8);
            if (level >= 100) stop();
          }, 30);
        }

        function stop() {
          if (!pouring) return;
          pouring = false; btn.classList.remove('pouring');
          clearInterval(timer); timer = null;
          const p = recipe.parts[step];
          const err = Math.abs(level - p.target);
          if (errEl) errEl.textContent = err.toFixed(1) + 'ml';
          if (err <= p.tol) {
            /* 本步成功 */
            NF.Sfx.success();
            stepLevels.push(level);
            if (step < recipe.parts.length - 1) {
              step++;
              setLevel(0);
              updateMarker();
              if (fb) { fb.style.color = '#9dd0a0'; fb.textContent = '◈ ' + p.label + ' 完成。下一步。'; }
            } else {
              /* 全部成功 */
              if (fb) { fb.style.color = '#9dd0a0'; fb.textContent = '◈ 完美！'; }
              setTimeout(() => win(w), 400);
            }
          } else {
            /* 失败 */
            NF.Sfx.fail();
            if (fb) { fb.style.color = '#d08a9c'; fb.textContent = '✕ ' + p.label + ' 误差 ' + err.toFixed(1) + 'ml（超 ±' + p.tol + '）。重来这一步。'; }
            setTimeout(() => {
              setLevel(0);
              if (errEl) errEl.textContent = '--';
              if (fb) fb.textContent = '';
            }, 1400);
          }
        }

        function win(w) {
          reward(recipe.reward, recipe.aff);
          const s = NF.state();
          const affBefore = (s?.affection?.fiman || 0);
          NF.closeModal(w);
          showWinModal({
            title:'调 酒 · 完 成',
            icon:'✦',
            head:'一杯 ' + recipe.name,
            sub: recipe.en,
            desc: '菲曼看了你一眼，把杯子端到嘴边尝了一口。<br>' +
              '「……可以。」<br><br>' +
              '<b style="color:var(--gold);">银镑 +' + recipe.reward + '</b>　·　菲曼好感 +' + recipe.aff.fiman + '<br>' +
              '<span style="font-size:11px;color:var(--text-d);">（今日酒馆已用过。明日再来。）</span>',
            onClose: () => {
              if (typeof NF.renderMap === 'function') NF.renderMap();
            }
          });
        }

        updateMarker();

        btn.addEventListener('mousedown', start);
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); start(); }, { passive: false });
        ['mouseup','mouseleave','touchend','touchcancel'].forEach(ev => {
          btn.addEventListener(ev, (e) => { if (ev.startsWith('touch')) e.preventDefault(); stop(); }, { passive: false });
        });

        w.querySelector('#pourClose').onclick = () => { if (timer) clearInterval(timer); NF.Sfx.click(); NF.closeModal(w); };
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     王翼 · 棋局厅（三种变体）
     ═══════════════════════════════════════════════════════════ */
  const CHESS_VARIANTS = {
    knight: {
      title:'棋局 · 骑士',
      sub:'骑士从 A1 出发，3 步内走到 D4。骑士走「日」字。',
      piece:'♘',
      start:{r:0,c:0},
      goal:{r:3,c:3},
      death:{},
      maxSteps:3,
      moves: function(from, to) {
        const dr = Math.abs(from.r - to.r);
        const dc = Math.abs(from.c - to.c);
        return (dr === 2 && dc === 1) || (dr === 1 && dc === 2);
      },
      reward: 18,
      aff: { tavana: 3 }
    },
    bishop: {
      title:'棋局 · 主教',
      sub:'主教从 A1 出发，4 步内走到 D4。主教走斜线。地上有两处「死格」，踩到扣理智。',
      piece:'♗',
      start:{r:0,c:0},
      goal:{r:3,c:3},
      death:{ '1-2': true, '2-1': true },
      maxSteps:4,
      moves: function(from, to) {
        const dr = Math.abs(from.r - to.r);
        const dc = Math.abs(from.c - to.c);
        return dr === dc && dr > 0;
      },
      reward: 26,
      aff: { tavana: 4 }
    },
    queen: {
      title:'棋局 · 皇后',
      sub:'皇后从 A1 出发，5 步内走到 D4。皇后走横、竖、斜任意步。地上有五处死格。',
      piece:'♕',
      start:{r:0,c:0},
      goal:{r:3,c:3},
      death:{ '0-2': true, '1-2': true, '2-1': true, '2-2': true, '3-1': true },
      maxSteps:5,
      moves: function(from, to) {
        const dr = Math.abs(from.r - to.r);
        const dc = Math.abs(from.c - to.c);
        return (dr === 0 && dc > 0) || (dc === 0 && dr > 0) || (dr === dc && dr > 0);
      },
      reward: 36,
      aff: { tavana: 6 }
    }
  };

  function showChessSelect() {
    const s = NF.state();
    const aff = (s?.affection?.tavana) || 0;
    let html = '<div style="margin-bottom:14px;font-size:11.5px;color:var(--text-d);letter-spacing:.06em;line-height:1.7;">' +
      '棋局厅里只剩你一个人。棋盘上的棋子还摆着，像是在等你。<br>' +
      '<span style="color:var(--gold-d);">（今日仅可下一局。好感越高，能下的棋越多。）</span></div>';
    html += '<div style="display:flex;flex-direction:column;gap:10px;">';
    const keys = ['knight','bishop','queen'];
    keys.forEach((k, i) => {
      const v = CHESS_VARIANTS[k];
      const need = i * 10;
      const unlocked = aff >= need;
      const icon = v.piece;
      html += '<div class="gift-item" data-key="' + k + '" ' + (unlocked?'':'style="opacity:.5;cursor:not-allowed;"') + '>' +
        '<div class="gift-ico">' + icon + '</div>' +
        '<div class="gift-info">' +
          '<div class="gift-name">' + esc(v.title.replace('棋局 · ', '')) + '</div>' +
          '<div class="gift-meta">' + esc(v.sub) + '</div>' +
          '<div class="gift-meta" style="margin-top:3px;color:var(--gold-d);">' +
            '银镑 +' + v.reward + ' · 塔瓦娜 +' + v.aff.tavana +
            (unlocked ? '' : ' · 好感 ' + need + ' 解锁') +
          '</div>' +
        '</div>' +
      '</div>';
    });
    html += '</div>';
    NF.openModal({
      title:'伊 林 堡 · 棋 局 厅',
      body: html,
      footHTML:'<button class="btn ghost" id="csCancel">离开</button>',
      onMount: (w) => {
        w.querySelector('#csCancel').onclick = () => { NF.Sfx.click(); NF.closeModal(w); };
        w.querySelectorAll('.gift-item').forEach((el, i) => {
          const k = keys[i];
          const v = CHESS_VARIANTS[k];
          const need = i * 10;
          if (aff < need) return;
          el.onclick = () => { NF.Sfx.click(); NF.closeModal(w); openChessGame(k); };
        });
      }
    });
  }

  function openChessGame(variantKey) {
    const v = CHESS_VARIANTS[variantKey];
    if (!v) return;
    NF.openModal({
      title: v.title,
      body:
        '<div class="mini-title">◈ ' + esc(v.title.replace('棋局 · ','')) + ' ◈</div>' +
        '<div class="mini-sub">' + esc(v.sub) + '</div>' +
        '<div class="mini-hud">' +
          '<div class="mini-hud-item">步数<b id="chMoves">0 / ' + v.maxSteps + '</b></div>' +
          '<div class="mini-hud-item">理智<b id="chSan">100</b></div>' +
        '</div>' +
        '<div class="chess-board" id="chessBoard"></div>' +
        '<div style="text-align:center;margin-top:14px;font-size:11px;color:var(--text-d);letter-spacing:.1em;">' +
          '◆ 死格 ◆ 目标 ' + v.piece + ' 你的位置' +
        '</div>',
      footHTML:'<button class="btn ghost" id="chClose">关 闭</button>',
      onMount: (w) => {
        const board = w.querySelector('#chessBoard');
        const movesEl = w.querySelector('#chMoves');
        const sanEl = w.querySelector('#chSan');
        let pos = { r: v.start.r, c: v.start.c };
        let moves = 0, san = 100, playing = true;

        function render() {
          board.innerHTML = '';
          for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
            const cell = document.createElement('div');
            cell.className = 'chess-cell ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
            const isDeath = v.death && v.death[r + '-' + c];
            const isGoal = (r === v.goal.r && c === v.goal.c);
            const isPlayer = (r === pos.r && c === pos.c);

            if (isDeath) cell.classList.add('death');
            if (isGoal) cell.classList.add('goal');
            if (isPlayer) cell.classList.add('player');

            /* 可走判断 */
            if (playing && !isPlayer) {
              const canMove = v.moves(pos, {r, c});
              if (canMove && !isDeath) {
                cell.classList.add('valid');
                cell.onclick = () => moveTo(r, c);
              } else if (canMove && isDeath) {
                cell.onclick = () => hitDeath(r, c);
              }
            }

            board.appendChild(cell);
          }
        }

        function moveTo(r, c) {
          if (!playing) return;
          NF.Sfx.click();
          moves++;
          pos = { r, c };
          if (movesEl) movesEl.textContent = moves + ' / ' + v.maxSteps;
          render();
          if (r === v.goal.r && c === v.goal.c) {
            playing = false;
            setTimeout(() => win(w), 300);
            return;
          }
          if (moves >= v.maxSteps) {
            playing = false;
            setTimeout(() => fail(w), 400);
          }
        }

        function hitDeath(r, c) {
          if (!playing) return;
          NF.Sfx.fail();
          if (NF.settings?.().shake && navigator.vibrate) try { navigator.vibrate(150); } catch(e){}
          san -= 25;
          if (sanEl) sanEl.textContent = Math.max(0, san);
          /* 死格按普通移动处理（走进去也算步数） */
          moves++;
          pos = { r, c };
          if (movesEl) movesEl.textContent = moves + ' / ' + v.maxSteps;
          render();
          if (san <= 0) { playing = false; setTimeout(() => fail(w), 400); }
          else if (moves >= v.maxSteps && !(r === v.goal.r && c === v.goal.c)) {
            playing = false; setTimeout(() => fail(w), 400);
          }
        }

        function win(w) {
          reward(v.reward, v.aff);
          NF.closeModal(w);
          showWinModal({
            title:'棋 局 · 完 成',
            icon:'✦',
            head:'升变 · ' + v.piece,
            sub:'Promotion',
            desc:'你走完了最后一步。<br>' +
              '黑暗中的某个声音说：<br>' +
              '<i style="font-family:var(--f-en);font-style:italic;color:var(--gold-b);">"A pawn that reaches the end... becomes something else."</i><br>' +
              '「走到尽头的兵……会变成别的东西。」<br><br>' +
              '<b style="color:var(--gold);">银镑 +' + v.reward + '</b>　·　塔瓦娜好感 +' + v.aff.tavana + '<br>' +
              '<span style="font-size:11px;color:var(--text-d);">（今日棋局厅已用过。明日再来。）</span>',
            onClose: () => { if (typeof NF.renderMap === 'function') NF.renderMap(); }
          });
        }

        function fail(w) {
          NF.Sfx.fail();
          NF.closeModal(w);
          showWinModal({
            title:'棋 局 · 失 败',
            icon:'☠',
            head:'棋 子 被 困 住',
            sub:'Checkmate',
            desc:'你没能走到升变格。<br>下次，先看清哪些格子还活着。<br><br>' +
              '<span style="font-size:11px;color:var(--text-d);">（今日棋局厅已用过。明日再来。）</span>',
            onClose: () => { if (typeof NF.renderMap === 'function') NF.renderMap(); }
          });
        }

        render();
        w.querySelector('#chClose').onclick = () => { NF.Sfx.click(); NF.closeModal(w); };
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     学徒测验
     ═══════════════════════════════════════════════════════════ */
  const QUIZ_QUESTIONS = [
    { q:'王翼国度的首都是哪座城市？', opts:['伊林堡','落日之都','映月镇','日往城'], answer:0 },
    { q:'梦域里死去、肉身存留的人被称作什么？', opts:['沉眠者','未归之人','醒者','容器'], answer:1 },
    { q:'圣梦目管理院的现任院长是谁？', opts:['莫维奥娅·沃特森','艾瑞莉·简','塔瓦娜·卡伊','赛薇拉'], answer:2 },
    { q:'摩耳甫斯原本是神族的什么职位？', opts:['审判官','梦神使','守夜者','司书'], answer:1 },
    { q:'落日之都边界外被管理院封了路的那些地方，被称作什么？', opts:['遗落梦域','封印战场','银杏林','日往城'], answer:0 }
  ];

  function openApprenticeQuiz() {
    const s = NF.state();
    let qIdx = 0, correct = 0;
    let qHTML = '';

    function renderQuestion() {
      const q = QUIZ_QUESTIONS[qIdx];
      qHTML = '<div style="font-size:11.5px;color:var(--text-d);letter-spacing:.14em;margin-bottom:12px;text-align:center;">' +
        '◈ 第 ' + (qIdx + 1) + ' / ' + QUIZ_QUESTIONS.length + ' 题 ◈</div>' +
        '<div style="font-size:15px;color:var(--text);line-height:1.9;margin-bottom:18px;text-align:center;padding:0 8px;">' + esc(q.q) + '</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;">';
      q.opts.forEach((o, i) => {
        qHTML += '<button class="choice-btn" data-opt="' + i + '"><span class="choice-idx">' + '①②③④'.charAt(i) + '</span><span>' + esc(o) + '</span></button>';
      });
      qHTML += '</div>';
    }

    function update() {
      const wrap = $('#quizWrap');
      if (!wrap) return;
      wrap.innerHTML = qHTML;
      wrap.querySelectorAll('.choice-btn').forEach(btn => {
        btn.onclick = () => {
          const opt = parseInt(btn.dataset.opt);
          const q = QUIZ_QUESTIONS[qIdx];
          if (opt === q.answer) { correct++; NF.Sfx.success(); btn.style.background = 'rgba(120,180,120,.15)'; btn.style.borderColor = 'rgba(120,180,120,.6)'; }
          else { NF.Sfx.fail(); btn.style.background = 'rgba(160,60,80,.1)'; btn.style.borderColor = 'rgba(160,60,80,.6)'; }
          setTimeout(() => {
            qIdx++;
            if (qIdx >= QUIZ_QUESTIONS.length) {
              finish();
            } else {
              renderQuestion();
              update();
            }
          }, 400);
        };
      });
    }

    function finish() {
      let reward_ = 0;
      if (correct === 5) reward_ = 45;
      else if (correct === 4) reward_ = 30;
      else if (correct === 3) reward_ = 15;
      else if (correct >= 1) reward_ = 5;
      if (reward_) reward(reward_, { tavana: correct >= 4 ? 3 : 1 });
      NF.closeAllModals();
      showWinModal({
        title:'学 徒 测 验 · 完 成',
        icon: correct >= 4 ? '✦' : (correct >= 2 ? '◈' : '◇'),
        head: correct + ' / ' + QUIZ_QUESTIONS.length + ' 题 正确',
        sub:'Apprentice Test',
        desc:'（测验结束。今日学徒训练室已用过。）<br><br>' +
          (reward_ ? '<b style="color:var(--gold);">银镑 +' + reward_ + '</b>' +
            (correct >= 4 ? '　·　塔瓦娜好感 +3' : '') : '未能获得奖励。明日再来。'),
        onClose: () => { if (typeof NF.renderMap === 'function') NF.renderMap(); }
      });
    }

    renderQuestion();
    NF.openModal({
      title:'学 徒 训 练 室',
      body:'<div id="quizWrap">' + qHTML + '</div>',
      footHTML:'<button class="btn ghost" id="qClose">离 开</button>',
      onMount: (w) => {
        w.querySelector('#qClose').onclick = () => { NF.Sfx.click(); NF.closeModal(w); };
        update();
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     主入口覆写
     ═══════════════════════════════════════════════════════════ */
  window.Minigames = {
    open: function (id) {
      /* —— 酒馆：调酒（含多酒谱 + 每日一次） —— */
      if (id === 'pour') {
        if (!canPlay('tavern')) { NF.toast('今日酒单已试过。明日再来吧。', 'warn'); return; }
        markPlayed('tavern');
        showRecipeSelect();
        return;
      }
      /* —— 伊林堡：棋局厅（含三变体 + 每日一次） —— */
      if (id === 'chess') {
        if (!canPlay('chess_hall')) { NF.toast('今日棋局已下过。明日再来吧。', 'warn'); return; }
        markPlayed('chess_hall');
        showChessSelect();
        return;
      }
      /* —— 伊林堡：学徒测验（每日一次） —— */
      if (id === 'quiz') {
        if (!canPlay('quiz')) { NF.toast('今日测验已参加过。明日再来吧。', 'warn'); return; }
        markPlayed('quiz');
        openApprenticeQuiz();
        return;
      }
      /* —— 档案室：证据链（每日一次） —— */
      if (id === 'evidence') {
        if (!canPlay('evidence')) { NF.toast('今日档案室已查过。明日再来吧。', 'warn'); return; }
        markPlayed('evidence');
        origOpen(id);
        return;
      }
      /* —— 教堂：拼图（每日一次） —— */
      if (id === 'puzzle') {
        if (!canPlay('puzzle')) { NF.toast('今日彩窗已拼过。明日再来吧。', 'warn'); return; }
        markPlayed('puzzle');
        origOpen(id);
        return;
      }
      /* —— 银杏林：梦域（每日一次） —— */
      if (id === 'dream') {
        if (!canPlay('dream')) { NF.toast('今日梦域已入过。明日再来吧。', 'warn'); return; }
        markPlayed('dream');
        origOpen(id);
        return;
      }
      /* —— 直接指定酒谱 —— */
      if (id.startsWith('pour_')) {
        if (!canPlay('tavern')) { NF.toast('今日酒单已试过。明日再来吧。', 'warn'); return; }
        markPlayed('tavern');
        const r = POUR_RECIPES.find(x => x.key === id);
        if (r) openPourGame(r);
        else origOpen(id);
        return;
      }
      /* —— 直接指定棋局变体 —— */
      if (id.startsWith('chess_') && CHESS_VARIANTS[id]) {
        if (!canPlay('chess_hall')) { NF.toast('今日棋局已下过。明日再来吧。', 'warn'); return; }
        markPlayed('chess_hall');
        openChessGame(id);
        return;
      }
      /* —— 兜底 —— */
      origOpen(id);
    },
    /* 暴露工具函数给外部（便于工坊/调试） */
    _canPlay: canPlay,
    _markPlayed: markPlayed,
    _resetDailyLog: function () { setLog({}); NF.toast('已重置小游戏每日记录', 'ok'); }
  };

  console.log('%c[minigames-extra] 每日限制 · 多酒谱 · 棋局厅 · 学徒测验 已加载', 'color:#9dd0a0;font-size:11px;');
})();
