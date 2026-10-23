/* ═══════════════════════════════════════════════════════════
   cloud-sync.js · 云端同步 + 管理员验证（已配置专属密钥）
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.NF) { console.error('[cloud-sync] NF 未找到'); return; }
  
  /* ==========================================
     你的专属云端配置（已安全注入）
     ========================================== */
  const SUPABASE_URL = 'https://negrtimqwkmlgbcgkxkt.supabase.co'; 
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZ3J0aW1xd2ttbGdiY2dreGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MjE3ODksImV4cCI6MjEwODI5Nzc4OX0.Z6D6JF2N25hbeIPnSNiLjnB7GOBC9ixbWY7U-_pE4Pw';
  
  // ★ 只有输入这个密码才能进工坊
  const ADMIN_SECRET = 'veselia'; 
  
  const NF = window.NF;
  // Supabase REST API 接口，固定请求 id=1 的那行数据
  const API_URL = SUPABASE_URL + '/rest/v1/veselia_sync?id=eq.1';
  
  /* 1. 动态隐藏目录里的[自定]标签 */
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .toc-item-title span { display: none !important; } 
  `;
  document.head.appendChild(styleEl);

  /* 2. 拦截所有“工坊”按钮，加管理员锁 */
  document.addEventListener('click', function(e) {
    const tb = e.target.closest('[data-act="workshop"]');
    if (!tb) return;
    
    // 如果本次会话已经验证过，直接放行
    if (sessionStorage.getItem('veselia_admin_ok') === '1') return;
    
    e.stopPropagation();
    e.preventDefault();
    
    // 弹出密钥输入框
    NF.openModal({
      title: '管 理 员 验 证',
      body: `
        <div style="text-align:center;">
          <p style="font-size:12.5px;color:var(--text-d);margin-bottom:14px;line-height:1.7;">
            只有管理员才能进入「剧情工坊」更新内容。<br>请输入密钥。
          </p>
          <input class="inp" id="adminKeyInput" type="password" placeholder="输入密钥" style="text-align:center;">
        </div>
      `,
      footHTML: '<button class="btn ghost" id="akCancel">取消</button><button class="btn primary" id="akOk">进入</button>',
      onMount: (w) => {
        w.querySelector('#akCancel').onclick = () => { NF.Sfx.click(); NF.closeModal(w); };
        w.querySelector('#akOk').onclick = () => {
          const val = w.querySelector('#adminKeyInput').value;
          if (val === ADMIN_SECRET) {
            sessionStorage.setItem('veselia_admin_ok', '1');
            NF.Sfx.success();
            NF.closeModal(w);
            NF.showScreen('workshop'); // 验证通过，跳转工坊
          } else {
            NF.Sfx.fail();
            NF.toast('密钥错误，无法进入', 'warn');
          }
        };
      }
    });
  }, true); // true 表示在捕获阶段拦截，阻止原有逻辑

  /* 3. 重写 loadUser：网页打开时，从云端拉取最新剧情 */
  NF.loadUser = async function() {
    try {
      const res = await fetch(API_URL, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
      });
      const data = await res.json();
      
      if (data && data.length > 0 && data[0].content) {
        const cloudContent = data[0].content;
        const u = NF.userContent();
        
        // 覆盖本地内存数据
        Object.assign(u, cloudContent);
        // 同步一份到本地备份
        localStorage.setItem('nightfalling_v4_user', JSON.stringify(u));
        
        console.log('[cloud-sync] 云端数据已成功同步到本地');
        
        // 如果玩家此时在地图或目录，自动刷新一下界面
        if (NF.state() && NF.state().screen === 'toc') NF.renderTOC();
        if (NF.state() && NF.state().screen === 'map') NF.renderMap();
      }
    } catch(e) {
      console.warn('[cloud-sync] 拉取云端失败，暂时使用本地数据', e);
    }
  };

  /* 4. 重写 saveUser：管理员保存时，推送到云端 */
  NF.saveUser = async function() {
    try {
      const u = NF.userContent();
      // 本地留底
      localStorage.setItem('nightfalling_v4_user', JSON.stringify(u));
      
      // 推送到 Supabase
      const res = await fetch(API_URL, {
        method: 'PATCH', // 覆盖 id=1 的那条数据
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ content: u, updated_at: new Date().toISOString() })
      });
      
      if (res.ok) {
        console.log('[cloud-sync] 数据已成功同步至云端！');
      } else {
        console.error('[cloud-sync] 同步失败', res.statusText);
      }
    } catch(e) {
      console.error('[cloud-sync] 保存出错', e);
    }
  };

  /* 5. 延迟 300ms 触发云端拉取（确保其他模块加载完毕） */
  setTimeout(() => {
    if (NF.loadUser) NF.loadUser();
  }, 300);

  console.log('%c[cloud-sync] 云端同步模块已就绪，数据将自动同步至 Supabase', 'color:#9dd0a0;font-size:11px;');
})();
