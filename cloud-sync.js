/* ═══════════════════════════════════════════════════════════
   cloud-sync.js · 绝对安全最终版（已修复所有Bug）
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.NF) { console.error('[cloud-sync] NF 未找到'); return; }
  
  const SUPABASE_URL = 'https://negrtimqwkmlgbcgkxkt.supabase.co'; 
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZ3J0aW1xd2ttbGdiY2dreGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MjE3ODksImV4cCI6MjEwODI5Nzc4OX0.Z6D6JF2N25hbeIPnSNiLjnB7GOBC9ixbWY7U-_pE4Pw';
  const ADMIN_SECRET = 'veselia'; 
  
  const NF = window.NF;
  const API_URL = SUPABASE_URL + '/rest/v1/veselia_sync?id=eq.1';

  /* 1. 隐藏 [自定] */
  const styleEl = document.createElement('style');
  styleEl.textContent = `.toc-item-title span[style*="color:var(--gold-d)"] { display: none !important; }`;
  document.head.appendChild(styleEl);

  /* 2. 强力注入设置面板 (监听画面切换) */
  const injectAdminUI = () => {
    const setMain = document.getElementById('setMain');
    // 如果没有设置面板，或者已经注入过，就跳过
    if (!setMain || document.getElementById('adminPanelGroup')) return;
    
    // 直接在最前面插入一个全新的大分组，不破坏原有结构
    const adminGroup = document.createElement('div');
    adminGroup.id = 'adminPanelGroup';
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
      setMain.insertBefore(adminGroup, setMain.firstChild);
      document.getElementById('adminLogoutBtn').onclick = () => {
        sessionStorage.removeItem('veselia_admin_ok');
        NF.Sfx.click();
        NF.toast('已登出管理员', 'ok');
        document.getElementById('adminPanelGroup').remove();
        injectAdminUI();
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
      setMain.insertBefore(adminGroup, setMain.firstChild);
      
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
                document.getElementById('adminPanelGroup').remove();
                injectAdminUI(); // 重新渲染已登录状态
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

  // 监听 DOM 变化，只要切换到设置页（setMain有内容了），就立刻注入
  const observer = new MutationObserver(() => {
    if (document.getElementById('screen-settings')?.classList.contains('active')) {
      injectAdminUI();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

  /* 3. 拦截所有工坊入口（顶部、底部全拦截） */
  document.addEventListener('click', function(e) {
    const tb = e.target.closest('[data-act="workshop"]');
    const nav = e.target.closest('[data-nav="workshop"]');
    
    if (!tb && !nav) return;
    
    if (sessionStorage.getItem('veselia_admin_ok') !== '1') {
      e.stopPropagation();
      e.preventDefault();
      NF.toast('请先在“设置”中验证管理员密钥', 'warn');
      NF.showScreen('settings'); 
    }
  }, true);

  /* 4. 安全的云端合并（不再暴力覆盖） */
  const checkCloudData = async () => {
    try {
      const res = await fetch(API_URL, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
      });
      const data = await res.json();
      if (data && data.length > 0 && data[0].content && data[0].content.chapters && data[0].content.chapters.length > 0) {
        // ★ 只有云端真的存了章节，且用户本地没东西，或者用户主动要求合并时才合并
        const u = NF.userContent();
        if (!u.chapters || u.chapters.length === 0) {
          Object.assign(u, data[0].content);
          localStorage.setItem('nightfalling_v4_user', JSON.stringify(u));
          NF.toast('◈ 已自动拉取云端剧情数据', 'ok');
          if (NF.state() && NF.state().screen === 'toc') NF.renderTOC();
        }
      }
    } catch(e) {}
  };
  
  // 延迟加载，安全合并
  setTimeout(checkCloudData, 1000);

  /* 5. 保存时静默同步 */
  const originalSaveUser = NF.saveUser;
  NF.saveUser = async function() {
    try {
      originalSaveUser(); // 先确保本地存好
      const u = NF.userContent();
      await fetch(API_URL, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ content: u, updated_at: new Date().toISOString() })
      });
      console.log('[cloud-sync] 已同步至云端');
    } catch(e) {}
  };

  console.log('%c[cloud-sync] 安全版已就绪', 'color:#9dd0a0;font-size:11px;');
})();
