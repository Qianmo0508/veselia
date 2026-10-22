/* ============================================================
   入魇 · 扩展模块 (extras.js)
   依赖 index.html 暴露的 window.NF
   ============================================================ */
(function () {
  'use strict';

  if (!window.NF) {
    console.error('[extras] 未找到 window.NF。请确认 index.html 末尾已添加 window.NF = {...}');
    return;
  }

  const { Game, SCENES, CHARS, state, settings, saveGame,
          openModal, closeModal, toast, showScreen, Sfx,
          saveSettings, applySettings, renderMap, unlock } = window.NF;

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ==================== 注入新样式 ==================== */
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    /* 升级全屏特效 */
    .levelup-overlay{position:fixed;inset:0;z-index:3000;display:flex;align-items:center;justify-content:center;
      pointer-events:none;opacity:0;transition:opacity .5s;background:radial-gradient(circle at 50% 50%,rgba(201,169,97,.22),rgba(139,47,79,.10) 45%,transparent 75%);}
    .levelup-overlay.show{opacity:1;}
    .levelup-card{text-align:center;transform:scale(.7);transition:transform .8s cubic-bezier(.16,1.3,.3,1);}
    .levelup-overlay.show .levelup-card{transform:scale(1);}
    .levelup-card .lv-label{font-family:var(--f-deco);font-size:11px;letter-spacing:.5em;color:var(--gold-d);margin-bottom:18px;text-indent:.5em;}
    .levelup-card .lv-name{font-family:var(--f-deco);font-size:clamp(30px,9vw,52px);font-weight:900;letter-spacing:.14em;color:var(--gold-b);text-shadow:0 0 36px rgba(201,169,97,.85),0 0 90px rgba(139,47,79,.5);margin-bottom:10px;}
    .levelup-card .lv-en{font-family:var(--f-en);font-style:italic;font-size:16px;color:var(--gold-d);letter-spacing:.1em;margin-bottom:16px;}
    .levelup-card .lv-num{font-family:var(--f-deco);font-size:12px;letter-spacing:.3em;color:var(--gold-b);}
    /* 工坊 */
    .ws-type-bar{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px;}
    .ws-type-btn{padding:9px 16px;border:1px solid var(--line-s);background:transparent;color:var(--text-d);font-family:var(--f-cn);font-size:12px;letter-spacing:.14em;cursor:pointer;transition:all .25s;}
    .ws-type-btn.on{background:rgba(201,169,97,.18);color:var(--gold-b);border-color:var(--gold);}
    .ws-type-btn:hover{color:var(--gold);border-color:var(--gold);}
    .ws-field{margin-bottom:18px;}
    .ws-field label{display:block;font-size:11.5px;color:var(--gold-d);letter-spacing:.22em;margin-bottom:8px;}
    .ws-field label b{color:var(--gold-b);font-weight:400;}
    .ws-hint{font-size:11px;color:#6d6478;margin-top:6px;line-height:1.7;}
    .ws-lines{display:flex;flex-direction:column;gap:12px;margin-bottom:12px;}
    .ws-line-card{border:1px solid var(--line);background:rgba(0,0,0,.2);padding:14px;}
    .ws-line-head{display:flex;align-items:center;gap:8px;margin-bottom:10px;}
    .ws-line-num{font-family:var(--f-deco);font-size:11px;color:var(--gold);letter-spacing:.12em;flex-shrink:0;}
    .ws-line-type{flex:1;padding:6px 10px;background:rgba(201,169,97,.08);border:1px solid var(--line-s);color:var(--gold-b);font-family:var(--f-cn);font-size:11.5px;letter-spacing:.06em;outline:none;cursor:pointer;}
    .ws-line-del{width:30px;height:30px;border:1px solid rgba(160,60,80,.5);background:none;color:#c07a92;cursor:pointer;font-size:14px;flex-shrink:0;transition:all .25s;}
    .ws-line-del:hover{background:rgba(160,60,80,.15);border-color:#d08a9c;}
    .ws-line-body{display:flex;flex-direction:column;gap:8px;}
    .ws-line-body .inp{font-size:13px;}
    .ws-add-line{width:100%;padding:12px;background:transparent;border:1px dashed rgba(201,169,97,.4);color:var(--gold);font-family:var(--f-cn);font-size:12.5px;letter-spacing:.22em;cursor:pointer;transition:all .25s;margin-bottom:20px;}
    .ws-add-line:hover{background:rgba(201,169,97,.1);border-style:solid;border-color:var(--gold);color:var(--gold-b);}
    .ws-preview{border:1px solid var(--line);background:rgba(0,0,0,.25);padding:16px;margin-bottom:20px;}
    .ws-preview-title{font-family:var(--f-deco);font-size:11px;letter-spacing:.24em;color:var(--gold-d);margin-bottom:12px;}
    .ws-preview-line{margin-bottom:14px;padding-bottom:14px;border-bottom:1px dashed rgba(201,169,97,.15);}
    .ws-preview-line:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0;}
    .ws-preview-line .pp-speaker{font-family:var(--f-deco);font-size:10.5px;letter-spacing:.2em;color:var(--gold-b);margin-bottom:5px;}
    .ws-preview-line .pp-en{font-family:var(--f-en);font-style:italic;font-size:14px;color:var(--gold-b);line-height:1.6;margin-bottom:4px;}
    .ws-preview-line .pp-cn{font-size:13px;line-height:1.85;color:var(--text);padding-left:10px;border-left:2px solid var(--line);}
    .ws-preview-line.narr .pp-cn{color:#a89e8e;font-style:italic;}
    .ws-pack-list{display:flex;flex-direction:column;gap:10px;}
    .ws-pack{border:1px solid var(--line);background:rgba(201,169,97,.02);padding:14px 16px;}
    .ws-pack-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:8px;}
    .ws-pack-title{font-size:13.5px;color:var(--gold-b);letter-spacing:.1em;}
    .ws-pack-meta{font-size:11px;color:var(--text-d);letter-spacing:.06em;line-height:1.7;}
    .ws-pack-actions{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;}
    .ws-mini{background:none;border:1px solid var(--line-s);color:var(--text-d);font-family:var(--f-cn);font-size:11px;letter-spacing:.1em;padding:7px 12px;cursor:pointer;transition:all .25s;}
    .ws-mini:hover{border-color:var(--gold);color:var(--gold-b);}
    .ws-mini.danger{border-color:rgba(160,60,80,.5);color:#c07a92;}
    .ws-mini.danger:hover{background:rgba(160,60,80,.15);border-color:#d08a9c;}
    .ws-mini.primary{background:rgba(201,169,97,.18);border-color:var(--gold);color:var(--gold-b);}
    .ws-intro{font-size:12.5px;line-height:1.95;color:#9d9384;margin-bottom:20px;padding:14px 16px;background:rgba(201,169,97,.04);border-left:2px solid rgba(201,169,97,.35);}
    .ws-intro b{color:var(--gold-b);font-weight:400;}
  `;
  document.head.appendChild(styleEl);

  /* ==================== 好感度等级表 ==================== */
  const LEVELS = [
    { min: 0,   max: 4,   name: '陌路人',       en: 'Stranger' },
    { min: 5,   max: 14,  name: '点头之交',     en: 'Acquaintance' },
    { min: 15,  max: 29,  name: '酒友',         en: 'Drinking Buddy' },
    { min: 30,  max: 44,  name: '可说话的人',   en: 'Someone to Talk To' },
    { min: 45,  max: 59,  name: '朋友',         en: 'Friend' },
    { min: 60,  max: 74,  name: '在意的人',     en: 'Someone I Care About' },
    { min: 75,  max: 84,  name: '心跳',         en: 'Heartbeat' },
    { min: 85,  max: 94,  name: '恋人未满',     en: 'Almost Lovers' },
    { min: 95,  max: 99,  name: '灵魂共鸣',     en: 'Soul Resonance' },
    { min: 100, max: 100, name: '灵魂烙印',     en: 'Soul Imprint' }
  ];
  function getLevel(v) {
    for (const l of LEVELS) if (v >= l.min && v <= l.max) return l;
    return LEVELS[LEVELS.length - 1];
  }

  /* ==================== 升级全屏特效 ==================== */
  function showLevelUp(newLv, curVal, charName) {
    const el = document.createElement('div');
    el.className = 'levelup-overlay';
    el.innerHTML =
      '<div class="levelup-card">' +
        '<div class="lv-label">—— 亲 密 度 提 升 ——</div>' +
        '<div class="lv-name">' + esc(newLv.name) + '</div>' +
        '<div class="lv-en">' + esc(newLv.en) + '</div>' +
        '<div class="lv-num">' + curVal + ' / 100 · ' + esc(charName || '') + '</div>' +
      '</div>';
    document.body.appendChild(el);
    try { Sfx.unlock(); } catch (e) {}
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 800);
    }, 2800);
  }
  window.__showLevelUp = showLevelUp;
  window.__getLevel = getLevel;
  window.__LEVELS = LEVELS;

  /* ==================== 性格分支：注入 byPers ==================== */
  // 给 prologue_1 的几句内心独白加性格分支
  function injectPersonality() {
    if (SCENES.prologue_1 && SCENES.prologue_1.lines) {
      // 第 4 句：记者证
      if (SCENES.prologue_1.lines[3]) {
        SCENES.prologue_1.lines[3].byPers = {
          '冷静': '（王翼的记者证在我胸前的口袋里，纸边已经磨得发毛。）',
          '共情': '（王翼的记者证贴着心口。纸边磨毛了，像被谁反复摸过。）',
          '直率': '（记者证塞在外套里，纸边磨毛了。我还没在这破地方站稳。）',
          '谨慎': '（我把记者证塞进最贴身的口袋。纸边磨毛了，但没人能看见它。）'
        };
      }
      // 第 5 句：这就是维塞利亚
      if (SCENES.prologue_1.lines[4]) {
        SCENES.prologue_1.lines[4].byPers = {
          '冷静': '（这就是维塞利亚大陆的最西端么。）',
          '共情': '（这里的空气都是倦的。像所有人都在做同一场醒不来的梦。）',
          '直率': '（行了。就是这儿了。）',
          '谨慎': '（先别急着下判断。走一步看一步。）'
        };
      }
      // 第 7 句：他们怕的不是贼
      if (SCENES.prologue_1.lines[6]) {
        SCENES.prologue_1.lines[6].byPers = {
          '冷静': '（……他们怕的不是贼。）',
          '共情': '（他们眼睛里有一种被压着的东西。不是恐惧，是认命。）',
          '直率': '（连句道歉都没有。这地方的人心比天冷。）',
          '谨慎': '（……他们怕的不是贼。是别的东西。）'
        };
      }
    }
    if (SCENES.prologue_8 && SCENES.prologue_8.lines) {
      if (SCENES.prologue_8.lines[2]) {
        SCENES.prologue_8.lines[2].byPers = {
          '冷静': '（所有人都在锁门。他们怕的不是贼。）',
          '共情': '（一家一户的锁门声连成一片，像某种无声的默契。）',
          '直率': '（所有人都在锁门。白天装得跟没事人一样。）',
          '谨慎': '（所有人都在锁门。我得记下来——他们怕的不是贼。）'
        };
      }
    }
  }

  /* ==================== 覆盖 renderLine（性格分支渲染） ==================== */
  const _origRenderLine = renderLine;
  window.renderLine = function (idx) {
    const scene = SCENES[state.currentScene];
    if (scene && scene.lines && scene.lines[idx]) {
      const line = scene.lines[idx];
      if (line.byPers) {
        const pers = (state.player && state.player.personality) || '冷静';
        const target = line.byPers[pers];
        if (target) {
          const orig = line.cn;
          line.cn = target;
          try { _origRenderLine(idx); }
          finally { line.cn = orig; }
          return;
        }
      }
    }
    _origRenderLine(idx);
  };

  /* ==================== 深谈解锁档案 ==================== */
  const DEEP_ARCHIVE = {
    fiman: {
      name: '菲曼的奶奶',
      title: '日不落酒馆 · 深谈所得',
      desc: '酒馆的名字是她奶奶起的。「能看见日落的人，是幸福的。」\n她每天下午五点半开门，赶在那之前把吧台擦得发亮。\n她说这不是为了客人，是为了奶奶。',
      tags: ['菲曼', '深谈', '酒馆']
    },
    kash: {
      name: '墨镜后面的秘密',
      title: '卡什 · 深谈所得',
      desc: '墨镜不是为了造型。是视力。\n半米之外，他看谁都是一团糊。\n他说这话的时候摘下墨镜，眼睛很漂亮，焦距却有点散。\n「别告诉别人，好吗？我还要维持形象呢。」',
      tags: ['卡什', '深谈', '秘密']
    },
    tavana: {
      name: '姐姐的那句老话',
      title: '塔瓦娜 · 深谈所得',
      desc: '「梦魇不是敌人。敌人是忘记早晨是什么样子。」\n这句话是塔尔莎说的。\n塔瓦娜说，她每天都努力记着。',
      tags: ['塔瓦娜', '深谈', '塔尔莎']
    },
    movioa: {
      name: '哥哥不是怪物',
      title: '莫维奥娅 · 深谈所得',
      desc: '「我哥哥不是怪物。他是个傻子。这有区别。」\n她说这话的时候没看你。\n那之后她好几天没出现在管理院。',
      tags: ['莫维奥娅', '深谈', '缇斯']
    },
    lidia: {
      name: '停下来会害怕',
      title: '莉迪亚 · 深谈所得',
      desc: '「如果我不说话，我就会开始想事情。而在这里想事情很可怕。」\n她说完这句话，安静了整整三秒。\n然后又开始问王翼的棋子。',
      tags: ['莉迪亚', '深谈']
    },
    elsia: {
      name: '背负着走',
      title: '艾尔丝娅 · 深谈所得',
      desc: '「人们以为做杀手就意味着不再有感觉。不是的。那意味着你学会背负着它走。」',
      tags: ['艾尔丝娅', '深谈']
    },
    reifina: {
      name: '记住每一个名字',
      title: '瑞菲纳 · 深谈所得',
      desc: '「我在梦域里失去了三支队伍。我记得每一个名字。\n这就是为什么我不怎么笑。」',
      tags: ['瑞菲纳', '深谈']
    },
    cassi: {
      name: '她从未失去能救的人',
      title: '卡修斯尔 · 深谈所得',
      desc: '「我跟着她，是因为她从没失去过她能救下的人。这很少见。」',
      tags: ['卡修斯尔', '深谈']
    }
  };

  function unlockDeepArchive(id) {
    const data = DEEP_ARCHIVE[id];
    if (!data) return;
    // 已经是重复触发则跳过
    if (Game.codex && Game.codex.character && Game.codex.character[data.name]) return;
    if (!Game.codex) Game.codex = { character: {}, place: {}, faction: {}, intel: {}, ending: {}, task: {}, dungeon: {} };
    if (!Game.codex.character) Game.codex.character = {};
    Game.codex.character[data.name] = {
      name: data.name,
      title: data.title,
      desc: data.desc,
      tags: data.tags
    };
    try { unlock('character', data.name, '深谈解锁'); } catch (e) {}
  }

  /* ==================== 覆盖 startCharacterDialogue（深谈 + 升级检测） ==================== */
  const _origStartCharDlg = startCharacterDialogue;
  window.startCharacterDialogue = function (id, mode) {
    const c = CHARS[id];
    if (!c) return;
    const data = (typeof CHAR_DIALOGUES !== 'undefined') ? CHAR_DIALOGUES[id] : null;
    if (!data || !data[mode]) {
      toast('该角色暂无此类型对话', 'warn');
      return;
    }
    // 深谈：先解锁档案
    if (mode === 'deep') {
      unlockDeepArchive(id);
    }
    const lines = data[mode];
    const oldAff = (state.affection && state.affection[id]) || 0;

    showScreen('game');
    if ($('#sceneBg')) $('#sceneBg').className = 'scene-bg bg-tavern';
    if ($('#locLabel')) $('#locLabel').textContent = c.name + ' · ' + (mode === 'deep' ? '深谈' : '闲聊');
    if ($('#topLoc')) $('#topLoc').textContent = c.name;
    if ($('#dialogInner')) $('#dialogInner').innerHTML = '';
    if ($('#choices')) $('#choices').classList.remove('active');
    if ($('#contHint')) $('#contHint').style.display = 'none';

    const tmpId = '__tmp_char_' + id + '_' + mode + '_' + Date.now();
    SCENES[tmpId] = {
      bg: 'tavern',
      loc: c.name + ' · ' + (mode === 'deep' ? '深谈' : '闲聊'),
      lines: lines.map(l => ({
        t: l.who === 'me' ? 'me' : 'd',
        who: l.who, en: l.en, cn: l.cn
      })),
      onEnd: () => {
        const gain = mode === 'deep' ? 10 : 5;
        if (!state.affection) state.affection = {};
        state.affection[id] = (state.affection[id] || 0) + gain;
        // 升级检测
        const newAff = state.affection[id];
        const oldLv = getLevel(oldAff);
        const newLv = getLevel(newAff);
        if (newLv.name !== oldLv.name && window.__showLevelUp) {
          setTimeout(() => window.__showLevelUp(newLv, newAff, c.name), 200);
        }
        try { Sfx.unlock(); } catch (e) {}
        toast('◈ 与 ' + c.name + ' 的亲密 +' + gain, 'ok');
        if (mode === 'deep') {
          setTimeout(() => toast('◈ 档案已解锁：' + (DEEP_ARCHIVE[id]?.name || ''), 'ok'), 600);
        }
        saveGame();
        setTimeout(() => showScreen('map'), 900);
      }
    };
    playScene(tmpId);
  };

  /* ==================== 覆盖 openCharacterMenu（显示等级） ==================== */
  const _origOpenCharMenu = openCharacterMenu;
  window.openCharacterMenu = function (id) {
    const c = CHARS[id];
    if (!c) return;
    const aff = (state.affection && state.affection[id]) || 0;
    const lv = getLevel(aff);
    const nextLv = LEVELS.find(l => l.min > aff);
    const needStr = nextLv ? ('距「' + nextLv.name + '」还差 ' + (nextLv.min - aff)) : '已达最高等级';
    const deepUnlocked = DEEP_ARCHIVE[id] && Game.codex && Game.codex.character && Game.codex.character[DEEP_ARCHIVE[id].name];

    openModal({
      title: c.name,
      body:
        '<div style="text-align:center;margin-bottom:18px;">' +
          '<div class="char-avatar" style="width:72px;height:72px;font-size:34px;margin:0 auto 12px;border-radius:50%;">' + c.sym + '</div>' +
          '<div class="char-en" style="font-size:14px;">' + esc(c.en) + '</div>' +
          '<div class="char-title" style="margin-top:4px;">' + esc(c.title || '') + '</div>' +
          '<div style="margin-top:14px;font-family:var(--f-deco);font-size:15px;letter-spacing:.16em;color:var(--gold-b);">' + esc(lv.name) + '</div>' +
          '<div style="font-size:11px;color:var(--gold-d);letter-spacing:.1em;margin-top:3px;">' + esc(lv.en) + ' · ' + aff + ' / 100</div>' +
          '<div style="margin:10px auto 0;max-width:220px;height:6px;background:rgba(201,169,97,.15);overflow:hidden;">' +
            '<div style="height:100%;width:' + clamp(aff,0,100) + '%;background:linear-gradient(90deg,var(--gold-d),var(--gold));transition:width .5s;"></div>' +
          '</div>' +
          '<div style="font-size:11px;color:var(--text-d);margin-top:8px;letter-spacing:.05em;">' + esc(needStr) + '</div>' +
        '</div>' +
        '<p style="font-size:12.5px;line-height:1.95;color:var(--text);padding-top:14px;border-top:1px solid var(--line);">' + esc(c.desc) + '</p>' +
        (deepUnlocked ? '<div style="margin-top:14px;padding:12px 14px;background:rgba(120,180,120,.06);border-left:2px solid rgba(120,180,120,.6);font-size:11.5px;color:#9dd0a0;letter-spacing:.06em;">◈ 深谈档案已解锁：' + esc(DEEP_ARCHIVE[id].name) + '</div>' : ''),
      footHTML:
        '<button class="btn ghost" id="cmChat2">闲 聊</button>' +
        '<button class="btn" id="cmDeep2">深 谈</button>' +
        '<button class="btn" id="cmGift2">送 礼</button>',
      onMount: (wrap) => {
        wrap.querySelector('#cmChat2').onclick = () => { Sfx.click(); closeModal(wrap); startCharacterDialogue(id, 'chat'); };
        wrap.querySelector('#cmDeep2').onclick = () => { Sfx.click(); closeModal(wrap); startCharacterDialogue(id, 'deep'); };
        wrap.querySelector('#cmGift2').onclick = () => { Sfx.click(); closeModal(wrap); _origOpenCharMenu ? giveGiftWrapper(id) : giveGiftWrapper(id); };
      }
    });
  };

  // 送礼逻辑复用原版（原版 giveGift 在 function 声明里，直接调用）
  function giveGiftWrapper(id) {
    // 尝试调用原版 giveGift
    try {
      if (typeof giveGift === 'function') { giveGift(id); return; }
    } catch (e) {}
    // 兜底：简单送礼
    const c = CHARS[id];
    if (!c) return;
    openModal({
      title: '赠 礼 · ' + c.name,
      body: '<p style="font-size:12px;color:var(--text-d);">选择礼物。</p>',
      footHTML: '<button class="btn ghost" onclick="(function(){var l=document.getElementById(\'modalLayer\');l.classList.remove(\'open\');l.innerHTML=\'\';})()">关闭</button>'
    });
  }

  /* ==================== 工坊数据 ==================== */
  const K_USER = 'nightfalling_user_content_v2';
  let userContent = []; // [{ key, type, title, subtitle, location, lines, ts }]

  function loadUserContent() {
    try {
      const raw = localStorage.getItem(K_USER);
      if (raw) {
        const d = JSON.parse(raw);
        if (Array.isArray(d)) userContent = d;
      }
    } catch (e) { userContent = []; }
  }
  function saveUserContent() {
    try {
      localStorage.setItem(K_USER, JSON.stringify(userContent));
      return true;
    } catch (e) {
      toast('存储失败：空间可能已满', 'warn');
      return false;
    }
  }

  // 把用户内容注入 SCENES
  function injectUserContent() {
    userContent.forEach(item => {
      if (item.type === 'chapter' || item.type === 'dungeon') {
        const sceneId = 'user_' + item.key;
        if (SCENES[sceneId]) return; // 已存在
        const lines = (item.lines || []).map(l => {
          if (l.type === 'n') return { t: 'n', cn: l.cn || '' };
          if (l.type === 's') return { t: 'd', who: l.char || '？？？', en: l.en || '', cn: l.cn || '' };
          if (l.type === 'me') return { t: 'me', en: l.en || '', cn: l.cn || '' };
          return { t: 'n', cn: l.cn || '' };
        });
        SCENES[sceneId] = {
          bg: 'city',
          loc: item.location || '未知之地',
          lines: lines,
          chapterEnd: true,
          chapterEndTitle: (item.title || '自定义章节') + ' 完',
          onEnd: () => {
            toast('◈ 已完成：' + (item.title || ''), 'ok');
            saveGame();
            setTimeout(() => showScreen('map'), 800);
          }
        };
      }
    });
  }

  /* ==================== 工坊模态框 ==================== */
  let wsType = 'chapter';
  let wsEditKey = null;
  let wsEditData = null;

  function blankChapterForm() {
    return {
      type: 'chapter',
      title: '',
      subtitle: '',
      location: '',
      lines: [{ type: 'n', char: '', en: '', cn: '' }]
    };
  }

  function openWorkshop() {
    if ($('#wsModalWrap')) return;
    const wrap = document.createElement('div');
    wrap.id = 'wsModalWrap';
    wrap.className = 'modal';
    wrap.style.maxWidth = '820px';
    wrap.style.maxHeight = '90vh';
    wrap.innerHTML =
      '<div class="modal-head">' +
        '<div class="modal-title">剧 情 工 坊</div>' +
        '<button class="modal-close" aria-label="关闭">×</button>' +
      '</div>' +
      '<div class="modal-body" id="wsBody"></div>';
    const layer = $('#modalLayer');
    layer.appendChild(wrap);
    layer.classList.add('open');
    wrap.querySelector('.modal-close').onclick = () => { Sfx.click(); closeModal(wrap); };
    layer.onclick = (e) => { if (e.target === layer) closeModal(wrap); };
    renderWsBody(wrap);
  }

  function renderWsBody(wrap) {
    const body = wrap.querySelector('#wsBody');
    if (!body) return;
    const typeLabels = { chapter: '新章节', dungeon: '新副本' };
    let formHTML = '';
    if (!wsEditData) wsEditData = blankChapterForm();
    if (wsType === 'chapter' || wsType === 'dungeon') wsEditData.type = wsType;

    formHTML =
      '<div class="ws-intro">' +
        '在这里写新的<b>章节</b>或<b>副本</b>。<b>不需要懂代码</b>——填表单即可，保存后立刻能玩，关闭浏览器也不会丢。' +
      '</div>' +
      '<div class="ws-type-bar">' +
        '<button class="ws-type-btn ' + (wsType === 'chapter' ? 'on' : '') + '" data-type="chapter">新章节</button>' +
        '<button class="ws-type-btn ' + (wsType === 'dungeon' ? 'on' : '') + '" data-type="dungeon">新副本</button>' +
      '</div>' +
      '<div class="ws-field">' +
        '<label>标 题 <b>（必填）</b></label>' +
        '<input class="inp" id="wsTitle" placeholder="例如：第三章 · 夜与晨" value="' + esc(wsEditData.title) + '">' +
      '</div>' +
      '<div class="ws-field">' +
        '<label>副 标 题</label>' +
        '<input class="inp" id="wsSubtitle" placeholder="例如：落日之都的第二日" value="' + esc(wsEditData.subtitle) + '">' +
      '</div>' +
      '<div class="ws-field">' +
        '<label>地 点</label>' +
        '<input class="inp" id="wsLocation" placeholder="例如：日不落酒馆 · 吧台" value="' + esc(wsEditData.location) + '">' +
      '</div>' +
      '<div class="ws-field">' +
        '<label>对 话 内 容 <b>（每行独立）</b></label>' +
        '<p class="ws-hint">旁白只填中文；角色台词和主角台词填「英文台词 + 中文翻译」。</p>' +
        '<div class="ws-lines" id="wsLines"></div>' +
        '<button class="ws-add-line" id="wsAddLine">＋ 添 加 一 行 对 话</button>' +
      '</div>' +
      '<div class="ws-field">' +
        '<label>预 览</label>' +
        '<div class="ws-preview" id="wsPreview"></div>' +
      '</div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;">' +
        '<button class="btn ghost" id="wsCancel">取消</button>' +
        '<button class="btn primary" id="wsSave">' + (wsEditKey ? '覆盖保存' : '保存并加入游戏') + '</button>' +
      '</div>' +
      '<div class="divider" style="margin:28px 0 16px;"><span>已 导 入 的 内 容</span></div>' +
      '<div id="wsList"></div>';

    body.innerHTML = formHTML;

    body.querySelectorAll('.ws-type-btn').forEach(b => {
      b.onclick = () => { Sfx.click(); wsType = b.dataset.type; renderWsBody(wrap); };
    });

    const linesBox = body.querySelector('#wsLines');
    wsEditData.lines.forEach((line, i) => appendLineCard(linesBox, line, i, body, wrap));
    updatePreview(body);

    body.querySelector('#wsAddLine').onclick = () => {
      Sfx.click();
      wsEditData.lines.push({ type: 'n', char: '', en: '', cn: '' });
      renderWsBody(wrap);
    };
    body.querySelector('#wsCancel').onclick = () => { Sfx.click(); wsEditKey = null; wsEditData = null; renderWsBody(wrap); };
    body.querySelector('#wsSave').onclick = () => saveChapter(body, wrap);
    renderUserList(body, wrap);
  }

  function appendLineCard(box, line, i, body, wrap) {
    const card = document.createElement('div');
    card.className = 'ws-line-card';
    const type = line.type || 'n';
    card.innerHTML =
      '<div class="ws-line-head">' +
        '<span class="ws-line-num">行 ' + (i + 1) + '</span>' +
        '<select class="ws-line-type">' +
          '<option value="n" ' + (type === 'n' ? 'selected' : '') + '>旁白</option>' +
          '<option value="s" ' + (type === 's' ? 'selected' : '') + '>角色台词</option>' +
          '<option value="me" ' + (type === 'me' ? 'selected' : '') + '>主角台词</option>' +
        '</select>' +
        '<button class="ws-line-del" data-i="' + i + '">×</button>' +
      '</div>' +
      '<div class="ws-line-body">' +
        '<input class="inp ws-char" placeholder="角色名（如：菲曼）" value="' + esc(line.char || '') + '" style="display:' + (type === 's' ? 'block' : 'none') + ';margin-bottom:8px;">' +
        '<input class="inp ws-en" placeholder="英文台词（旁白留空）" value="' + esc(line.en || '') + '" style="font-family:var(--f-en);font-style:italic;margin-bottom:8px;">' +
        '<input class="inp ws-cn" placeholder="中文内容（必填）" value="' + esc(line.cn || '') + '">' +
      '</div>';
    box.appendChild(card);

    const sel = card.querySelector('.ws-line-type');
    const charInput = card.querySelector('.ws-char');
    sel.onchange = () => {
      line.type = sel.value;
      charInput.style.display = sel.value === 's' ? 'block' : 'none';
      updatePreview(body);
    };
    charInput.oninput = () => { line.char = charInput.value; updatePreview(body); };
    card.querySelector('.ws-en').oninput = (e) => { line.en = e.target.value; updatePreview(body); };
    card.querySelector('.ws-cn').oninput = (e) => { line.cn = e.target.value; updatePreview(body); };
    card.querySelector('.ws-line-del').onclick = () => {
      Sfx.click();
      if (wsEditData.lines.length <= 1) { toast('至少保留一行', 'warn'); return; }
      wsEditData.lines.splice(i, 1);
      renderWsBody(wrap);
    };
  }

  function updatePreview(body) {
    const prev = body.querySelector('#wsPreview');
    if (!prev) return;
    const pers = (state.player && state.player.personality) || '冷静';
    let html = '<div class="ws-preview-title">◈ PREVIEW</div>';
    (wsEditData.lines || []).forEach(l => {
      if (!l.cn) return;
      const isNarr = l.type === 'n';
      html += '<div class="ws-preview-line ' + (isNarr ? 'narr' : '') + '">';
      if (l.type === 's' && l.char) html += '<div class="pp-speaker">' + esc(l.char) + '</div>';
      if (l.type === 'me') html += '<div class="pp-speaker">' + esc((state.player && state.player.name) || '记者') + '</div>';
      if (!isNarr && l.en) html += '<div class="pp-en">' + esc(l.en) + '</div>';
      html += '<div class="pp-cn">' + esc(l.cn) + '</div>';
      html += '</div>';
    });
    if (!html.includes('pp-cn')) html += '<p style="font-size:12px;color:var(--text-d);font-style:italic;">尚未填写任何对话。</p>';
    prev.innerHTML = html;
  }

  function saveChapter(body, wrap) {
    const title = body.querySelector('#wsTitle').value.trim();
    const subtitle = body.querySelector('#wsSubtitle').value.trim();
    const location = body.querySelector('#wsLocation').value.trim();
    if (!title) { toast('请填写标题', 'warn'); return; }
    const lines = (wsEditData.lines || []).filter(l => l.cn && l.cn.trim());
    if (!lines.length) { toast('至少填写一行对话', 'warn'); return; }

    const key = wsEditKey || ('user_' + Date.now());
    const item = {
      key, type: wsEditData.type || wsType,
      title, subtitle, location, lines, ts: Date.now()
    };
    // 覆盖或新增
    const idx = userContent.findIndex(x => x.key === key);
    if (idx >= 0) userContent[idx] = item;
    else userContent.push(item);
    saveUserContent();
    // 从 SCENES 里清掉旧的（如果有）
    const sceneId = 'user_' + key;
    if (SCENES[sceneId]) delete SCENES[sceneId];
    injectUserContent();

    Sfx.success();
    toast('◈ 已保存：' + title, 'ok');
    wsEditKey = null;
    wsEditData = null;
    renderWsBody(wrap);
  }

  function renderUserList(body, wrap) {
    const listBox = body.querySelector('#wsList');
    if (!listBox) return;
    if (!userContent.length) {
      listBox.innerHTML = '<p style="text-align:center;color:var(--text-d);font-style:italic;padding:20px 0;font-size:12.5px;">还没有导入内容。选一个类型开始写吧。</p>';
      return;
    }
    const sorted = userContent.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
    let html = '<div class="ws-pack-list">';
    sorted.forEach(item => {
      const t = new Date(item.ts || Date.now());
      const timeStr = t.getFullYear() + '/' + (t.getMonth()+1) + '/' + t.getDate() + ' ' + String(t.getHours()).padStart(2,'0') + ':' + String(t.getMinutes()).padStart(2,'0');
      const typeLabel = item.type === 'dungeon' ? '副本' : '章节';
      html += '<div class="ws-pack" data-key="' + esc(item.key) + '">' +
        '<div class="ws-pack-head">' +
          '<div class="ws-pack-title">' + esc(item.title || item.key) + '</div>' +
          '<div style="font-size:11px;color:var(--gold-d);letter-spacing:.1em;">' + typeLabel + '</div>' +
        '</div>' +
        '<div class="ws-pack-meta">' + timeStr + ' · ' + (item.lines || []).length + ' 行</div>' +
        '<div class="ws-pack-actions">' +
          '<button class="ws-mini primary" data-act="play">▶ 开始阅读</button>' +
          '<button class="ws-mini" data-act="edit">编辑</button>' +
          '<button class="ws-mini danger" data-act="del">删除</button>' +
        '</div>' +
      '</div>';
    });
    html += '</div>';
    listBox.innerHTML = html;

    listBox.querySelectorAll('.ws-pack').forEach(el => {
      const key = el.dataset.key;
      const item = userContent.find(x => x.key === key);
      if (!item) return;
      el.querySelector('[data-act="play"]').onclick = () => {
        Sfx.click();
        closeModal(wrap);
        const sceneId = 'user_' + key;
        if (SCENES[sceneId]) {
          setTimeout(() => playScene(sceneId), 200);
        } else {
          toast('场景未加载', 'warn');
        }
      };
      el.querySelector('[data-act="edit"]').onclick = () => {
        Sfx.click();
        wsEditKey = key;
        wsType = item.type || 'chapter';
        wsEditData = {
          type: item.type,
          title: item.title,
          subtitle: item.subtitle || '',
          location: item.location || '',
          lines: JSON.parse(JSON.stringify(item.lines || []))
        };
        renderWsBody(wrap);
      };
      el.querySelector('[data-act="del"]').onclick = () => {
        if (!confirm('确定删除「' + (item.title || key) + '」？')) return;
        Sfx.fail();
        userContent = userContent.filter(x => x.key !== key);
        saveUserContent();
        const sceneId = 'user_' + key;
        if (SCENES[sceneId]) delete SCENES[sceneId];
        toast('◈ 已删除', 'ok');
        renderWsBody(wrap);
      };
    });
  }

  /* ==================== 副本大厅 ==================== */
  function openDungeonHall() {
    const dungeons = userContent.filter(x => x.type === 'dungeon');
    let html = '<div class="ws-intro">这里列出所有已导入的<b>副本</b>——与主线无关的独立小故事。</div>';
    if (!dungeons.length) {
      html += '<p style="text-align:center;color:var(--text-d);font-style:italic;padding:28px 0;font-size:12.5px;">还没有副本。去「剧情工坊」创建一个吧。</p>';
    } else {
      html += '<div class="ws-pack-list">';
      dungeons.forEach(d => {
        html += '<div class="ws-pack">' +
          '<div class="ws-pack-head">' +
            '<div class="ws-pack-title">' + esc(d.title) + '</div>' +
            '<div style="font-size:11px;color:var(--gold-d);letter-spacing:.1em;">副本</div>' +
          '</div>' +
          '<div class="ws-pack-meta">' + esc(d.subtitle || d.location || '') + '</div>' +
          '<div class="ws-pack-actions">' +
            '<button class="ws-mini primary" data-play="' + esc(d.key) + '">▶ 开始阅读</button>' +
          '</div>' +
        '</div>';
      });
      html += '</div>';
    }
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.style.maxWidth = '620px';
    wrap.innerHTML =
      '<div class="modal-head">' +
        '<div class="modal-title">副 本 大 厅</div>' +
        '<button class="modal-close">×</button>' +
      '</div>' +
      '<div class="modal-body">' + html + '</div>' +
      '<div class="modal-foot"><button class="btn ghost" id="dhClose">关闭</button></div>';
    const layer = $('#modalLayer');
    layer.appendChild(wrap);
    layer.classList.add('open');
    wrap.querySelector('.modal-close').onclick = () => { Sfx.click(); closeModal(wrap); };
    wrap.querySelector('#dhClose').onclick = () => { Sfx.click(); closeModal(wrap); };
    layer.onclick = (e) => { if (e.target === layer) closeModal(wrap); };
    wrap.querySelectorAll('[data-play]').forEach(b => {
      b.onclick = () => {
        Sfx.click();
        const key = b.dataset.play;
        closeModal(wrap);
        const sceneId = 'user_' + key;
        if (SCENES[sceneId]) setTimeout(() => playScene(sceneId), 200);
        else toast('副本未加载', 'warn');
      };
    });
  }

  /* ==================== 标题页按钮注入 ==================== */
  function injectTitleButtons() {
    const actions = document.querySelector('#screen-title .title-actions');
    if (!actions) return;
    if (actions.querySelector('[data-act="workshop"]')) return;
    // 工坊按钮
    const wsBtn = document.createElement('button');
    wsBtn.className = 'btn';
    wsBtn.setAttribute('data-act', 'workshop');
    wsBtn.textContent = '剧 情 工 坊';
    wsBtn.onclick = () => { Sfx.ensure(); Sfx.click(); openWorkshop(); };
    // 副本按钮
    const dhBtn = document.createElement('button');
    dhBtn.className = 'btn';
    dhBtn.setAttribute('data-act', 'dungeon');
    dhBtn.textContent = '副 本 大 厅';
    dhBtn.onclick = () => { Sfx.ensure(); Sfx.click(); openDungeonHall(); };
    // 插到"关于本作"之前
    const aboutBtn = actions.querySelector('[data-act="about"]');
    if (aboutBtn) {
      actions.insertBefore(wsBtn, aboutBtn);
      actions.insertBefore(dhBtn, aboutBtn);
    } else {
      actions.appendChild(wsBtn);
      actions.appendChild(dhBtn);
    }
  }

  /* ==================== 顶栏工坊/副本按钮 ==================== */
  function injectTopbarButtons() {
    const right = document.querySelector('#screen-game .topbar .tb-right');
    if (right) {
      if (!right.querySelector('[data-act="ws"]')) {
        const b = document.createElement('button');
        b.className = 'mini-btn';
        b.setAttribute('data-act', 'ws');
        b.textContent = '工坊';
        b.style.marginLeft = '6px';
        b.onclick = () => { Sfx.click(); openWorkshop(); };
        // 找现有的按钮容器，这里简单插到 topbar 末尾
        right.appendChild(b);
      }
    }
    // 底部导航加"副本"入口（用中间按钮右侧替换不做了，用地图里的"副本大厅"够了）
  }

  /* ==================== 设置：追加云同步预留 ==================== */
  const _origRenderSettings = renderSettings;
  window.renderSettings = function () {
    _origRenderSettings();
    const main = $('#setMain');
    if (!main) return;
    // 在"存档与数据"组后追加一个"云同步"占位
    const groups = main.querySelectorAll('.set-group');
    if (!groups.length) return;
    // 检查是否已经加过
    if (main.querySelector('#cloudSyncGroup')) return;
    const cloudGroup = document.createElement('div');
    cloudGroup.id = 'cloudSyncGroup';
    cloudGroup.className = 'set-group';
    cloudGroup.innerHTML =
      '<div class="set-group-head">云 同 步 （预 留）</div>' +
      '<div class="set-row">' +
        '<div class="set-label"><div class="set-label-t">Supabase 接入</div><div class="set-label-d">下一版本将开放：所有导入的章节/档案自动上传云端，任何人打开网页都能看到。</div></div>' +
        '<div class="set-ctrl"><span style="font-size:11px;color:var(--gold-d);letter-spacing:.06em;">即将开放</span></div>' +
      '</div>';
    main.appendChild(cloudGroup);
  };

  /* ==================== 初始化 ==================== */
  function boot() {
    try {
      loadUserContent();
      injectPersonality();
      injectUserContent();
      injectTitleButtons();
      injectTopbarButtons();

      // 兜底：若原版 renderLine 已经定义，立即覆盖
      if (typeof _origRenderLine === 'function') {
        // 已覆盖
      }

      console.log('%c[extras] 工坊 / 副本 / 等级表 / 性格分支 已加载', 'color:#9dd0a0;font-size:11px;');
    } catch (e) {
      console.error('[extras] boot 失败：', e);
      try { toast('扩展模块加载失败：' + (e.message || '未知'), 'warn'); } catch (e2) {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    // 已经加载完，稍等主脚本执行完
    setTimeout(boot, 0);
  }

})();
