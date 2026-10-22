const UI = {
  app: null, currentTab: 'home', typingTimer: null,
  init(){ 
    this.app = document.getElementById('app'); loadSettings(); AudioEngine.init(); 
    document.addEventListener('pointerdown', (e) => {
      if(e.target.closest('.btn') || e.target.closest('.nav-item') || e.target.closest('.sub-chip') || e.target.closest('.char-card')) AudioEngine.playClick();
    });
    this.showTitle(); 
  },
  clear(){ this.app.innerHTML = ''; },
  renderLayout(contentHTML, showNav = true) {
    this.clear();
    const acc = currentAccount();
    let topBar = '';
    if(acc && showNav) {
      topBar = `
        <div class="top-bar">
          <div class="user-info">
            <div class="avatar">${acc.avatar}</div>
            <div>
              <div class="user-name">${this.esc(acc.hero.name)}</div>
              <div class="user-currency">✦ ${acc.currency.silver} 银镑</div>
            </div>
          </div>
        </div>`;
    }
    let navBar = '';
    if(showNav) {
      navBar = `
        <div class="bottom-nav">
          <div class="nav-item ${this.currentTab==='home'?'active':''}" onclick="UI.switchTab('home')"><span class="nav-icon">🏛️</span><span>主页</span></div>
          <div class="nav-item ${this.currentTab==='map'?'active':''}" onclick="UI.switchTab('map')"><span class="nav-icon">🗺️</span><span>大陆</span></div>
          <div class="nav-item ${this.currentTab==='log'?'active':''}" onclick="UI.switchTab('log')"><span class="nav-icon">📖</span><span>记录</span></div>
          <div class="nav-item ${this.currentTab==='settings'?'active':''}" onclick="UI.switchTab('settings')"><span class="nav-icon">⚙️</span><span>设置</span></div>
        </div>`;
    }
    this.app.innerHTML = `${topBar}<div class="screen-container active" id="mainScreen" style="overflow-y:auto;">${contentHTML}</div>${navBar}`;
  },
  getLocNameById(id) {
    for(let loc of WORLD.locations) {
      if(loc.id === id) return loc.name;
      if(loc.subs) { for(let sub of loc.subs) if(sub.id === id) return sub.name; }
    }
    return '未知之地';
  },
  switchTab(tab) {
    this.currentTab = tab; AudioEngine.playPage();
    if(tab === 'map') this.showMap();
    else if(tab === 'settings') this.showSettings();
    else if(tab === 'log') this.showLog();
    else this.showHome();
  },
  toast(msg){ let layer = document.getElementById('toast'); if(!layer){ layer = document.createElement('div'); layer.id = 'toast'; document.body.appendChild(layer); } const el = document.createElement('div'); el.className = 'toast-msg'; el.textContent = msg; layer.appendChild(el); setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 2000); },
  showTitle(){
    this.renderLayout(`<div class="title-wrap" style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--panel-bg)"><div class="title-logo">入魇</div><div class="title-sub">Nightfalling</div><button class="btn btn-primary" onclick="UI.showLogin()">进 入 大 陆</button></div>`, false);
  },
  showLogin(){
    const accs = loadAccounts();
    let listHTML = accs.length ? accs.map(a => `<div class="sub-chip" style="width:100%;display:flex;flex-direction:column;gap:4px;margin-bottom:10px;padding:15px;" onclick="setCurrentAccount('${a.id}');UI.showHome()"><div style="display:flex;justify-content:space-between;width:100%"><span style="font-size:1.1rem;font-weight:bold">${a.avatar} ${this.esc(a.nick)}</span><span style="color:var(--accent)">主控: ${this.esc(a.hero.name)}</span></div><div style="font-size:0.8rem;color:var(--text-dim);text-align:left;">上次在线：${this.getLocNameById(a.progress.currentLoc)}</div></div>`).join('') : '<div style="text-align:center;color:var(--text-dim);padding:20px">暂无账号</div>';
    this.renderLayout(`<div style="height:100%;display:flex;flex-direction:column;align-items:center;padding-top:60px"><h2 style="color:var(--accent);margin-bottom:20px;font-family:var(--f-en)">Select Archive</h2><div style="width:100%;max-width:340px">${listHTML}</div><button class="btn" style="margin-top:20px" onclick="UI.showCreate()">创建新账号</button></div>`, false);
  },
  showCreate(){ this.renderLayout(`<div style="padding:40px 20px;max-width:400px;margin:0 auto"><h2 style="color:var(--accent);text-align:center;margin-bottom:20px">创建新账号</h2><div class="form-group"><label>账号昵称</label><input id="fNick" placeholder="输入昵称"></div><div class="form-group"><label>主控姓名</label><input id="fHero" value="记者"></div><div class="form-group"><label>主控性别</label><select id="fGender"><option>不限</option><option>女</option><option>男</option></select></div><div class="form-group"><label>头像符号</label><input id="fAvatar" value="◈" maxlength="2"></div><button class="btn btn-primary" style="width:100%;margin-top:20px" onclick="UI.doCreate()">开始旅程</button></div>`, false); },
  doCreate() { const nick = document.getElementById('fNick').value || '旅人'; const hero = document.getElementById('fHero').value || '记者'; const gender = document.getElementById('fGender').value; const avatar = document.getElementById('fAvatar').value || '◈'; createAccount(nick, hero, gender, avatar); this.toast('账号已创建'); this.showHome(); },
  
  showHome(){
    const acc = currentAccount(); if(!acc) return;
    const d = new Date(); const timeStr = d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
    this.renderLayout(`
      <div class="home-container">
        <div class="home-clock">${timeStr}</div>
        <div class="home-date">${d.toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})}</div>
        <div class="home-quest">
          <h3>当前目标 · Objective</h3>
          <p>你目前身在 <b style="color:var(--accent)">${this.getLocNameById(acc.progress.currentLoc)}</b>。<br>请前往【大陆】地图，收集关于“封印松动”的线索，或前往日不落酒馆寻找梦目院的同伴。</p>
          <div style="margin-top:15px;font-size:0.8rem;color:var(--text-dim);font-family:var(--f-en);font-style:italic;">"The nightmare awaits."</div>
        </div>
      </div>
    `);
  },

  showMap(){
    this.renderLayout(`<canvas id="mapCanvas" style="width:100%;height:100%;background:transparent;touch-action:none;"></canvas>`);
    setTimeout(() => Map.init(document.getElementById('mapCanvas'), loc => this.showLocation(loc)), 50);
  },
  showLog() {
    const acc = currentAccount(); const logs = acc.progress.chatLogs; let html = '<div style="padding:20px;">'; let hasLogs = false;
    for(let charId in logs) {
      hasLogs = true; const charData = CHARACTERS.find(c => c.id === charId) || {name: charId};
      html += `<h3 style="color:var(--accent);margin:15px 0 10px;font-size:1rem;border-bottom:1px solid var(--border);padding-bottom:5px;">与 ${charData.name} 的记忆</h3>`;
      logs[charId].forEach(log => { html += `<div style="font-size:0.9rem;color:var(--text-dim);margin-bottom:8px;line-height:1.6;">「${log.text}」</div>`; });
    }
    if(!hasLogs) html += '<div style="text-align:center;color:var(--text-dim);margin-top:50px;">尚无记忆</div>';
    html += '</div>'; this.renderLayout(html);
  },
  showSettings() {
    const acc = currentAccount(); if(!acc) return; const s = JSON.parse(localStorage.getItem('veselia_set_v1'));
    this.renderLayout(`
      <div style="padding: 20px; max-width: 500px; margin: 0 auto;">
        <div class="settings-group"><h3>账号与角色</h3>
          <div class="setting-item"><span class="setting-label">账号昵称</span><input type="text" class="setting-input" value="${this.esc(acc.nick)}" onchange="UI.saveProfile('nick', this.value)"></div>
          <div class="setting-item"><span class="setting-label">主控姓名</span><input type="text" class="setting-input" value="${this.esc(acc.hero.name)}" onchange="UI.saveProfile('hero', this.value)"></div>
          <div class="setting-item"><span class="setting-label">头像符号</span><input type="text" class="setting-input" style="width:40px;font-size:1.2rem;" maxlength="2" value="${this.esc(acc.avatar)}" onchange="UI.saveProfile('avatar', this.value)"></div>
        </div>
        <div class="settings-group"><h3>画面设置</h3>
          <div class="setting-item"><span class="setting-label">夜间模式</span><label class="switch"><input type="checkbox" ${s.theme==='dark'?'checked':''} onchange="UI.changeSetting('theme', this.checked?'dark':'light')"><span class="slider"></span></label></div>
          <div class="setting-item"><span class="setting-label">字号大小</span><input type="range" min="0.85" max="1.3" step="0.15" value="${s.fontSize}" onchange="UI.changeSetting('fontSize', this.value)"></div>
        </div>
        <div class="settings-group"><h3>声音设置</h3>
          <div class="setting-item"><span class="setting-label">背景音乐 (预留)</span><label class="switch"><input type="checkbox" ${s.bgmOn?'checked':''} onchange="UI.changeSetting('bgmOn', this.checked)"><span class="slider"></span></label></div>
          <div class="setting-item"><span class="setting-label">音乐音量</span><input type="range" min="0" max="100" value="${s.bgmVol}" onchange="UI.changeSetting('bgmVol', this.value)"></div>
          <div class="setting-item"><span class="setting-label">合成音效</span><label class="switch"><input type="checkbox" ${s.sfxOn?'checked':''} onchange="UI.changeSetting('sfxOn', this.checked)"><span class="slider"></span></label></div>
          <div class="setting-item"><span class="setting-label">音效音量</span><input type="range" min="0" max="100" value="${s.sfxVol}" onchange="UI.changeSetting('sfxVol', this.value)"></div>
        </div>
        <div class="settings-group"><h3>游戏与剧情</h3>
          <div class="setting-item"><span class="setting-label">文字速度</span><select class="setting-input" onchange="UI.changeSetting('textSpeed', Number(this.value))"><option value="60" ${s.textSpeed==60?'selected':''}>慢</option><option value="30" ${s.textSpeed==30?'selected':''}>中</option><option value="10" ${s.textSpeed==10?'selected':''}>快</option><option value="0" ${s.textSpeed==0?'selected':''}>瞬间</option></select></div>
        </div>
        <div style="margin-top:30px;text-align:center"><button class="btn" style="width:100%;border-color:var(--text-dim);color:var(--text-dim)" onclick="logout();UI.showTitle()">返回标题</button></div>
      </div>
    `);
  },
  saveProfile(key, val) { const acc = currentAccount(); if(!acc) return; if(key === 'nick') acc.nick = val || '旅人'; if(key === 'hero') acc.hero.name = val || '记者'; if(key === 'avatar') acc.avatar = val || '◈'; saveAccount(acc); this.toast('已更新'); this.showSettings(); },
  changeSetting(key, val) { let s = JSON.parse(localStorage.getItem('veselia_set_v1')); s[key] = val; saveSettings(s); if(key === 'theme') { if(document.getElementById('mapCanvas')) Map.draw(); this.showSettings(); } if(key === 'sfxOn') AudioEngine.playClick(); },
  showLocation(loc) {
    if(!loc) return; updateLocation(loc.id);
    if(loc.unlocked === false){ const mystery = (loc.mystery || ['此处尚不可入。']).map(p => `<p>${this.esc(p)}</p>`).join(''); this.openModal(loc.name, `<div class="loc-title">${this.esc(loc.name)}</div><div class="loc-en">${this.esc(loc.en || '')}</div><div class="loc-desc mystery">${mystery}</div>`); return; }
    if(loc.id === 'tavern') {
      const acc = currentAccount(); const aff = acc.progress.affection;
      const getAffIcon = (id) => { const val = aff[id] || 0; if(val >= 30) return '★'; if(val >= 20) return '●'; if(val >= 10) return '◐'; return '○'; };
      this.openModal("日不落酒馆", `
        <div class="loc-desc" style="text-align:center;"><p>壁炉里的火正烧到第三块柴。你推开门，几双眼睛看了过来。</p></div>
        <div class="char-grid">
          <div class="char-card" onclick="UI.startDialog('tavana')"><div class="char-avatar">👑</div><div class="char-name">塔瓦娜</div><div class="char-role" style="color:var(--accent)">${getAffIcon('tavana')}</div></div>
          <div class="char-card" onclick="UI.startDialog('mauvia')"><div class="char-avatar">🦅</div><div class="char-name">莫维奥娅</div><div class="char-role" style="color:var(--accent)">${getAffIcon('mauvia')}</div></div>
          <div class="char-card" onclick="UI.startDialog('lydia')"><div class="char-avatar">📜</div><div class="char-name">莉迪亚</div><div class="char-role" style="color:var(--accent)">${getAffIcon('lydia')}</div></div>
          <div class="char-card" onclick="UI.startDialog('elsia')"><div class="char-avatar">🗡️</div><div class="char-name">艾尔丝娅</div><div class="char-role" style="color:var(--accent)">${getAffIcon('elsia')}</div></div>
          <div class="char-card" onclick="UI.startDialog('fiman')"><div class="char-avatar">🍷</div><div class="char-name">菲曼</div><div class="char-role" style="color:var(--accent)">${getAffIcon('fiman')}</div></div>
          <div class="char-card" onclick="UI.startDialog('cash')"><div class="char-avatar">🕶️</div><div class="char-name">卡什</div><div class="char-role" style="color:var(--accent)">${getAffIcon('cash')}</div></div>
        </div>
      `); return;
    }
    const desc = loc.desc || '你站在这里，看着四周。'; const descHTML = desc.split('\n').map(p => `<p>${this.esc(p)}</p>`).join('');
    let subHTML = ''; if(loc.subs && loc.subs.length){ subHTML = '<div class="sub-loc-list">' + loc.subs.map(sub => `<div class="sub-chip" onclick="UI.toast('深层探索即将开放')">${this.esc(sub.name)}</div>`).join('') + '</div>'; }
    this.openModal(loc.name, `<div class="loc-title">${this.esc(loc.name)}</div><div class="loc-en">${this.esc(loc.en || '')}</div><div class="loc-desc">${descHTML}</div>${subHTML}`);
  },
  startDialog(charId) {
    const charData = CHARACTERS.find(c => c.id === charId); if(!charData) return;
    const dialogs = { 'tavana': { en: "I am afraid you have caught me at an inconvenient hour, my dear correspondent. The fire in the hearth is yet to catch.", cn: "恐怕您来得不是时候，我亲爱的记者。壁炉里的火还没生起来呢。" }, 'cash': { en: "Well, well. A new face. Don't tell me you're here to enforce the rules too?", cn: "哟，新面孔。别告诉我你也是来执行那些死板规矩的？" }, 'mauvia': { en: "I have no time for pleasantries. State your business or leave.", cn: "我没空寒暄。有事说事，没事走人。" } };
    const d = dialogs[charId] || { en: "The silence is rather comfortable, isn't it?", cn: "这种沉默，倒也挺舒服的，不是吗？" };
    addMemory(charId, d.cn, 2);
    const s = JSON.parse(localStorage.getItem('veselia_set_v1')); const speed = s.textSpeed;
    this.openModal("交谈 · " + charData.name, `<div class="dialog-box"><div><div class="dialog-speaker">${charData.name} <span style="font-family:var(--f-en);font-style:italic;font-size:0.8rem;color:var(--text-dim)">${charData.en}</span></div><div class="dialog-en" id="type-en"></div><div class="dialog-cn" id="type-cn" style="opacity:0;transition:opacity 0.5s;"></div></div></div>`, [{ text: '结束对话', act: () => { clearTimeout(this.typingTimer); this.closeModal(); this.showLocation({id: 'tavern'}); }, primary: true }]);
    let i = 0, j = 0; const elEn = document.getElementById('type-en'); const elCn = document.getElementById('type-cn');
    if(speed === 0) { elEn.textContent = `"${d.en}"`; elCn.textContent = `「${d.cn}」`; elCn.style.opacity = 1; return; }
    const typeChar = () => { if(i < d.en.length) { elEn.textContent += d.en.charAt(i); i++; this.typingTimer = setTimeout(typeChar, speed); } else { elCn.style.opacity = 1; const typeCn = () => { if(j < d.cn.length) { elCn.textContent += d.cn.charAt(j); j++; this.typingTimer = setTimeout(typeCn, speed); } }; typeCn(); } }; typeChar();
  },
  openModal(title, bodyHTML, buttons) {
    this.closeModal(); const ov = document.createElement('div'); ov.className = 'overlay show';
    ov.innerHTML = `<div class="modal"><div class="modal-header"><div class="modal-title">${this.esc(title)}</div><button class="modal-close" onclick="UI.closeModal()">×</button></div><div class="modal-body">${bodyHTML}</div>${buttons ? '<div class="modal-footer"></div>' : ''}</div>`;
    document.body.appendChild(ov);
    if(buttons){ const foot = ov.querySelector('.modal-footer'); buttons.forEach(b => { const btn = document.createElement('button'); btn.className = 'btn ' + (b.primary ? 'btn-primary' : ''); btn.textContent = b.text; btn.onclick = b.act; btn.style.marginBottom = '0'; foot.appendChild(btn); }); }
  },
  closeModal(){ document.querySelectorAll('.overlay.show').forEach(o => o.remove()); },
  esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
};
