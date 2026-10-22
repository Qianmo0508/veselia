// 界面渲染
const UI = {
  app: null,
  init(){ this.app = document.getElementById('app'); this.showTitle(); },

  clear(){ this.app.innerHTML = ''; },
  screen(cls){
    const el = document.createElement('div');
    el.className = 'screen active ' + (cls || '');
    this.app.appendChild(el);
    return el;
  },

  toast(msg){
    let layer = document.getElementById('toast');
    if(!layer){ layer = document.createElement('div'); layer.id = 'toast'; document.body.appendChild(layer); }
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    layer.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 320); }, 2200);
  },

  showTitle(){
    this.clear();
    const s = this.screen('title');
    s.innerHTML = `
      <div class="center-wrap">
        <div class="card">
          <div class="t-sub">VESELIA · NIGHTMARE</div>
          <h1 class="t-main">魇境档案</h1>
          <div class="t-en">The Veselian Archive</div>
          <div class="t-div"><span></span><em>◈</em><span></span></div>
          <div class="menu">
            <button class="btn primary" id="btnPlay">进 入 大 陆</button>
            <button class="btn ghost" id="btnAbout">关 于 本 作</button>
          </div>
          <div style="margin-top:22px;font-size:10px;letter-spacing:.28em;color:var(--faint)">以醒为誓，以眠为敌</div>
        </div>
      </div>`;
    s.querySelector('#btnPlay').onclick = () => this.showLogin();
    s.querySelector('#btnAbout').onclick = () => this.showAbout();
  },

  showAbout(){
    this.openModal('关 于 本 作', `
      <p style="line-height:2;font-size:13px;color:#b8ae9e">
      《魇境档案》是一部以维塞利亚大陆为舞台的文字冒险。<br><br>
      你是来自王翼国度的记者，奉命调查笼罩大陆的「魇」事件。<br>
      在索姆尼亚与王翼之间，在梦目院与萨克拉教会之间，你会遇见一些人，也会失去一些人。<br><br>
      ◆ 点击地图上的地点进入<br>
      ◆ 与角色闲聊、深谈、邀约<br>
      ◆ 接取魇境任务，进入梦域<br>
      ◆ 你的选择会被记住
      </p>`, [{ text:'关闭', act:() => this.closeModal() }]);
  },

  showLogin(){
    this.clear();
    const s = this.screen('login');
    const accs = loadAccounts();
    const listHTML = accs.length ? accs.map(a => `
      <div class="acc-item" data-id="${a.id}">
        <div class="acc-avatar">${a.avatar || '◈'}</div>
        <div class="acc-info">
          <div class="acc-name">${this.esc(a.nick)}</div>
          <div class="acc-meta">主控：${this.esc(a.hero.name)} · 银镑 ${a.currency.silver}</div>
        </div>
      </div>`).join('') : '<div style="text-align:center;font-size:12px;color:var(--faint);padding:16px 0">尚无账号</div>';

    s.innerHTML = `
      <div class="center-wrap">
        <div class="card">
          <div class="t-sub">ACCOUNT</div>
          <h2 class="t-main" style="font-size:24px">选 择 账 号</h2>
          <div class="t-en">Select your account</div>
          <div class="acc-list">${listHTML}</div>
          <div class="menu" style="margin-top:18px">
            <button class="btn primary" id="btnNew">创 建 新 账 号</button>
            <button class="btn ghost" id="btnBack">返 回 标 题</button>
          </div>
        </div>
      </div>`;

    s.querySelectorAll('.acc-item').forEach(el => {
      el.onclick = () => {
        setCurrentAccount(el.dataset.id);
        this.showMap();
      };
    });
    s.querySelector('#btnNew').onclick = () => this.showCreate();
    s.querySelector('#btnBack').onclick = () => this.showTitle();
  },

  showCreate(){
    this.clear();
    const s = this.screen('create');
    s.innerHTML = `
      <div class="center-wrap">
        <div class="card">
          <div class="t-sub">NEW ACCOUNT</div>
          <h2 class="t-main" style="font-size:24px">创 建 账 号</h2>
          <div class="t-en">Begin a new record</div>
          <div style="text-align:left;margin-top:20px">
            <div class="field"><label>账号昵称</label>
              <input id="fNick" maxlength="12" placeholder="旅人">
            </div>
            <div class="field"><label>主控姓名</label>
              <input id="fHero" maxlength="10" placeholder="记者" value="记者">
              <div class="hint">默认「记者」，可改</div>
            </div>
            <div class="field"><label>主控性别</label>
              <select id="fGender">
                <option value="不限">不限</option>
                <option value="女">女</option>
                <option value="男">男</option>
              </select>
            </div>
            <div class="field"><label>头像符号</label>
              <input id="fAvatar" maxlength="2" value="◈" placeholder="◈">
              <div class="hint">单字/符号，如 ◈ ✦ ◆ ❖ ✧</div>
            </div>
          </div>
          <div class="menu" style="margin-top:10px">
            <button class="btn primary" id="btnCreate">开 始</button>
            <button class="btn ghost" id="btnCancel">取 消</button>
          </div>
        </div>
      </div>`;

    s.querySelector('#btnCreate').onclick = () => {
      const nick = s.querySelector('#fNick').value.trim() || '旅人';
      const hero = s.querySelector('#fHero').value.trim() || '记者';
      const gender = s.querySelector('#fGender').value;
      const avatar = s.querySelector('#fAvatar').value.trim() || '◈';
      createAccount(nick, hero, gender, avatar);
      this.toast('账号已创建');
      this.showMap();
    };
    s.querySelector('#btnCancel').onclick = () => this.showLogin();
  },

  showMap(){
    this.clear();
    const acc = currentAccount();
    if(!acc){ this.showLogin(); return; }

    const s = this.screen('map');
    s.innerHTML = `
      <div class="bar">
        <div class="bar-l"><div class="bar-mark"></div>
          <div class="bar-t">维塞利亚大陆</div>
        </div>
        <div class="bar-r">
          <button class="bar-btn" data-act="settings">设置</button>
          <button class="bar-btn" data-act="logout">登出</button>
        </div>
      </div>
      <div class="status">
        <div class="stat">主控 <b>${this.esc(acc.hero.name)}</b></div>
        <div class="stat">✦ 银镑 <b>${acc.currency.silver}</b></div>
        <div class="stat" style="margin-left:auto">${this.esc(acc.nick)}</div>
      </div>
      <div class="map-wrap">
        <canvas id="mapCanvas"></canvas>
        <div class="map-hint">点击地点 · 双指缩放</div>
      </div>`;

    s.querySelectorAll('[data-act]').forEach(b => {
      b.onclick = () => {
        const a = b.dataset.act;
        if(a === 'settings') this.showSettings();
        else if(a === 'logout'){ logout(); this.showTitle(); }
      };
    });

    setTimeout(() => Map.init(s.querySelector('#mapCanvas'), loc => this.showLocation(loc)), 60);
  },

  showLocation(loc){
    const acc = currentAccount();
    if(!loc || !acc) return;

    // 子地点
    let subHTML = '';
    if(loc.subs && loc.subs.length){
      subHTML = '<div class="loc-sub">' + loc.subs.map(sub => {
        const unlocked = sub.unlocked !== false;
        return `<div class="chip ${unlocked ? '' : 'locked'}" data-sub="${sub.id}">${this.esc(sub.name)}</div>`;
      }).join('') + '</div>';
    }

    // 锁住的地点：迷雾文案
    if(loc.unlocked === false){
      const mystery = (loc.mystery || ['此处尚不可入。']).map(p => `<p>${this.esc(p)}</p>`).join('');
      this.openModal(loc.name, `
        <div class="loc-badge">${this.esc(loc.type || '地点')} · 未探索</div>
        <div class="loc-title">${this.esc(loc.name)}</div>
        <div class="loc-en">${this.esc(loc.en || '')}</div>
        <div class="loc-desc mystery">${mystery}</div>
        <div class="loc-lock">—— 此处尚不可入 ——</div>
      `, [{ text:'离开', act:() => this.closeModal() }]);
      return;
    }

    // 已解锁
    const desc = loc.desc || '你站在这里，看着四周。';
    const descHTML = desc.split('\n').map(p => `<p>${this.esc(p)}</p>`).join('');

    this.openModal(loc.name, `
      <div class="loc-badge">${this.esc(loc.type || '地点')}</div>
      <div class="loc-title">${this.esc(loc.name)}</div>
      <div class="loc-en">${this.esc(loc.en || '')}</div>
      <div class="loc-desc">${descHTML}</div>
      ${subHTML}
    `, [{ text:'离开', act:() => this.closeModal() }], (body) => {
      body.querySelectorAll('.loc-sub .chip').forEach(chip => {
        chip.onclick = () => {
          const subId = chip.dataset.sub;
          const sub = (loc.subs || []).find(x => x.id === subId);
          if(!sub) return;
          this.closeModal();
          setTimeout(() => this.showLocation({
            ...sub,
            type: '子地点',
            parent: loc.id
          }), 180);
        };
      });
    });

    // 记录访问
    if(!acc.progress.visited.includes(loc.id)){
      acc.progress.visited.push(loc.id);
      saveAccount(acc);
    }
  },

  showSettings(){
    const acc = currentAccount();
    if(!acc) return;
    this.openModal('设 置', `
      <div class="field"><label>账号昵称</label>
        <input id="sNick" maxlength="12" value="${this.esc(acc.nick)}">
      </div>
      <div class="field"><label>主控姓名</label>
        <input id="sHero" maxlength="10" value="${this.esc(acc.hero.name)}">
      </div>
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(201,169,97,.12);font-size:11px;color:var(--faint);line-height:1.9">
        银镑：${acc.currency.silver}<br>
        已访问地点：${acc.progress.visited.length}<br>
        账号创建于：${new Date(acc.createdAt).toLocaleDateString()}
      </div>
    `, [
      { text:'保存', primary:true, act:() => {
        const nick = document.getElementById('sNick').value.trim() || acc.nick;
        const hero = document.getElementById('sHero').value.trim() || acc.hero.name;
        acc.nick = nick; acc.hero.name = hero;
        saveAccount(acc);
        this.closeModal();
        this.toast('已保存');
        this.showMap();
      }},
      { text:'关闭', act:() => this.closeModal() }
    ]);
  },

  // 通用弹窗
  openModal(title, bodyHTML, buttons, onMount){
    this.closeModal();
    const ov = document.createElement('div');
    ov.className = 'overlay show';
    ov.innerHTML = `
      <div class="modal">
        <div class="m-head">
          <div class="m-title">${this.esc(title)}</div>
          <button class="m-x">×</button>
        </div>
        <div class="m-body">${bodyHTML}</div>
        ${buttons ? '<div class="m-foot"></div>' : ''}
      </div>`;
    document.body.appendChild(ov);
    ov.querySelector('.m-x').onclick = () => this.closeModal();
    ov.onclick = e => { if(e.target === ov) this.closeModal(); };
    if(buttons){
      const foot = ov.querySelector('.m-foot');
      buttons.forEach(b => {
        const btn = document.createElement('button');
        btn.className = 'btn small ' + (b.primary ? 'primary' : 'ghost');
        btn.textContent = b.text;
        btn.onclick = b.act;
        foot.appendChild(btn);
      });
    }
    if(onMount) onMount(ov.querySelector('.m-body'), ov);
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
