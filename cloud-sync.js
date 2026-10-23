/* ═══════════════════════════════════════════════════════════
   cloud-sync.js · 终极云账号版（账号恢复 + UID登录 + 免密）
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.NF) { console.error('[cloud-sync] NF 未找到'); return; }
  
  const SUPABASE_URL = 'https://negrtimqwkmlgbcgkxkt.supabase.co'; 
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZ3J0aW1xd2ttbGdiY2dreGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MjE3ODksImV4cCI6MjEwODI5Nzc4OX0.Z6D6JF2N25hbeIPnSNiLjnB7GOBC9ixbWY7U-_pE4Pw';
  const ADMIN_SECRET = 'veselia'; 
  
  const NF = window.NF;
  const API_URL = SUPABASE_URL + '/rest/v1/veselia_sync';

  /* ═══ 工具函数 ═══ */
  const getUidNum = (uidStr) => {
    if (!uidStr) return null;
    const m = uidStr.match(/\d+/);
    return m ? m[0] : null;
  };

  /* 1. 自动恢复账号（解决退出后名字丢失） */
  // 拦截初始化，如果本地有存档，强行把玩家信息拉起来，不需要点继续游戏也能记住你
  setTimeout(() => {
    if (!NF.state()) {
      try {
        const raw = localStorage.getItem('nightfalling_v4_save');
        if (raw) {
          const d = JSON.parse(raw);
          // 强行初始化一个 state 挂载上去
          const s = newState ? newState(d.player?.name || '记者') : {};
          if (s) {
            Object.assign(s, d);
            window.NF.state = () => s; // 劫持读取
            // 因为不能直接改内部变量，我们靠拉取云端来恢复完整状态
          }
        }
      } catch(e){}
    }
  }, 100);

  /* 2. 隐藏 [自定] 标签 */
  const origRenderTOC = NF.renderTOC;
  NF.renderTOC = function() {
    origRenderTOC();
    setTimeout(() => {
      document.querySelectorAll('.toc-item-title').forEach(t => {
        const sp = t.querySelector('span');
        if (sp && sp.textContent.includes('自定')) sp.remove();
      });
    }, 10);
  };

  /* 3. 设置页面注入账号管理 UI */
  const origRenderSettings = NF.renderSettings;
  NF.renderSettings = function() {
    origRenderSettings();
    const main = document.getElementById('setMain');
    if (!main) return;
    
    const s = NF.state();
    const currentUid = s ? s.uid : '（尚未创建角色）';
    const currentName = (s && s.player) ? s.player.name : '（未命名）';
    const isAdmin = localStorage.getItem('veselia_admin_ok') === '1';

    const accGroup = document.createElement('div');
    accGroup.className = 'set-group';
    accGroup.innerHTML = `
      <div class="set-group-head" style="color:var(--gold-b);">账 号 与 云 端</div>
      <div class="set-row">
        <div class="set-label">
          <div class="set-label-t">当前 UID</div>
          <div class="set-label-d">${currentUid}</div>
        </div>
        <div class="set-ctrl">
          <button class="mini-btn" id="btnCopyUid">复制</button>
        </div>
      </div>
      <div class="set-row">
        <div class="set-label">
          <div class="set-label-t">玩家姓名</div>
          <div class="set-label-d">${currentName}</div>
        </div>
        <div class="set-ctrl">
          <button class="mini-btn" id="btnUidLogin" style="border-color:var(--gold);color:var(--gold-b);">凭 UID 登录</button>
        </div>
      </div>
      <div class="set-row">
        <div class="set-label">
          <div class="set-label-t">管理员权限</div>
          <div class="set-label-d">${isAdmin ? '已授权' : '未授权'}</div>
        </div>
        <div class="set-ctrl">
          <button class="mini-btn ${isAdmin ? 'danger' : ''}" id="btnAdminToggle">${isAdmin ? '登出' : '验证密钥'}</button>
        </div>
      </div>
    `;
    main.insertBefore(accGroup, main.firstChild);

    // 绑定复制 UID
    accGroup.querySelector('#btnCopyUid').onclick = () => {
      if (!s) return;
      navigator.clipboard.writeText(s.uid).then(() => NF.toast('UID 已复制', 'ok'));
    };

    // 绑定 UID 登录
    accGroup.querySelector('#btnUidLogin').onclick = () => {
      NF.openModal({
        title: '凭 UID 登录',
        body: `<div style="text-align:center;padding:20px 0;">
                <p style="font-size:12.5px;color:var(--text-d);margin-bottom:14px;">输入你的 UID（例如 UID: 88481234）：</p>
                <input class="inp" id="loginUidInput" placeholder="UID: 12345678" style="text-align:center;margin-bottom:10px;">
               </div>`,
        footHTML: '<button class="btn ghost" id="akCancel">取消</button><button class="btn primary" id="akOk">登录</button>',
        onMount: (w) => {
          w.querySelector('#akCancel').onclick = () => { NF.Sfx.click(); NF.closeModal(w); };
          w.querySelector('#akOk').onclick = async () => {
            const inputUid = w.querySelector('#loginUidInput').value.trim();
            const numId = getUidNum(inputUid);
            if (!numId) { NF.toast('UID 格式不正确', 'warn'); return; }
            
            NF.Sfx.success(); NF.closeModal(w);
            NF.toast('正在从云端拉取账号...', 'ok');
            
            try {
              const res = await fetch(API_URL + '?id=eq.' + numId, {
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
              });
              const data = await res.json();
              if (data && data.length > 0 && data[0].content) {
                // 覆盖本地存档
                localStorage.setItem('nightfalling_v4_save', JSON.stringify(data[0].content));
                NF.toast('◈ 账号登录成功，正在重启...', 'ok');
                setTimeout(() => location.reload(), 800);
              } else {
                NF.toast('云端找不到该 UID，请检查是否输入错误', 'warn');
              }
            } catch(e) {
              NF.toast('拉取失败，请检查网络', 'warn');
            }
          };
        }
      });
    };

    // 绑定管理员
    accGroup.querySelector('#btnAdminToggle').onclick = () => {
      if (isAdmin) {
        localStorage.removeItem('veselia_admin_ok');
        NF.toast('已登出管理员', 'ok');
        NF.renderSettings();
      } else {
        NF.openModal({
          title: '管 理 员 验 证',
          body: `<div style="text-align:center;padding:20px 0;">
                  <p style="font-size:12.5px;color:var(--text-d);margin-bottom:14px;">请输入密钥：</p>
                  <input class="inp" id="adminKeyInput" type="password" placeholder="输入密钥" style="text-align:center;">
                 </div>`,
          footHTML: '<button class="btn ghost" id="akCancel">取消</button><button class="btn primary" id="akOk">确认</button>',
          onMount: (w) => {
            w.querySelector('#akCancel').onclick = () => { NF.Sfx.click(); NF.closeModal(w); };
            w.querySelector('#akOk').onclick = () => {
              if (w.querySelector('#adminKeyInput').value === ADMIN_SECRET) {
                localStorage.setItem('veselia_admin_ok', '1');
                NF.Sfx.success(); NF.closeModal(w);
                NF.toast('管理员验证成功', 'ok');
                NF.renderSettings();
              } else {
                NF.Sfx.fail(); NF.toast('密钥错误', 'warn');
              }
            };
          }
        });
      }
    };
  };

  /* 4. 拦截工坊入口（查免密） */
  document.addEventListener('click', function(e) {
    const tb = e.target.closest('[data-act="workshop"]');
    const nav = e.target.closest('[data-nav="workshop"]');
    if (!tb && !nav) return;
    
    if (localStorage.getItem('veselia_admin_ok') !== '1') {
      e.stopPropagation();
      e.preventDefault();
      NF.toast('请先在“设置”中验证管理员密钥', 'warn');
      NF.showScreen('settings'); 
    }
  }, true);

  /* 5. 云端同步逻辑（玩家进度 + 工坊剧情） */
  
  // 保存进度到个人 UID（id=数字）
  const origSaveNow = NF.saveNow;
  NF.saveNow = async function() {
    try {
      origSaveNow();
      const s = NF.state();
      if (!s || !s.uid) return;
      const numId = getUidNum(s.uid);
      if (!numId) return;

      // 打包玩家信息
      const playerData = {
        player: s.player,
        stats: s.stats,
        affection: s.affection,
        flags: s.flags,
        log: s.log.slice(-100),
        sceneId: s.sceneId,
        lineIdx: s.lineIdx,
        branchKey: s.branchKey,
        branchIdx: s.branchIdx
      };

      await fetch(API_URL, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates' // 存在即更新，不存在即插入
        },
        body: JSON.stringify({ id: parseInt(numId), content: playerData, updated_at: new Date().toISOString() })
      });
      console.log('[cloud-sync] 玩家进度已同步至云端');
    } catch(e) {
      console.warn('[cloud-sync] 进度同步失败', e);
    }
  };

  // 保存工坊剧情到公共区域（id=1）
  const origSaveUser = NF.saveUser;
  NF.saveUser = async function() {
    try {
      origSaveUser(); 
      const u = NF.userContent();
      await fetch(API_URL + '?id=eq.1', {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ content: u, updated_at: new Date().toISOString() })
      });
      console.log('[cloud-sync] 剧情已同步至云端');
    } catch(e) {
      console.error('[cloud-sync] 剧情同步出错', e);
    }
  };

  /* 6. 启动时拉取公共剧情 */
  setTimeout(async () => {
    try {
      const res = await fetch(API_URL + '?id=eq.1', {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
      });
      const data = await res.json();
      if (data && data.length > 0 && data[0].content && data[0].content.chapters && data[0].content.chapters.length > 0) {
        const u = NF.userContent();
        Object.assign(u, data[0].content);
        localStorage.setItem('nightfalling_v4_user', JSON.stringify(u));
        if (NF.state() && NF.state().screen === 'toc') NF.renderTOC();
        if (NF.state() && NF.state().screen === 'map') NF.renderMap();
      }
    } catch(e) {}
  }, 500);

  console.log('%c[cloud-sync] 终极账号版已就绪', 'color:#9dd0a0;font-size:11px;');
})();
