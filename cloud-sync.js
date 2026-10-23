/* ═══════════════════════════════════════════════════════════
   cloud-sync.js · 修复覆盖Bug + 绝对安全版
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.NF) { console.error('[cloud-sync] NF 未找到'); return; }
  
  const SUPABASE_URL = 'https://negrtimqwkmlgbcgkxkt.supabase.co'; 
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZ3J0aW1xd2ttbGdiY2dreGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MjE3ODksImV4cCI6MjEwODI5Nzc4OX0.Z6D6JF2N25hbeIPnSNiLjnB7GOBC9ixbWY7U-_pE4Pw';
  const ADMIN_SECRET = 'veselia'; 
  
  const NF = window.NF;
  const API_URL = SUPABASE_URL + '/rest/v1/veselia_sync?id=eq.1';

  /* 1. 修复 [自定] 隐藏：只针对渲染出来的 DOM 操作，不破坏数据 */
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

  /* 2. 把“管理员登录”死死塞进设置面板的最前面 */
  const origRenderSettings = NF.renderSettings;
  NF.renderSettings = function() {
    origRenderSettings();
    
    const main = document.getElementById('setMain');
    if (!main) return;
    
    // 创建一个绝对独立的新组，塞到最上面，不破坏原本的列表
    const adminGroup = document.createElement('div');
    adminGroup.className = 'set-group';
    
    if (sessionStorage.getItem('veselia_admin_ok') === '1') {
      adminGroup.innerHTML = `
        <div class="set-group-head" style="color:#9dd0a0;">管 理 员 权 限</div>
        <div class="set-row">
          <div class="set-label">
            <div class="set-label-t" style="color:#9dd0a0;">✓ 管理员已登录</div>
            <div class="set-label-d">你拥有修改所有剧情的权限</div>
          </div>
          <div class="set-ctrl"><button class="mini-btn danger" id="adminLogoutBtn">登出</button></div>
        </div>
      `;
      main.insertBefore(adminGroup, main.firstChild);
      document.getElementById('adminLogoutBtn').onclick = () => {
        sessionStorage.removeItem('veselia_admin_ok');
        NF.Sfx.click();
        NF.renderSettings();
      };
    } else {
      adminGroup.innerHTML = `
        <div class="set-group-head">管 理 员 验 证</div>
        <div class="set-row">
          <div class="set-label">
            <div class="set-label-t">未登录</div>
            <div class="set-label-d">请输入密钥解锁工坊权限</div>
          </div>
          <div class="set-ctrl"><button class="mini-btn" id="adminLoginBtn" style="border-color:var(--gold);color:var(--gold-b);">验证密钥</button></div>
        </div>
      `;
      main.insertBefore(adminGroup, main.firstChild);
      
      document.getElementById('adminLoginBtn').onclick = () => {
        NF.openModal({
          title: '管 理 员 验 证',
          body: `<div style="text-align:center;padding:20px 0;">
                  <p style="font-size:13px;color:var(--text-d);margin-bottom:14px;">请输入密钥：</p>
                  <input class="inp" id="adminKeyInput" type="password" placeholder="输入密钥" style="text-align:center;">
                 </div>`,
          footHTML: '<button class="btn ghost" id="akCancel">取消</button><button class="btn primary" id="akOk">确认</button>',
          onMount: (w) => {
            w.querySelector('#akCancel').onclick = () => { NF.Sfx.click(); NF.closeModal(w); };
            w.querySelector('#akOk').onclick = () => {
              if (w.querySelector('#adminKeyInput').value === ADMIN_SECRET) {
                sessionStorage.setItem('veselia_admin_ok', '1');
                NF.Sfx.success();
                NF.closeModal(w);
                NF.toast('管理员验证成功', 'ok');
                NF.renderSettings(); // 刷新面板
              } else {
                NF.Sfx.fail();
                NF.toast('密钥错误', 'warn');
              }
            };
          }
        });
      };
    }
  };

  /* 3. 拦截工坊入口：没登录不让进 */
  document.addEventListener('click', function(e) {
    const tb = e.target.closest('[data-act="workshop"]');
    if (!tb) return;
    
    if (sessionStorage.getItem('veselia_admin_ok') !== '1') {
      e.stopPropagation();
      e.preventDefault();
      NF.toast('请先在“设置”中验证管理员密钥', 'warn');
      NF.showScreen('settings'); 
    }
  }, true);

  /* 4. 绝对安全的拉取：云端有数据，且不是空的，才合并，绝不覆盖清空 */
  const originalLoadUser = NF.loadUser;
  NF.loadUser = async function() {
    try {
      // 先执行原本的本地加载
      originalLoadUser();
      
      const res = await fetch(API_URL, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
      });
      const data = await res.json();
      
      // ★ 关键修复：只有云端真的返回了对象，且章节数量大于0，才覆盖本地
      if (data && data.length > 0 && data[0].content && data[0].content.chapters && data[0].content.chapters.length > 0) {
        const cloudContent = data[0].content;
        const u = NF.userContent();
        
        Object.assign(u, cloudContent);
        localStorage.setItem('nightfalling_v4_user', JSON.stringify(u));
        console.log('[cloud-sync] 云端有数据，已合并到本地');
        
        if (NF.state() && NF.state().screen === 'toc') NF.renderTOC();
        if (NF.state() && NF.state().screen === 'map') NF.renderMap();
      } else {
        console.log('[cloud-sync] 云端为空，保留本地数据不覆盖');
      }
    } catch(e) {
      console.warn('[cloud-sync] 拉取云端失败，使用本地数据', e);
    }
  };

  /* 5. 保存时推送到云端 */
  const originalSaveUser = NF.saveUser;
  NF.saveUser = async function() {
    try {
      // 先保存到本地
      originalSaveUser();
      
      const u = NF.userContent();
      const res = await fetch(API_URL, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ content: u, updated_at: new Date().toISOString() })
      });
      if (res.ok) console.log('[cloud-sync] 数据已成功同步至云端！');
      else console.error('[cloud-sync] 同步失败', res.statusText);
    } catch(e) {
      console.error('[cloud-sync] 保存出错', e);
    }
  };

  setTimeout(() => { if (NF.loadUser) NF.loadUser(); }, 500);
  console.log('%c[cloud-sync] 安全版已就绪', 'color:#9dd0a0;font-size:11px;');
})();
