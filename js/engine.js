window.NF = {};
(function() {
  const $ = s => document.querySelector(s);
  const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  NF.state = {
    player: { name: '记者', gender: '不限', personality: '冷静' },
    stats: { silver: 0 },
    affection: {}, flags: { mapUnlock: 0 },
    log: [], currentScene: null, currentLineIdx: 0, snapshots: [], screen: 'title'
  };

  NF.saveGame = () => {
    try { localStorage.setItem('nf_save', JSON.stringify({
      player: NF.state.player, stats: NF.state.stats, affection: NF.state.affection,
      flags: NF.state.flags, log: NF.state.log.slice(-150), currentScene: NF.state.currentScene
    })); } catch(e){}
  };
  NF.loadGame = () => {
    try { const raw = localStorage.getItem('nf_save'); if (!raw) return false; Object.assign(NF.state, JSON.parse(raw)); return true; } catch(e){ return false; }
  };

  NF.toast = (msg, type='') => {
    const layer = $('#toastLayer'); const el = document.createElement('div'); el.className = 'toast ' + type; el.textContent = msg;
    layer.appendChild(el); setTimeout(() => el.remove(), 2500);
  };

  NF.openModal = (opt) => {
    const layer = $('#modalLayer'); const wrap = document.createElement('div'); wrap.className = 'modal';
    wrap.innerHTML = `<div class="modal-head"><div class="modal-title">${esc(opt.title)}</div><button class="modal-close">×</button></div><div class="modal-body">${opt.body}</div>${opt.footHTML ? '<div class="modal-foot">'+opt.footHTML+'</div>' : ''}`;
    layer.appendChild(wrap); layer.classList.add('open');
    wrap.querySelector('.modal-close').onclick = () => { wrap.remove(); if(!$('.modal')) layer.classList.remove('open'); };
    layer.onclick = (e) => { if (e.target === layer) { layer.classList.remove('open'); layer.innerHTML=''; } };
    if (opt.onMount) opt.onMount(wrap);
    return wrap;
  };

  NF.showScreen = (name) => {
    const cur = document.querySelector('.screen.active'); const nxt = document.getElementById('screen-' + name); if (!nxt) return;
    if (cur) cur.classList.remove('active'); nxt.classList.add('active'); NF.state.screen = name;
    const nav = $('#bottomNav'); if (nav) nav.style.display = (name === 'title') ? 'none' : 'flex';
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.nav === name));
    if (name === 'map' && window.NF.renderMap) window.NF.renderMap();
    if (name === 'log' && window.NF.renderLog) window.NF.renderLog();
    if (name === 'settings' && window.NF.renderSettings) window.NF.renderSettings();
  };

  NF.playScene = (sceneId, isRestoring=false) => {
    const scene = SCENES[sceneId]; if (!scene) return;
    NF.state.currentScene = sceneId; NF.state.currentLineIdx = 0;
    if (!isRestoring) {
      NF.state.snapshots.push({ scene: sceneId, aff: JSON.parse(JSON.stringify(NF.state.affection)) });
      if (scene.unlockMap !== undefined) NF.state.flags.mapUnlock = Math.max(NF.state.flags.mapUnlock || 0, scene.unlockMap);
    }
    NF.showScreen('game'); $('#sceneBg').className = 'scene-bg bg-' + (scene.bg || 'city');
    $('#locLabel').textContent = scene.loc; $('#topLoc').textContent = scene.loc;
    $('#dialogInner').innerHTML = ''; $('#choices').classList.remove('active');
    renderLine(0);
  };

  NF.rewind = () => {
    if (NF.state.snapshots.length <= 1) return NF.toast('已经回到最初了', 'warn');
    NF.state.snapshots.pop(); const prev = NF.state.snapshots[NF.state.snapshots.length - 1];
    NF.state.affection = prev.aff; NF.playScene(prev.scene, true); NF.toast('◈ 已回溯');
  };

  function renderLine(idx) {
    const scene = SCENES[NF.state.currentScene]; if (!scene) return;
    if (idx >= scene.lines.length) { if (scene.onEnd) scene.onEnd(); else if (scene.next) NF.playScene(scene.next); else NF.showScreen('map'); return; }
    NF.state.currentLineIdx = idx; const line = scene.lines[idx]; const div = document.createElement('div'); div.className = 'line';
    let text = line.cn; if (line.byPers && line.byPers[NF.state.player.personality]) text = line.byPers[NF.state.player.personality];
    if (line.t === 'n') { div.classList.add('narration'); div.innerHTML = `<div class="cn">${esc(text)}</div>`; }
    else if (line.t === 'me') { div.classList.add('monologue'); div.innerHTML = `<div class="cn">${esc(text)}</div>`; }
    else { const c = CHARS[line.who] || { name: line.who }; div.innerHTML = `<div class="speaker">${esc(c.name)}</div><div class="en">${esc(line.en)}</div><div class="cn">${esc(text)}</div>`; }
    $('#dialogInner').appendChild(div); div.onclick = () => advanceLine();
  }

  function advanceLine() {
    const scene = SCENES[NF.state.currentScene]; if (!scene) return;
    if (NF.state.currentLineIdx + 1 < scene.lines.length) renderLine(NF.state.currentLineIdx + 1);
    else { if (scene.choices) showChoices(scene.choices); else renderLine(NF.state.currentLineIdx + 1); }
  }
  window.advanceLine = advanceLine;

  function showChoices(choices) {
    const box = $('#choicesInner'); box.innerHTML = '<div style="color:var(--gold);font-size:12px;margin-bottom:10px;">—— 抉 择 ——</div>';
    choices.forEach((c, i) => {
      const btn = document.createElement('button'); btn.className = 'choice-btn'; btn.innerHTML = `<span class="choice-idx">${'①②③'[i]||'◆'}</span><span>${esc(c.cn)}</span>`;
      btn.onclick = () => {
        NF.state.snapshots.push({ scene: NF.state.currentScene, aff: JSON.parse(JSON.stringify(NF.state.affection)) });
        $('#choices').classList.remove('active'); if (c.set) applySet(c.set); if (c.next) NF.playScene(c.next);
      };
      box.appendChild(btn);
    });
    $('#choices').classList.add('active');
  }

  function applySet(set) { if (set.aff) for (let k in set.aff) NF.state.affection[k] = (NF.state.affection[k]||0) + set.aff[k]; if (set.flags) Object.assign(NF.state.flags, set.flags); }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-act]').forEach(btn => {
      btn.onclick = () => {
        const act = btn.dataset.act;
        if (act === 'new') {
          NF.openModal({
            title: '新 的 旅 程', 
            body: `
              <div style="margin-bottom:14px;"><input class="inp" id="nName" value="记者" placeholder="姓名"></div>
              <div style="margin-bottom:14px;"><select class="inp" id="nGender"><option value="女">女</option><option value="男">男</option><option value="不限">不限</option></select></div>
              <div style="margin-bottom:14px;"><select class="inp" id="nPers"><option value="冷静">冷静</option><option value="直率">直率</option></select></div>
            `,
            footHTML: `<button class="btn primary" id="bStart">启程</button>`,
            onMount: (w) => { 
              w.querySelector('#bStart').onclick = () => { 
                NF.state.player.name = w.querySelector('#nName').value; 
                NF.state.player.gender = w.querySelector('#nGender').value;
                NF.state.player.personality = w.querySelector('#nPers').value; 
                w.remove(); NF.playScene('prologue_1'); 
              }; 
            }
          });
        } else if (act === 'continue') {
          if (NF.loadGame() && NF.state.currentScene) NF.playScene(NF.state.currentScene, true); else NF.toast('没有存档', 'warn');
        } else if (act === 'settings') NF.showScreen('settings');
        else if (act === 'workshop' && window.openWorkshop) window.openWorkshop();
        else if (act === 'about') NF.toast('引擎由入魇开发组提供。');
      };
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.onclick = () => {
        const nav = btn.dataset.nav;
        if (nav === 'game') { if (NF.state.currentScene) NF.showScreen('game'); else NF.showScreen('map'); }
        else if (nav === 'map') NF.showScreen('map');
        else if (nav === 'log') NF.showScreen('log');
        else if (nav === 'settings') NF.showScreen('settings');
      };
    });
  });
})();
