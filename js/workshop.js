window.openWorkshop = function() {
  let currentType = 'main';
  const wrap = NF.openModal({
    title: '万 能 剧 情 工 坊',
    body: `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
        <button class="btn primary type-btn" data-type="main">主线剧情</button>
        <button class="btn ghost type-btn" data-type="dungeon">独立副本</button>
        <button class="btn ghost type-btn" data-type="chat">角色闲聊</button>
        <button class="btn ghost type-btn" data-type="deep">角色深谈</button>
        <button class="btn ghost type-btn" data-type="loc">新地点</button>
      </div>
      <div id="wsFormArea"></div>
    `,
    onMount: (w) => {
      const area = w.querySelector('#wsFormArea');
      const renderForm = () => {
        if (currentType === 'loc') {
          area.innerHTML = `
            <div style="font-size:12px;color:var(--gold-d);margin-bottom:8px;">地点名称</div><input class="inp" id="wLoc">
            <div style="font-size:12px;color:var(--gold-d);margin-bottom:8px;">描述</div><input class="inp" id="wDesc">
            <button class="btn primary" id="saveLoc" style="width:100%;margin-top:10px;">添加至地图</button>`;
          area.querySelector('#saveLoc').onclick = () => {
            const name = area.querySelector('#wLoc').value, desc = area.querySelector('#wDesc').value; if(!name) return NF.toast('名称不能为空', 'warn');
            let locs = []; try { locs = JSON.parse(localStorage.getItem('nf_locs')||'[]'); } catch(e){}
            locs.push({ id: 'userloc_' + Date.now(), name, desc, unlock: 0 }); localStorage.setItem('nf_locs', JSON.stringify(locs));
            w.remove(); NF.toast('◈ 已加入地图！', 'ok');
          };
        } else {
          let targetHint = '新剧情', charSelect = '';
          if (currentType === 'chat') targetHint = '闲聊内容';
          if (currentType === 'deep') targetHint = '深谈内容';
          if (currentType === 'chat' || currentType === 'deep') {
            charSelect = `<select class="inp" id="wChar">${Object.keys(CHARS).map(k => `<option value="${k}">${CHARS[k].name}</option>`).join('')}</select>`;
          }
          area.innerHTML = `
            <div style="font-size:13px;color:var(--gold-b);margin-bottom:12px;">${targetHint}</div>
            ${charSelect}
            <input class="inp" id="wTitle" placeholder="场景标题（如：酒馆角落）">
            <textarea class="inp" id="wLines" style="height:140px;line-height:1.6;" placeholder="格式：角色名 | 英文 | 中文&#10;旁白直接写中文"></textarea>
            <button class="btn primary" id="saveScene" style="width:100%;">保存内容</button>`;
          area.querySelector('#saveScene').onclick = () => {
            const title = area.querySelector('#wTitle').value || '未知', raw = area.querySelector('#wLines').value.split('\n');
            let lines = [];
            raw.forEach(l => { l = l.trim(); if(!l) return; const p = l.split('|').map(s=>s.trim()); if(p.length>=3) lines.push({t:'d',who:p[0],en:p[1],cn:p[2]}); else lines.push({t:'n',cn:l}); });
            if(!lines.length) return NF.toast('对话不能为空','warn');
            const newId = 'user_' + Date.now();
            if (currentType === 'chat' || currentType === 'deep') { SCENES[`custom_interact_${area.querySelector('#wChar').value}_${currentType}`] = { bg: 'manor', loc: title, lines }; NF.toast('角色剧情已更新'); }
            else { SCENES[newId] = { bg: currentType==='dungeon'?'dream':'city', loc: title, lines, onEnd: () => NF.showScreen('map') }; NF.toast('剧情已保存，目录可见'); }
            w.remove();
          };
        }
      };
      w.querySelectorAll('.type-btn').forEach(btn => {
        btn.onclick = () => { currentType = btn.dataset.type; w.querySelectorAll('.type-btn').forEach(b => { b.className = 'btn ' + (b.dataset.type === currentType ? 'primary' : 'ghost') + ' type-btn'; }); renderForm(); };
      });
      renderForm();
    }
  });
};
