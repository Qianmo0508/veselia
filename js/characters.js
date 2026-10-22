(function() {
  const $ = s => document.querySelector(s);

  window.NF.renderMap = function() {
    const main = $('#mapMain'); if (!main) return;
    let html = ''; const currUnlock = NF.state.flags.mapUnlock || 0;
    
    let userLocs = []; try { userLocs = JSON.parse(localStorage.getItem('nf_locs')||'[]'); } catch(e){}
    const allRegions = JSON.parse(JSON.stringify(MAP_DATA));
    if (userLocs.length) allRegions.push({ region: '自定义地点', spots: userLocs });

    allRegions.forEach(reg => {
      html += `<div class="map-region-head">${reg.region}</div><div class="map-grid">`;
      reg.spots.forEach(s => {
        const isLocked = currUnlock < (s.unlock || 0);
        html += `<div class="map-card ${isLocked?'locked':''}" data-id="${s.id}">
          <div class="map-card-name">${s.name}</div><div class="map-card-desc">${isLocked ? '尚未解锁' : s.desc}</div>
        </div>`;
      });
      html += `</div>`;
    });
    main.innerHTML = html;
    
    main.querySelectorAll('.map-card:not(.locked)').forEach(card => {
      card.onclick = () => {
        const id = card.dataset.id;
        if (id === 'reception') openCharMenu();
        else if (id === 'tavern') window.startPourGame && window.startPourGame();
        else if (id === 'archive') window.startEvidenceGame && window.startEvidenceGame();
        else if (id === 'church') window.startPuzzleGame && window.startPuzzleGame();
        else if (id === 'chess') window.startChessGame && window.startChessGame();
        else if (SCENES[id]) NF.playScene(id);
        else NF.toast('此处暂无内容', 'warn');
      };
    });
  };

  function openCharMenu() {
    let html = '<div class="char-grid">';
    Object.keys(CHARS).forEach(id => {
      const c = CHARS[id]; const aff = NF.state.affection[id] || 0; 
      const lv = LEVELS.find(l => aff >= l.min && aff <= l.max)?.name || '陌生';
      html += `<div class="char-card" data-id="${id}">
        <div class="char-head"><div class="char-avatar">${c.sym}</div><div>
          <div class="char-name">${c.name}</div><div style="font-size:11px;color:var(--text-d);">${c.en}</div>
          <div style="font-size:10px;color:var(--gold-d);margin-top:4px;">好感度: ${aff} · ${lv}</div>
        </div></div><div class="aff-bar"><div class="aff-fill" style="width:${aff}%"></div></div>
      </div>`;
    });
    html += '</div>';
    const wrap = NF.openModal({ title: '会 客 室', body: html });
    wrap.querySelectorAll('.char-card').forEach(card => {
      card.onclick = () => { wrap.remove(); openCharDetail(card.dataset.id); };
    });
  }

  function openCharDetail(id) {
    const c = CHARS[id]; const aff = NF.state.affection[id] || 0;
    const canDeep = aff >= 10; const canCG = aff >= 30;
    
    const wrap = NF.openModal({
      title: c.name,
      body: `<div style="text-align:center;margin-bottom:16px;"><div class="char-avatar" style="margin:0 auto 10px;width:60px;height:60px;font-size:30px;">${c.sym}</div><div style="font-size:11px;color:var(--text-d);margin-top:4px;line-height:1.6;">${c.desc}</div></div>`,
      footHTML: `<button class="btn ghost" id="bChat">闲 聊</button><button class="btn" id="bDeep" ${canDeep?'':'disabled'}>深 谈</button><button class="btn" id="bGift">送 礼</button>${canCG ? '<button class="btn primary" id="bCG">解锁专属CG</button>' : ''}`,
      onMount: (w) => {
        w.querySelector('#bChat').onclick = () => { w.remove(); startInteract(id, 'chat'); };
        if (canDeep) w.querySelector('#bDeep').onclick = () => { w.remove(); startInteract(id, 'deep'); };
        w.querySelector('#bGift').onclick = () => { w.remove(); openGiftUI(id); };
        if (canCG) w.querySelector('#bCG').onclick = () => { w.remove(); startInteract(id, 'cg'); };
      }
    });
  }

  function startInteract(id, mode) {
    const c = CHARS[id];
    const customKey = `custom_interact_${id}_${mode}`;
    let sceneId = '';
    
    if (SCENES[customKey]) { sceneId = customKey; } 
    else {
      sceneId = `default_${mode}_${id}`;
      if (!SCENES[sceneId]) {
        let lines = [];
        const isMale = NF.state.player.gender === '男';
        const isFemale = NF.state.player.gender === '女';
        let cashCall = isMale ? "man" : (isFemale ? "doll" : "buddy");
        let cashCallCn = isMale ? "老兄" : (isFemale ? "小丫头" : "伙计");

        if (mode === 'chat') {
          if (id === 'cash') {
            lines = [
              { t: 'd', who: id, en: `Need something, ${cashCall}?`, cn: `「有事吗，${cashCallCn}？」` },
              { t: 'me', cn: '（只是随便看看……）' }
            ];
          } else {
            lines = [
              { t: 'd', who: id, en: "Need something?", cn: '「有事吗？」' },
              { t: 'me', cn: '（只是随便看看……）' }
            ];
          }
        } else if (mode === 'deep') {
          if (id === 'cash') {
            lines = [
              { t: 'd', who: id, en: "You actually care about this stuff, huh?", cn: '「你还真在意这些事啊。」' },
              { t: 'd', who: id, en: "Most people don't even look me in the eye.", cn: '「大多数人甚至不敢看我的眼睛。」' }
            ];
          } else {
            lines = [
              { t: 'd', who: id, en: "You actually care about this stuff, huh?", cn: '「你还真在意这些事啊。」' }
            ];
          }
        } else if (mode === 'cg') {
          lines = [{ t: 'n', cn: `【专属CG】在隐秘的角落，你看到了只属于你们的一幕。` }];
        }
        SCENES[sceneId] = { bg: 'manor', loc: '会客室 · ' + c.name, lines: lines };
      }
    }
    
    SCENES[sceneId].onEnd = () => {
      let gain = mode==='chat' ? 3 : (mode==='deep' ? 10 : 20);
      NF.state.affection[id] = (NF.state.affection[id] || 0) + gain;
      const oldLv = LEVELS.find(l => (NF.state.affection[id] - gain) >= l.min && (NF.state.affection[id] - gain) <= l.max);
      const newLv = LEVELS.find(l => NF.state.affection[id] >= l.min && NF.state.affection[id] <= l.max);
      if (newLv.name !== oldLv.name) showLevelUp(newLv.name);
      NF.toast(`◈ ${c.name} 好感度 +${gain}`, 'ok'); NF.showScreen('map');
    };
    NF.playScene(sceneId);
  }

  function openGiftUI(id) {
    const c = CHARS[id]; 
    let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';
    GIFTS.forEach(g => { 
      html += `<button class="btn ghost gift-btn" data-id="${g.id}" style="display:flex;flex-direction:column;align-items:center;padding:15px;height:auto;"><span style="font-size:24px;margin-bottom:5px;">${g.icon}</span><span>${g.name}</span></button>`; 
    });
    html += '</div>';
    
    const wrap = NF.openModal({
      title: '赠 礼 给 ' + c.name, body: html,
      onMount: (w) => {
        w.querySelectorAll('.gift-btn').forEach(btn => {
          btn.onclick = () => {
            const g = GIFTS.find(x => x.id === btn.dataset.id); w.remove();
            let gain = 2; 
            let replyEn = c.dislikeEn || "Thanks. I guess.";
            let replyCn = c.dislikeCn || '「谢了。大概吧。」';

            if (g.tags.some(t => c.likes.includes(t))) {
              gain = 15; 
              if (id === 'cash') {
                const isMale = NF.state.player.gender === '男';
                replyEn = isMale ? "Oh sweet! You're a lifesaver, man. I owe you one." : "Oh sweet! You're a lifesaver, doll. I owe you one.";
                replyCn = isMale ? '「哦太棒了！你真是我的救星，老兄。我欠你一次。」' : '「哦太棒了！你真是我的救星，小丫头。我欠你一次。」';
              } else {
                replyEn = c.likesEn || "Whoa, nice. Thanks.";
                replyCn = c.likesCn || '「哇哦，不错。谢了。」';
              }
            }

            SCENES['gift_react'] = {
              bg: 'manor', 
              loc: '会客室', 
              lines: [
                { t: 'n', cn: `你将【${g.name}】送给了 ${c.name}。` }, 
                { t: 'd', who: id, en: replyEn, cn: replyCn }
              ],
              onEnd: () => {
                NF.state.affection[id] = (NF.state.affection[id] || 0) + gain;
                const oldLv = LEVELS.find(l => (NF.state.affection[id] - gain) >= l.min && (NF.state.affection[id] - gain) <= l.max);
                const newLv = LEVELS.find(l => NF.state.affection[id] >= l.min && NF.state.affection[id] <= l.max);
                if (newLv.name !== oldLv.name) showLevelUp(newLv.name);
                NF.toast(`◈ 好感度 +${gain}`, 'ok'); NF.showScreen('map');
              }
            };
            NF.playScene('gift_react');
          };
        });
      }
    });
  }

  function showLevelUp(name) {
    const el = document.createElement('div'); el.className = 'levelup-overlay';
    el.innerHTML = `<div class="levelup-card"><div style="font-size:12px;color:var(--gold-d);margin-bottom:10px;">—— 亲 密 度 提 升 ——</div><div class="lv-name">${name}</div></div>`;
    document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 800); }, 2500);
  }
})();
