(function() {
  const $ = s => document.querySelector(s);

  window.NF.renderLog = function() {
    const body = $('#logBody'); if (!body) return;
    let html = '<div style="font-family:var(--f-deco);color:var(--gold-b);margin-bottom:12px;">—— 目 录 大 厅 ——</div>';
    Object.keys(SCENES).forEach(k => {
      if (k.startsWith('default_') || k === 'gift_react') return;
      const s = SCENES[k]; let type = k.includes('user_') ? '副本/自定义' : '主线';
      html += `<div class="char-card" style="margin-bottom:10px;"><div style="font-size:14px;color:var(--text);">${s.loc}</div><div style="font-size:10px;color:var(--gold-d);margin-top:4px;">[${type}]</div><button class="btn ghost" style="margin-top:10px;width:100%;" onclick="window.NF.playScene('${k}'); window.NF.showScreen('game');">进入</button></div>`;
    });
    body.innerHTML = html;
  };

  window.NF.renderSettings = function() {
    const main = $('#setMain'); if (!main) return;
    main.innerHTML = `
      <div style="margin-bottom:20px;"><div style="font-size:12px;color:var(--gold-d);margin-bottom:8px;">主控姓名</div><input class="inp" id="setName" value="${NF.state.player.name}"></div>
      <div style="margin-bottom:20px;"><div style="font-size:12px;color:var(--gold-d);margin-bottom:8px;">日夜模式</div>
        <button class="btn ${document.documentElement.getAttribute('data-theme')==='night'?'primary':'ghost'}" onclick="document.documentElement.setAttribute('data-theme','night'); window.NF.renderSettings();">夜间</button>
        <button class="btn ${document.documentElement.getAttribute('data-theme')==='day'?'primary':'ghost'}" onclick="document.documentElement.setAttribute('data-theme','day'); window.NF.renderSettings();">日间</button>
      </div>
    `;
    main.querySelector('#setName').onchange = (e) => { NF.state.player.name = e.target.value; NF.saveGame(); };
  };

  const stage = $('#stage');
  if (stage) {
    stage.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      if ($('#choices').classList.contains('active')) return;
      if (NF.state.screen !== 'game') return;
      advanceLine();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && NF.state.screen === 'game') {
      NF.rewind();
    }
  });
})();
