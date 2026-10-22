const UI = {
  app: null,
  currentTab: 'map', // 'map' 或 'settings'

  init(){ 
    this.app = document.getElementById('app'); 
    loadSettings(); // 初始化设置
    this.showTitle(); 
  },

  clear(){ this.app.innerHTML = ''; },

  // 统一界面框架
  renderLayout(contentHTML, showNav = true) {
    this.clear();
    const acc = currentAccount();
    
    // 顶部栏
    let topBar = '';
    if(acc && showNav) {
      topBar = `
        <div class="top-bar">
          <div class="user-info">
            <div class="avatar">${acc.avatar}</div>
            <div>
              <div class="user-name">${this.esc(acc.nick)}</div>
              <div class="user-currency">✦ ${acc.currency.silver} 银镑</div>
            </div>
          </div>
        </div>`;
    }

    // 底部导航栏
    let navBar = '';
    if(showNav) {
      navBar = `
        <div class="bottom-nav">
          <div class="nav-item ${this.currentTab==='map'?'active':''}" onclick="UI.switchTab('map')">
            <span class="nav-icon">🗺️</span><span>大陆</span>
          </div>
          <div class="nav-item ${this.currentTab==='settings'?'active':''}" onclick="UI.switchTab('settings')">
            <span class="nav-icon">⚙️</span><span>设置</span>
          </div>
        </div>`;
    }

    this.app.innerHTML = `
      ${topBar}
      <div class="screen-container active" id="mainScreen">
        ${contentHTML}
      </div>
      ${navBar}
    `;
  },

  switchTab(tab) {
    this.currentTab = tab;
    if(tab === 'map') this.showMap();
    else if(tab === 'settings') this.showSettings();
  },

  toast(msg){
    let layer = document.getElementById('toast');
    if(!layer){ layer = document.createElement('div'); layer.id = 'toast'; document.body.appendChild(layer); }
    const el = document.createElement('div');
    el.className = 'toast-msg'; el.textContent = msg;
    layer.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 2000);
  },

  // ================== 页面渲染 ==================

  showTitle(){
    this.renderLayout(`
      <div class="title-wrap" style="height:100%">
        <div class="title-logo">魇境档案</div>
        <div class="title-sub">The Veselian Archive</div>
        <button class="btn btn-primary" onclick="UI.showLogin()">进 入 大 陆</button>
      </div>
    `, false);
  },

  showLogin(){
    const accs = loadAccounts();
    let listHTML = accs.length ? accs.map(a => `
      <div class="sub-chip" style="width:100%;display:flex;justify-content:space-between;margin-bottom:10px" onclick="setCurrentAccount('${a.id}');UI.showMap()">
        <span>${a.avatar} ${this.esc(a.nick)}</span>
        <span style="color:var(--accent)">${this.esc(a.hero.name)}</span>
      </div>
    `).join('') : '<div style="text-align:center;color:var(--text-dim);padding:20px">暂无账号，请创建</div>';

    this.renderLayout(`
      <div class="title-wrap" style="height:100%;justify-content:flex-start;padding-top:40px">
        <h2 style="color:var(--accent);margin-bottom:20px">选 择 账 号</h2>
        <div style="width:100%;max-width:300px">${listHTML}</div>
        <button class="btn" style="margin-top:20px" onclick="UI.showCreate()">创建新账号</button>
      </div>
    `, false);
  },

  showCreate(){
    this.renderLayout(`
      <div style="padding:40px 20px;max-width:400px;margin:0 auto">
        <h2 style="color:var(--accent);text-align:center;margin-bottom:20px">创建新账号</h2>
        <div class="form-group"><label>账号昵称</label><input id="fNick" placeholder="输入昵称"></div>
        <div class="form-group"><label>主控姓名</label><input id="fHero" value="记者"></div>
        <div class="form-group"><label>主控性别</label>
          <select id="fGender"><option>不限</option><option>女</option><option>男</option></select>
        </div>
        <div class="form-group"><label>头像符号</label><input id="fAvatar" value="◈" maxlength="2"></div>
        <button class="btn btn-primary" style="width:100%;margin-top:20px" onclick="UI.doCreate()">开始旅程</button>
      </div>
    `, false);
  },

  doCreate() {
    const nick = document.getElementById('fNick').value || '旅人';
    const hero = document.getElementById('fHero').value || '记者';
    const gender = document.getElementById('fGender').value;
    const avatar = document.getElementById('fAvatar').value || '◈';
    createAccount(nick, hero, gender, avatar);
    this.toast('账号已创建');
    this.showMap();
  },

  showMap(){
    this.renderLayout(`<canvas id="mapCanvas" style="width:100%;height:100%"></canvas>`);
    setTimeout(() => Map.init(document.getElementById('mapCanvas'), loc => this.showLocation(loc)), 50);
  },

  // 豪华设置面板
  showSettings() {
    const s = JSON.parse(localStorage.getItem('veselia_settings_v1'));
    
    this.renderLayout(`
      <div style="padding: 0 20px;">
        <h2 style="color:var(--accent);margin:20px 0;font-weight:normal">设 置</h2>
        
        <div class="setting-item">
          <span class="setting-label">夜间模式</span>
          <div class="setting-action">
            <label class="switch">
              <input type="checkbox" id="setTheme" ${s.theme==='dark'?'checked':''} onchange="UI.changeSetting('theme', this.checked?'dark':'light')">
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="setting-item">
          <span class="setting-label">字号大小</span>
          <div class="setting-action">
            <input type="range" min="0.85" max="1.3" step="0.15" value="${s.fontSize}" onchange="UI.changeSetting('fontSize', this.value)">
          </div>
        </div>

        <div class="setting-item">
          <span class="setting-label">背景音乐</span>
          <div class="setting-action">
            <label class="switch">
              <input type="checkbox" ${s.bgm?'checked':''} onchange="UI.changeSetting('bgm', this.checked)">
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="setting-item">
          <span class="setting-label">游戏音效</span>
          <div class="setting-action">
            <label class="switch">
              <input type="checkbox" ${s.sfx?'checked':''} onchange="UI.changeSetting('sfx', this.checked)">
              <span class="slider"></span>
            </label>
          </div>
        </div>
        
        <div style="margin-top:40px;text-align:center">
          <button class="btn" style="width:100%;border-color:var(--text-dim);color:var(--text-dim)" onclick="logout();UI.showTitle()">退出当前账号</button>
        </div>
      </div>
    `);
  },

  changeSetting(key, val) {
    let s = JSON.parse(localStorage.getItem('veselia_settings_v1'));
    s[key] = val;
    saveSettings(s);
  },

  // ================== 地点弹窗 ==================
  showLocation(loc) {
    const acc = currentAccount();
    if(!loc) return;

    let subHTML = '';
    if(loc.subs && loc.subs.length){
      subHTML = '<div class="sub-loc-list">' + loc.subs.map(sub => {
        const unlocked = sub.unlocked !== false;
        return `<div class="sub-chip ${unlocked ? '' : 'locked'}" onclick="UI.showSubLocation('${loc.id}','${sub.id}')">${this.esc(sub.name)}</div>`;
      }).join('') + '</div>';
    }

    if(loc.unlocked === false){
      const mystery = (loc.mystery || ['此处尚不可入。']).map(p => `<p>${this.esc(p)}</p>`).join('');
      this.openModal(loc.name, `
        <div class="loc-title">${this.esc(loc.name)}</div>
        <div class="loc-en">${this.esc(loc.en || '')}</div>
        <div class="loc-desc mystery">${mystery}</div>
      `);
      return;
    }

    const desc = loc.desc || '你站在这里，看着四周。';
    const descHTML = desc.split('\n').map(p => `<p>${this.esc(p)}</p>`).join('');

    this.openModal(loc.name, `
      <div class="loc-title">${this.esc(loc.name)}</div>
      <div class="loc-en">${this.esc(loc.en || '')}</div>
      <div class="loc-desc">${descHTML}</div>
      ${subHTML}
    `);
  },

  showSubLocation(parentId, subId) {
    this.closeModal();
    
    // 如果是酒馆，直接触发阶段一的英式对话测试！
    if(subId === 'tavern') {
      this.startDialog('塔瓦娜·卡伊', 'Tavana Kai', "I am afraid you have caught me at an inconvenient hour, my dear correspondent. The fire in the hearth is yet to catch.", "恐怕您来得不是时候，我亲爱的记者。壁炉里的火还没生起来呢。");
      return;
    }

    // 其他子地点暂且弹卡片
    setTimeout(() => {
      this.openModal("探索", `
        <div class="loc-desc" style="text-align:center;color:var(--text-dim)">
          <p>这里还未发生什么值得记录的故事。</p>
          <p>也许在未来的更新中，你会在这里遇见某个人。</p>
        </div>
      `);
    }, 300);
  },

  startDialog(speaker, enName, enText, cnText) {
    this.openModal("日不落酒馆 · 对话", `
      <div class="dialog-box">
        <div>
          <div class="dialog-speaker">${speaker} <span style="font-family:var(--f-en);font-style:italic;font-size:0.8rem;color:var(--text-dim)">${enName}</span></div>
          <div class="dialog-en">"${enText}"</div>
          <div class="dialog-cn">「${cnText}」</div>
        </div>
      </div>
    `, [{ text: '结束对话', act: () => this.closeModal(), primary: true }]);
  },

  // ================== 通用 Modal ==================
  openModal(title, bodyHTML, buttons) {
    this.closeModal();
    const ov = document.createElement('div');
    ov.className = 'overlay show';
    ov.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">${this.esc(title)}</div>
          <button class="modal-close" onclick="UI.closeModal()">×</button>
        </div>
        <div class="modal-body">${bodyHTML}</div>
        ${buttons ? '<div class="modal-footer"></div>' : ''}
      </div>`;
    document.body.appendChild(ov);
    
    if(buttons){
      const foot = ov.querySelector('.modal-footer');
      buttons.forEach(b => {
        const btn = document.createElement('button');
        btn.className = 'btn ' + (b.primary ? 'btn-primary' : '');
        btn.textContent = b.text;
        btn.onclick = b.act;
        btn.style.marginBottom = '0';
        foot.appendChild(btn);
      });
    }
  },
  closeModal(){
    document.querySelectorAll('.overlay.show').forEach(o => o.remove());
  },

  esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }
};
