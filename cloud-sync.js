/* ═══════════════════════════════════════════════════════════
   cloud-sync.js · 云端同步 + 完美隐藏[自定] + UI管理员验证
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.NF) { console.error('[cloud-sync] NF 未找到'); return; }
  
  const SUPABASE_URL = 'https://negrtimqwkmlgbcgkxkt.supabase.co'; 
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZ3J0aW1xd2ttbGdiY2dreGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MjE3ODksImV4cCI6MjEwODI5Nzc4OX0.Z6D6JF2N25hbeIPnSNiLjnB7GOBC9ixbWY7U-_pE4Pw';
  const ADMIN_SECRET = 'veselia'; 
  
  const NF = window.NF;
  const API_URL = SUPABASE_URL + '/rest/v1/veselia_sync?id=eq.1';
  
  /* 1. ★ 完美隐藏目录里的[自定]标签 ★ */
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    /* 精准命中那个带内联样式的小字，直接隐藏 */
    .toc-item-title span[style*="color:var(--gold-d)"] { display: none !important; }
    /* 顺便把文字里的 [自定] 也藏了，双保险 */
    .toc-item-title { font-size: 0; }
    .toc-item-title * { font-size: 13px; }
  `;
  document.head.appendChild(styleEl);

  /* 2. 在设置面板动态注入“管理员登录” */
  const originalRenderSettings = NF.renderSettings;
  NF.renderSettings = function() {
    originalRenderSettings(); 
    
    const main = document.querySelector('#setMain');
    if (!main) return;
    
    if (sessionStorage.getItem('veselia_admin_ok') !== '1') {
      const groups = main.querySelectorAll('.set-group');
      if (groups.length > 0) {
        const accountGroup = groups[0];
        const row = document.createElement('div');
        row.className = 'set-row';
        row.innerHTML = `
          <div class="set-label">
            <div class="set-label-t">管理员登录</div>
            <div class="set-label-d">验证身份以开启工坊更新权限</div>
          </div>
          <div class="set-ctrl">
            <button class="mini-btn" id="adminLoginBtn" style="border-color:var(--gold);color:var(--gold-b);">验证密钥</button>
          </div>
        `;
        accountGroup.appendChild(row);
        
        row.querySelector('#adminLoginBtn').onclick = () => {
          NF.openModal({
            title: '管 理 员 验 证',
            body: `
              <div style="text-align:center;">
                <p style="font-size:12.5px;color:var(--text-d);margin-bottom:14px;">请输入密钥：</p>
                <input class="inp" id="adminKeyInput" type="password" placeholder="输入密钥" style="text-align:center;">
              </div>
            `,
            footHTML: '<button class="btn ghost" id="akCancel">取消</button><button class="btn primary" id="akOk">确认</button>',
            onMount: (w) => {
              w.querySelector('#akCancel').onclick = () => { NF.Sfx.click(); NF.closeModal(w); };
              w.querySelector('#akOk').onclick = () => {
                if (w.querySelector('#adminKeyInput').value === ADMIN_SECRET) {
                  sessionStorage.setItem('veselia_admin_ok', '1');
                  NF.Sfx.success();
                  NF.closeModal(w);
                  NF.toast('管理员验证成功', 'ok');
                  NF.renderSettings(); 
                } else {
                  NF.Sfx.fail();
                  NF.toast('密钥错误', 'warn');
                }
              };
            }
          });
        };
      }
    } else {
      const groups = main.querySelectorAll('.set-group');
      if (groups.length > 0) {
        const accountGroup = groups[0];
        const row = document.createElement('div');
        row.className = 'set-row';
        row.innerHTML = `
          <div class="set-label">
            <div class="set-label-t" style="color:#9dd0a0;">✓ 管理员已登录</div>
            <div class="set-label-d">你拥有修改所有剧情的权限</div>
          </div>
          <div class="set-ctrl">
            <button class="mini-btn danger" id="adminLogoutBtn">登出</button>
          </div>
        `;
        accountGroup.appendChild(row);
        
        row.querySelector('#adminLogoutBtn').onclick = () => {
          sessionStorage.removeItem('veselia_admin_ok');
          NF.Sfx.click();
          NF.renderSettings();
        };
      }
    }
  };

  /* 3. 彻底拦截工坊入口 */
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

  /* 4. 云端同步逻辑 */
  NF.loadUser = async function() {
    try {
      const res = await fetch(API_URL, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
      });
      const data = await res.json();
      if (data && data.length > 0 && data[0].content) {
        const cloudContent = data[0].content;
        const u = NF.userContent();
        Object.assign(u, cloudContent);
        localStorage.setItem('nightfalling_v4_user', JSON.stringify(u));
        console.log('[cloud-sync] 云端数据已成功同步到本地');
        if (NF.state() && NF.state().screen === 'toc') NF.renderTOC();
        if (NF.state() && NF.state().screen === 'map') NF.renderMap();
      }
    } catch(e) {
      console.warn('[cloud-sync] 拉取云端失败', e);
    }
  };

  NF.saveUser = async function() {
    try {
      const u = NF.userContent();
      localStorage.setItem('nightfalling_v4_user', JSON.stringify(u));
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

  setTimeout(() => { if (NF.loadUser) NF.loadUser(); }, 300);
  console.log('%c[cloud-sync] 最终版已就绪', 'color:#9dd0a0;font-size:11px;');
})();
