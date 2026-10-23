/* ═══════════════════════════════════════════════════════════
   church-extra.js · 萨克拉教会 (Sacra Church)
   依赖 window.NF.LOCATIONS 和 window.NF.openModal
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.NF) { console.error('[church-extra] NF 未找到'); return; }
  const NF = window.NF;
  const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const K_LOG = 'nightfalling_v4_minigame_log';
  function todayStr() { const d = new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function getLog() { try { return JSON.parse(localStorage.getItem(K_LOG) || '{}'); } catch(e) { return {}; } }
  function setLog(d) { try { localStorage.setItem(K_LOG, JSON.stringify(d)); } catch(e) {} }
  function isFirstPlay(id) { const log = getLog(); return !(log[todayStr()] && log[todayStr()][id]); }
  function markPlayed(id) { const log = getLog(); if (!log[todayStr()]) log[todayStr()] = {}; log[todayStr()][id] = Date.now(); setLog(log); }

  function giveReward(silver, affObj, isFirst) {
    if (!isFirst) return null;
    const s = NF.state(); if (!s) return null;
    if (silver) s.stats.silver = (s.stats.silver || 0) + silver;
    if (affObj) for (const k in affObj) s.affection[k] = (s.affection[k] || 0) + affObj[k];
    NF.saveNow(); return { silver, aff: affObj };
  }

  /* ═══════════════════════════════════════════════════════════
     1. 教义问答（醒派 / 梦派辨析）
     ═══════════════════════════════════════════════════════════ */
  function openDoctrineQuiz() {
    const first = isFirstPlay('church_quiz');
    markPlayed('church_quiz');

    const questions = [
      { q:'萨克拉教会信奉的神明是谁？', opts:['摩耳甫斯','维吉兰斯','赛薇拉','塔瓦娜'], answer:1 },
      { q:'根据醒派教义，魇灾降下的原因是什么？', opts:['人类的贪婪与战争','人类曾贪恋梦境、崇拜梦兆','神明抛弃了世界','摩耳甫斯的叛变'], answer:1 },
      { q:'哪一派认为摩耳甫斯是维吉兰斯的“闭眼”？', opts:['醒派','梦派','裁判所','圣梦目管理院'], answer:1 },
      { q:'异端裁判所隶属于哪一派？', opts:['梦派','醒派','管理院','王翼'], answer:1 },
      { q:'正统的醒派对待梦域的态度是？', opts:['与梦域和解','彻底封印摩耳甫斯','主动进入梦域','视而不见'], answer:1 }
    ];

    let qIdx = 0, correct = 0, locked = false;
    let qHTML = '';

    function renderQuestion() {
      const q = questions[qIdx];
      qHTML = '<div style="font-size:11.5px;color:var(--text-d);letter-spacing:.14em;margin-bottom:12px;text-align:center;">' +
        '◈ ' + (qIdx + 1) + ' / ' + questions.length + ' ◈</div>' +
        '<div style="font-size:15px;color:var(--text);line-height:1.9;margin-bottom:18px;text-align:center;padding:0 8px;">' + esc(q.q) + '</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;">';
      q.opts.forEach((o, i) => {
        qHTML += '<button class="choice-btn" data-opt="' + i + '"><span class="choice-idx">' + '①②③④'.charAt(i) + '</span><span>' + esc(o) + '</span></button>';
      });
      qHTML += '</div>';
    }

    function update() {
      const wrap = document.getElementById('quizWrap');
      if (!wrap) return;
      wrap.innerHTML = qHTML;
      wrap.querySelectorAll('.choice-btn').forEach(btn => {
        btn.onclick = () => {
          if (locked) return;
          locked = true;
          const opt = parseInt(btn.dataset.opt);
          const q = questions[qIdx];
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
            if (qIdx >= questions.length) finish();
            else { renderQuestion(); update(); }
          }, 400);
        };
      });
    }

    function finish() {
      let reward_ = 0;
      if (correct === 5) reward_ = 30;
      else if (correct === 4) reward_ = 20;
      else if (correct >= 2) reward_ = 10;

      const got = giveReward(reward_, { tavana: 2 }, first);
      NF.closeAllModals();

      NF.openModal({
        title: '教 义 问 答 · 完 成',
        body: '<div class="ending-card">' +
          '<span class="e-icon">' + (correct >= 4 ? '☩' : '◇') + '</span>' +
          '<div class="e-title">' + correct + ' / ' + questions.length + ' 题 正确</div>' +
          '<div class="e-sub">Doctrine Inquisition</div>' +
          '<div class="e-desc">修士收起了羊皮卷，深深地看了你一眼。<br><br>' +
            (got ? '<b style="color:var(--gold);">银镑 +' + got.silver + '</b>　·　塔瓦娜好感 +' + got.aff.tavana : '今日已领过奖励，这次算是温习。') +
          '</div></div>',
        footHTML: '<button class="btn primary" id="wxOk">好的</button>',
        onMount: (w) => {
          w.querySelector('#wxOk').onclick = () => { NF.closeModal(w); if (typeof NF.renderMap === 'function') NF.renderMap(); };
        }
      });
    }

    renderQuestion();
    NF.openModal({
      title: '萨 克 拉 教 会 · 教 义 问 答',
      body: '<div id="quizWrap">' + qHTML + '</div>',
      footHTML: '<button class="btn ghost" id="qClose">离 开</button>',
      onMount: (w) => {
        w.querySelector('#qClose').onclick = () => { NF.Sfx.click(); NF.closeModal(w); };
        update();
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     2. 经文查阅（长文本展示）
     ═══════════════════════════════════════════════════════════ */
  function openScriptureReading() {
    const first = isFirstPlay('church_scripture');
    markPlayed('church_scripture');

    const textHTML = `
      <div style="padding:10px; font-family:var(--f-cn); line-height:2.1; color:var(--text);">
        <div style="text-align:center; margin-bottom:24px;">
          <div style="font-family:var(--f-deco); font-size:20px; color:var(--gold-b); letter-spacing:.2em; margin-bottom:8px;">哀 · 歌</div>
          <div style="font-family:var(--f-en); font-style:italic; font-size:13px; color:var(--gold-d); letter-spacing:.1em;">The Lamentations — Chapter VII</div>
        </div>
        
        <p style="margin-bottom:16px; color:var(--text-d); font-style:italic; font-size:13.5px;">
          主啊，我呼求你，你不应允，要到几时呢？<br>
          我躺卧，便说：我何时醒来？<br>
          我的骨头发颤，我的灵魂枯干，如同无水之地。
        </p>
        
        <p style="margin-bottom:16px; color:var(--text-d); font-style:italic; font-size:13.5px;">
          因你使沉睡的变为死寂，使闭眼的归入幽暗。<br>
          主啊，求你睁眼看我，因我躺下，却不得安歇。
        </p>

        <div class="divider" style="margin:24px 0;"><span>☩</span></div>

        <p style="margin-bottom:16px; font-size:14px;">
          我曾见日头升起，却如燃尽的灰烬；我听见风过银杏，却以为是死者的叹息。
        </p>
        
        <p style="margin-bottom:16px; font-size:14px;">
          那夜间的惊骇临到我，看守我的人徒然警醒。他们闭眼，就被掳去；他们的灵魂在深渊中游行，如同无牧的羊。
        </p>

        <p style="margin-bottom:16px; font-size:14px;">
          眼目的情欲，梦中的虚妄，皆如捕风。凡贪恋幻影的，必被幻影吞灭。
        </p>

        <div class="divider" style="margin:24px 0;"><span>☩</span></div>

        <p style="margin-bottom:16px; font-size:14px; color:var(--gold-b);">
          神啊，你的眼目察看地极，你的凝视是我们存留的凭据。
        </p>
        <p style="margin-bottom:16px; font-size:14px; color:var(--gold-b);">
          愿你的盾牌庇护我们，使我们在清晨醒来时，仍能看见破晓的光。
        </p>
        <p style="margin-bottom:16px; font-size:14px; color:var(--gold-b);">
          因为醒来的人，要赞美你的名；沉睡的人，不能称谢你。阿门。
        </p>
      </div>
    `;

    NF.openModal({
      title: '经 文 查 阅',
      wide: true,
      body: textHTML,
      footHTML: '<button class="btn primary" id="sClose">合 上 经 卷</button>',
      onMount: (w) => {
        w.querySelector('#sClose').onclick = () => {
          NF.Sfx.click(); NF.closeModal(w);
          const got = giveReward(15, { tavana: 1 }, first);
          if (got) {
            NF.toast('◈ 阅读经文令你有所领悟。银镑 +' + got.silver, 'ok');
            if (typeof NF.renderMap === 'function') NF.renderMap();
          } else {
            NF.toast('◈ 你静默了一会儿。', 'ok');
          }
        };
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     3. 注册地点到落日之都
     ═══════════════════════════════════════════════════════════ */
  const LOCS = window.NF.LOCATIONS;
  if (Array.isArray(LOCS)) {
    if (!LOCS.find(l => l.key === 'sacra_church')) {
      LOCS.push({
        key: 'sacra_church', 
        name: '萨克拉教会', 
        bg: 'church', 
        region: '索姆尼亚帝国 · 落日之都',
        desc: '最古老的宗教机构。信奉从不闭眼的神明“维吉兰斯”。内部暗流涌动。',
        unlock: null,
        entries: [
          { type:'minigame', id:'church_quiz', name:'教义问答', icon:'☩', desc:'醒派与梦派的区别。每日首测有奖励。' },
          { type:'minigame', id:'church_scripture', name:'查阅经文', icon:'✝', desc:'翻阅《哀•歌》第七章。' }
        ]
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════
     4. 将入口挂载到 Minigames（拦截不认识的 id）
     ═══════════════════════════════════════════════════════════ */
  const origOpen = window.Minigames.open;
  window.Minigames.open = function (id) {
    if (id === 'church_quiz') { openDoctrineQuiz(); return; }
    if (id === 'church_scripture') { openScriptureReading(); return; }
    origOpen(id);
  };

  try {
    if (typeof NF.renderMap === 'function' && NF.state && NF.state()) NF.renderMap();
  } catch(e) {}

  console.log('%c[church-extra] 萨克拉教会 · 教义问答 / 经文查阅 已加载', 'color:#9dd0a0;font-size:11px;');
})();
