/* ═══════════════════════════════════════════════════════════
   minigames-extra.js · 修复答题报错 + 无限玩首玩奖励 + 棋局专属底纹
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.NF) { console.error('[minigames-extra] NF 未找到'); return; }
  const NF = window.NF;
  const $ = s => document.querySelector(s);
  const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp = (v,a,b) => Math.max(a, Math.min(b,v));

  const origOpen = (window.Minigames && window.Minigames.open) ? window.Minigames.open : function (id) {
    NF.toast('小游戏模块未加载：' + id, 'warn');
  };

  /* ═══════════════════════════════════════════════════════════
     每日奖励记录（无限玩，但只有首玩有奖励）
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
  function isFirstPlay(id) {
    const log = getLog();
    const today = todayStr();
    return !(log[today] && log[today][id]);
  }
  function markPlayed(id) {
    const log = getLog();
    const today = todayStr();
    if (!log[today]) log[today] = {};
    log[today][id] = Date.now();
    setLog(log);
  }

  function giveReward(silver, affObj, isFirst) {
    if (!isFirst) {
      return null; // 非首玩不给钱
    }
    const s = NF.state();
    if (!s) return null;
    if (silver) s.stats.silver = (s.stats.silver || 0) + silver;
    if (affObj) for (const k in affObj) s.affection[k] = (s.affection[k] || 0) + affObj[k];
    NF.saveNow();
    return { silver, aff: affObj };
  }

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
     酒馆 · 多酒谱（无限玩首玩奖励）
     ═══════════════════════════════════════════════════════════ */
  const POUR_RECIPES = [
    { key:'pour_whisky_lemon', name:'威士忌 · 柠檬', en:'Whisky & Lemon', desc:'最简单的一款。', parts: [{ label:'威士忌', target:40, tol:3 }, { label:'柠檬汁', target:20, tol:3 }], reward: 10, aff: { fiman: 3 } },
    { key:'pour_gin_tonic', name:'金汤力', en:'Gin & Tonic', desc:'伦敦的黄昏味道。', parts: [{ label:'金酒', target:40, tol:3 }, { label:'汤力水', target:60, tol:4 }], reward: 14, aff: { fiman: 4 } },
    { key:'pour_pimms', name:'皮姆杯', en:"Pimm's Cup", desc:'英伦夏天的旧习。', parts: [{ label:'皮姆酒', target:50, tol:3 }, { label:'柠檬汽水', target:50, tol:4 }], reward: 18, aff: { fiman: 5 } },
    { key:'pour_collins', name:'汤姆柯林斯', en:'Tom Collins', desc:'十九世纪的老配方。', parts: [{ label:'金酒', target:45, tol:3 }, { label:'柠檬汁', target:30, tol:3 }, { label:'苏打水', target:25, tol:3 }], reward: 22, aff: { fiman: 6 } },
    { key:'pour_elderflower', name:'接骨木花柯林斯', en:'Elderflower Collins', desc:'旧书店里那种味道。', parts: [{ label:'金酒', target:40, tol:3 }, { label:'接骨木花糖浆', target:20, tol:3 }, { label:'苏打水', target:40, tol:4 }], reward: 28, aff: { fiman: 8 } }
  ];

  function showRecipeSelect() {
    const s = NF.state();
    const aff = (s?.affection?.fiman) || 0;
    const first = isFirstPlay('tavern');
    let html = '<div style="margin-bottom:14px;font-size:11.5px;color:var(--text-d);letter-spacing:.06em;line-height:1.7;">' +
      '菲曼把酒单推过来。<br><span style="color:' + (first ? 'var(--gold-b)' : '#8a8070') + ';">' +
      (first ? '（今日首杯，有丰厚奖励）' : '（今日已领过奖励，练手无奖励）') + '</span></div>';
    html += '<div style="display:flex;flex-direction:column;gap:10px;">';
    POUR_RECIPES.forEach((r, i) => {
      const need = i * 8;
      const unlocked = aff >= need;
      html += '<div class="gift-item" data-key="' + r.key + '" ' + (unlocked?'':'style="opacity:.5;cursor:not-allowed;"') + '>' +
        '<div class="gift-ico">♨</div>' +
        '<div class="gift-info"><div class="gift-name">' + esc(r.name) + ' · ' + esc(r.en) + '</div>' +
        '<div class="gift-meta">' + esc(r.desc) + '</div>' +
        (unlocked ? '' : '<div class="gift-meta" style="color:var(--gold-d);">好感 ' + need + ' 解锁</div>') +
        '</div></div>';
    });
    html += '</div>';
    NF.openModal({
      title:'日 不 落 酒 馆 · 酒 单', body: html,
      footHTML:'<button class="btn ghost" id="rsCancel">算了</button>',
      onMount: (w) => {
        w.querySelector('#rsCancel').onclick = () => { NF.Sfx.click(); NF.closeModal(w); };
        w.querySelectorAll('.gift-item').forEach((el, i) => {
          const r = POUR_RECIPES[i];
          if (aff < i * 8) return;
          el.onclick = () => { NF.Sfx.click(); NF.closeModal(w); openPourGame(r); };
        });
      }
    });
  }

  function openPourGame(recipe) {
    const first = isFirstPlay('tavern');
    markPlayed('tavern');
    NF.openModal({
      title:'日 不 落 酒 馆 · 调 酒',
      body:
        '<div class="mini-title">◈ ' + esc(recipe.name) + ' ◈</div>' +
        '<div class="mini-sub">按住注入，到标记线松手。</div>' +
        '<div class="mini-hud"><div class="mini-hud-item">步骤<b id="pourRound">1 / ' + recipe.parts.length + '</b></div><div class="mini-hud-item">目标<b id="pourTarget">' + recipe.parts[0].target + 'ml</b></div><div class="mini-hud-item">误差<b id="pourErr">--</b></div></div>' +
        '<div class="pour-stage"><div class="glass"><div class="glass-marker m1" id="pourMarker" style="bottom:' + recipe.parts[0].target + '%;"><span class="mlabel" id="pourMarkerLabel">' + recipe.parts[0].target + 'ml</span></div><div class="glass-liquid" id="pourLiquid"></div></div></div>' +
        '<button class="pour-btn" id="pourBtn">按 住 倒 酒</button><div class="pour-feedback" id="pourFeedback"></div>',
      footHTML:'<button class="btn ghost" id="pourClose">关 闭</button>',
      onMount: (w) => {
        const liquid = w.querySelector('#pourLiquid'), btn = w.querySelector('#pourBtn'), fb = w.querySelector('#pourFeedback');
        const roundEl = w.querySelector('#pourRound'), errEl = w.querySelector('#pourErr'), targetEl = w.querySelector('#pourTarget');
        const marker = w.querySelector('#pourMarker'), markerLabel = w.querySelector('#pourMarkerLabel');
        let step = 0, level = 0, pouring = false, timer = null;

        function setLevel(v) { level = clamp(v, 0, 100); if (liquid) liquid.style.height = level + '%'; }
        function updateMarker() {
          const p = recipe.parts[step];
          if (marker) marker.style.bottom = p.target + '%';
          if (markerLabel) markerLabel.textContent = p.target + 'ml';
          if (targetEl) targetEl.textContent = p.target + 'ml';
          if (roundEl) roundEl.textContent = (step + 1) + ' / ' + recipe.parts.length;
        }
        function start() {
          if (pouring) return; pouring = true; btn.classList.add('pouring');
          timer = setInterval(() => { setLevel(level + 0.8); if (level >= 100) stop(); }, 30);
        }
        function stop() {
          if (!pouring) return; pouring = false; btn.classList.remove('pouring');
          clearInterval(timer); timer = null;
          const p = recipe.parts[step], err = Math.abs(level - p.target);
          if (errEl) errEl.textContent = err.toFixed(1) + 'ml';
          if (err <= p.tol) {
            NF.Sfx.success();
            if (step < recipe.parts.length - 1) { step++; setLevel(0); updateMarker(); if (fb) fb.textContent = '◈ ' + p.label + ' 完成。'; }
            else {
              if (fb) fb.textContent = '◈ 完美！';
              setTimeout(() => {
                const got = giveReward(recipe.reward, recipe.aff, first);
                NF.closeModal(w);
                showWinModal({
                  title:'调 酒 · 完 成', icon:'✦', head:'一杯 ' + recipe.name,
                  desc: got ? '菲曼尝了一口：「……可以。」<br><br><b style="color:var(--gold);">银镑 +' + got.silver + '</b>　·　菲曼好感 +' + got.aff.fiman : '菲曼尝了一口：「不错，不过这杯不收钱。」',
                  onClose: () => { if (typeof NF.renderMap === 'function') NF.renderMap(); }
                });
              }, 400);
            }
          } else {
            NF.Sfx.fail();
            if (fb) fb.textContent = '✕ 误差过大，重来。';
            setTimeout(() => { setLevel(0); if (errEl) errEl.textContent = '--'; if (fb) fb.textContent = ''; }, 1400);
          }
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
     伊林堡棋局厅（专属符号 + 还原黑白格底纹）
     ═══════════════════════════════════════════════════════════ */
  const CHESS_VARIANTS = {
    knight: { title:'棋局 · 骑士', piece:'♘', start:{r:0,c:0}, goal:{r:3,c:3}, death:{}, maxSteps:3, reward: 18, aff: { tavana: 3 },
      moves: function(from, to) { const dr = Math.abs(from.r - to.r), dc = Math.abs(from.c - to.c); return (dr === 2 && dc === 1) || (dr === 1 && dc === 2); },
      sub:'骑士走「日」字。3步内抵达 D4。'
    },
    bishop: { title:'棋局 · 主教', piece:'♗', start:{r:0,c:0}, goal:{r:3,c:3}, death:{ '1-2': true, '2-1': true }, maxSteps:4, reward: 26, aff: { tavana: 4 },
      moves: function(from, to) { const dr = Math.abs(from.r - to.r), dc = Math.abs(from.c - to.c); return dr === dc && dr > 0; },
      sub:'主教走斜线。4步内抵达 D4，小心死格。'
    },
    queen: { title:'棋局 · 皇后', piece:'♕', start:{r:0,c:0}, goal:{r:3,c:3}, death:{ '0-2': true, '1-2': true, '2-1': true, '2-2': true, '3-1': true }, maxSteps:5, reward: 36, aff: { tavana: 6 },
      moves: function(from, to) { const dr = Math.abs(from.r - to.r), dc = Math.abs(from.c - to.c); return (dr === 0 && dc > 0) || (dc === 0 && dr > 0) || (dr === dc && dr > 0); },
      sub:'皇后走横、竖、斜。5步内抵达 D4。'
    }
  };

  function showChessSelect() {
    const s = NF.state(), aff = (s?.affection?.tavana) || 0;
    const first = isFirstPlay('chess_hall');
    let html = '<div style="margin-bottom:14px;font-size:11.5px;color:var(--text-d);letter-spacing:.06em;line-height:1.7;">' +
      '<span style="color:' + (first ? 'var(--gold-b)' : '#8a8070') + ';">' + (first ? '（今日首局，有丰厚奖励）' : '（今日已领过奖励，练手无奖励）') + '</span></div>' +
      '<div style="display:flex;flex-direction:column;gap:10px;">';
    const keys = ['knight','bishop','queen'];
    keys.forEach((k, i) => {
      const v = CHESS_VARIANTS[k], unlocked = aff >= i * 10;
      html += '<div class="gift-item" data-key="' + k + '" ' + (unlocked?'':'style="opacity:.5;cursor:not-allowed;"') + '>' +
        '<div class="gift-ico" style="font-family:var(--f-sym);">' + v.piece + '</div>' +
        '<div class="gift-info"><div class="gift-name">' + esc(v.title.replace('棋局 · ','')) + '</div>' +
        '<div class="gift-meta">' + esc(v.sub) + '</div></div></div>';
    });
    html += '</div>';
    NF.openModal({
      title:'伊 林 堡 · 棋 局 厅', body: html,
      footHTML:'<button class="btn ghost" id="csCancel">离开</button>',
      onMount: (w) => {
        w.querySelector('#csCancel').onclick = () => { NF.Sfx.click(); NF.closeModal(w); };
        w.querySelectorAll('.gift-item').forEach((el, i) => {
          if (aff < i * 10) return;
          el.onclick = () => { NF.Sfx.click(); NF.closeModal(w); openChessGame(keys[i]); };
        });
      }
    });
  }

  function openChessGame(variantKey) {
    const v = CHESS_VARIANTS[variantKey];
    const first = isFirstPlay('chess_hall');
    markPlayed('chess_hall');
    NF.openModal({
      title: v.title,
      body:
        '<div class="mini-title">◈ ' + esc(v.title.replace('棋局 · ','')) + ' ◈</div>' +
        '<div class="mini-sub">' + esc(v.sub) + '</div>' +
        '<div class="mini-hud"><div class="mini-hud-item">步数<b id="chMoves">0 / ' + v.maxSteps + '</b></div><div class="mini-hud-item">理智<b id="chSan">100</b></div></div>' +
        '<div class="chess-board" id="chessBoard"></div>' +
        '<div style="text-align:center;margin-top:14px;font-size:11px;color:var(--text-d);letter-spacing:.1em;">◆ 死格 ◆ 目标 ' + v.piece + ' 你的位置</div>',
      footHTML:'<button class="btn ghost" id="chClose">关 闭</button>',
      onMount: (w) => {
        const board = w.querySelector('#chessBoard'), movesEl = w.querySelector('#chMoves'), sanEl = w.querySelector('#chSan');
        let pos = { r: v.start.r, c: v.start.c }, moves = 0, san = 100, playing = true;

        function render() {
          board.innerHTML = '';
          for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
            const cell = document.createElement('div');
            cell.className = 'chess-cell ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
            const isDeath = v.death && v.death[r + '-' + c], isGoal = (r === v.goal.r && c === v.goal.c), isPlayer = (r === pos.r && c === pos.c);
            if (isDeath) cell.classList.add('death');
            if (isGoal) cell.classList.add('goal');
            if (isPlayer) {
              cell.classList.add('player');
              cell.innerHTML = '<span style="font-family:var(--f-sym);font-size:22px;color:var(--gold-b);text-shadow:0 0 10px rgba(201,169,97,.9);">' + v.piece + '</span>';
            }
            if (playing && !isPlayer) {
              const canMove = v.moves(pos, {r, c});
              if (canMove && !isDeath) { cell.classList.add('valid'); cell.onclick = () => moveTo(r, c); }
              else if (canMove && isDeath) { cell.onclick = () => hitDeath(r, c); }
            }
            board.appendChild(cell);
          }
        }
        function moveTo(r, c) {
          if (!playing) return; NF.Sfx.click(); moves++; pos = { r, c };
          if (movesEl) movesEl.textContent = moves + ' / ' + v.maxSteps;
          render();
          if (r === v.goal.r && c === v.goal.c) { playing = false; setTimeout(() => win(w), 300); return; }
          if (moves >= v.maxSteps) { playing = false; setTimeout(() => fail(w), 400); }
        }
        function hitDeath(r, c) {
          if (!playing) return; NF.Sfx.fail();
          if (NF.settings?.().shake && navigator.vibrate) try { navigator.vibrate(150); } catch(e){}
          san -= 25; if (sanEl) sanEl.textContent = Math.max(0, san);
          moves++; pos = { r, c }; if (movesEl) movesEl.textContent = moves + ' / ' + v.maxSteps;
          render();
          if (san <= 0) { playing = false; setTimeout(() => fail(w), 400); }
          else if (moves >= v.maxSteps && !(r === v.goal.r && c === v.goal.c)) { playing = false; setTimeout(() => fail(w), 400); }
        }
        function win(w) {
          const got = giveReward(v.reward, v.aff, first);
          NF.closeModal(w);
          showWinModal({
            title:'棋 局 · 完 成', icon:'✦', head:'升变 · ' + v.piece,
            desc: '「A pawn that reaches the end... becomes something else.」<br><br>' +
              (got ? '<b style="color:var(--gold);">银镑 +' + got.silver + '</b>　·　塔瓦娜好感 +' + got.aff.tavana : '你走完了这一步。不过今日不再有奖励。'),
            onClose: () => { if (typeof NF.renderMap === 'function') NF.renderMap(); }
          });
        }
        function fail(w) {
          NF.Sfx.fail(); NF.closeModal(w);
          showWinModal({
            title:'棋 局 · 失 败', icon:'☠', head:'棋 子 被 困 住', sub:'Checkmate',
            desc:'你没能走到升变格。<br>下次，先看清哪些格子还活着。',
            onClose: () => { if (typeof NF.renderMap === 'function') NF.renderMap(); }
          });
        }
        render();
        w.querySelector('#chClose').onclick = () => { NF.Sfx.click(); NF.closeModal(w); };
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     通用测验模块（修复报错 + 可用于学徒/图书/礼拜堂）
     ═══════════════════════════════════════════════════════════ */
  function openQuiz(config) {
    const s = NF.state();
    let qIdx = 0, correct = 0, locked = false;
    let qHTML = '';

    function renderQuestion() {
      const q = config.questions[qIdx];
      if (!q) return; // 防越界
      qHTML = '<div style="font-size:11.5px;color:var(--text-d);letter-spacing:.14em;margin-bottom:12px;text-align:center;">' +
        '◈ ' + (qIdx + 1) + ' / ' + config.questions.length + ' ◈</div>' +
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
          if (locked) return; // ★ 修复连点报错
          locked = true;
          const opt = parseInt(btn.dataset.opt);
          const q = config.questions[qIdx];
          if (opt === q.answer) {
            correct++; NF.Sfx.success();
            btn.style.background = 'rgba(120,180,120,.15)'; btn.style.borderColor = 'rgba(120,180,120,.6)';
          } else {
            NF.Sfx.fail();
            btn.style.background = 'rgba(160,60,80,.1)'; btn.style.borderColor = 'rgba(160,60,80,.6)';
          }
          setTimeout(() => {
            locked = false;
            qIdx++;
            if (qIdx >= config.questions.length) finish();
            else { renderQuestion(); update(); }
          }, 400);
        };
      });
    }

    function finish() {
      let reward_ = 0, affGain = 0;
      if (correct === config.questions.length) reward_ = config.rewardMax;
      else if (correct >= config.questions.length - 1) reward_ = Math.floor(config.rewardMax * 0.66);
      else if (correct >= config.questions.length / 2) reward_ = Math.floor(config.rewardMax * 0.33);

      if (reward_) {
        const got = giveReward(reward_, config.aff, config.first);
        if (got) { reward_ = got.silver; affGain = config.aff ? got.aff : null; } else { reward_ = 0; }
      }

      NF.closeAllModals();
      showWinModal({
        title: config.title + ' · 完 成',
        icon: correct >= 4 ? '✦' : '◇',
        head: correct + ' / ' + config.questions.length + ' 题 正确',
        desc:'（测验结束）<br><br>' + (reward_ ? '<b style="color:var(--gold);">银镑 +' + reward_ + '</b>' : '今日已领过奖励，这次算是温习。'),
        onClose: () => { if (typeof NF.renderMap === 'function') NF.renderMap(); }
      });
    }

    renderQuestion();
    NF.openModal({
      title: config.title,
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
      if (id === 'pour') { showRecipeSelect(); return; }
      if (id === 'chess') { showChessSelect(); return; }
      if (id === 'quiz') {
        openQuiz({
          title: '学 徒 测 验',
          questions: [
            { q:'王翼国度的首都是哪座城市？', opts:['伊林堡','落日之都','映月镇','日往城'], answer:0 },
            { q:'梦域里死去、肉身存留的人被称作什么？', opts:['沉眠者','未归之人','醒者','容器'], answer:1 },
            { q:'圣梦目管理院的现任院长是谁？', opts:['莫维奥娅·沃特森','艾瑞莉·简','塔瓦娜·卡伊','赛薇拉'], answer:2 },
            { q:'摩耳甫斯原本是神族的什么职位？', opts:['审判官','梦神使','守夜者','司书'], answer:1 },
            { q:'落日之都边界外被管理院封了路的那些地方，被称作什么？', opts:['遗落梦域','封印战场','银杏林','日往城'], answer:0 }
          ],
          rewardMax: 45, aff: { tavana: 3 }, first: isFirstPlay('quiz'), titleKey: 'quiz'
        });
        markPlayed('quiz'); return;
      }
      if (id === 'chapel_quiz') {
        openQuiz({
          title: '礼 拜 堂 · 沉 思',
          questions: [
            { q:'醒派的信条是什么？', opts:['梦魇是恶，醒者是神赐的盾牌','摩耳甫斯是神的另一面','沉眠者是被神接走的人','工具不需要说话'], answer:0 },
            { q:'祭坛上的雕像刻着什么字？', opts:['「神爱世人」','「祂不睡，所以你看得见」','「梦醒终有时」','「以眼还眼」'], answer:1 },
            { q:'醒派对待梦派的态度是？', opts:['和平共处','共同祈祷','视为异端追杀','互不干涉'], answer:2 }
          ],
          rewardMax: 20, aff: { tavana: 1 }, first: isFirstPlay('chapel'), titleKey: 'chapel'
        });
        markPlayed('chapel'); return;
      }
      if (id === 'library_quiz') {
        openQuiz({
          title: '图 书 馆 · 棋 谱 残 局',
          questions: [
            { q:'旧书上的残局提示：“兵”升变后能变成什么？', opts:['骑士','主教','皇后','以上皆可'], answer:3 },
            { q:'《意大利开局》最早记录于哪个世纪？', opts:['14世纪','16世纪','18世纪','20世纪'], answer:1 },
            { q:'布拉姆说，哪本书值得读两遍？', opts:['写输的书','写赢的书','写和局的书','没有字的书'], answer:0 }
          ],
          rewardMax: 25, aff: { tavana: 2 }, first: isFirstPlay('library'), titleKey: 'library'
        });
        markPlayed('library'); return;
      }
      if (id === 'evidence' || id === 'puzzle' || id === 'dream') {
        origOpen(id); return; // 保持原样（它们本来就没有限制逻辑，我在 origOpen 里没写限制）
      }
      if (id.startsWith('pour_')) {
        const r = POUR_RECIPES.find(x => x.key === id);
        if (r) openPourGame(r); else origOpen(id); return;
      }
      if (id.startsWith('chess_') && CHESS_VARIANTS[id]) {
        openChessGame(id); return;
      }
      origOpen(id);
    }
  };

  console.log('%c[minigames-extra] 已修复答题报错 · 无限玩首玩奖励 · 棋局专属符号 已加载', 'color:#9dd0a0;font-size:11px;');
})();
