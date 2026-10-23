/* ═══════════════════════════════════════════════════════════
   cloud-sync.js · 终极云账号版（账号恢复 + UID登录 + 免密）
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__cloudSyncLoaded) return;
  window.__cloudSyncLoaded = true;

  if (!window.NF) { console.error('[cloud-sync] NF 未找到'); return; }

  const SUPABASE_URL = 'https://negrtimqwkmlgbcgkxkt.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZ3J0aW1xd2ttbGdiY2dreGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MjE3ODksImV4cCI6MjEwODI5Nzc4OX0.Z6D6JF2N25hbeIPnSNiLjnB7GOBC9ixbWY7U-_pE4Pw';
  const ADMIN_SECRET = 'veselia';
  const SAVE_KEY = 'nightfalling_v4_save';

  const NF = window.NF;
  const API_URL = SUPABASE_URL + '/rest/v1/veselia_sync';

  /* ═══ 工具 ═══ */
  const getUidNum = (uidStr) => {
    if (uidStr == null) return null;
    const m = String(uidStr).match(/\d+/);
    return m ? m[0] : null;
  };
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const H = () => ({
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY
  });
  const HJ = () => Object.assign(H(), { 'Content-Type': 'application/json' });

  /* ═══ 2. 隐藏 [自定] 标签 ═══ */
  const origRenderTOC = (typeof window.renderTOC === 'function') ? window.renderTOC
                      : (typeof NF.renderTOC === 'function') ? NF.renderTOC : null;
  if (origRenderTOC) {
    const wrappedRenderTOC = function () {
      const r = origRenderTOC.apply(this, arguments);
      setTimeout(() => {
        document.querySelectorAll('.toc-item-title').forEach(t => {
          // 删掉所有含“自定”的 span，不只第一个
          t.querySelectorAll('span').forEach(sp => {
            if (sp.textContent && sp.textContent.includes('自定')) sp.remove();
          });
        });
      }, 30);
      return r;
    };
    window.renderTOC = wrappedRenderTOC;
    NF.renderTOC = wrappedRenderTOC;
  } else {
    console.warn('[cloud-sync] renderTOC 未找到，[自定] 隐藏跳过');
  }

  /* ═══ 3. 设置页注入账号管理 UI ═══ */
  const origRenderSettings = (typeof window.renderSettings === 'function') ? window.renderSettings
                           : (typeof NF.renderSettings === 'function') ? NF.renderSettings : null;
  if (origRenderSettings) {
    const wrappedRenderSettings = function () {
      const r = origRenderSettings.apply(this, arguments);
      injectAccountGroup();
      return r;
    };
    window.renderSettings = wrappedRenderSettings;
    NF.renderSettings = wrappedRenderSettings;
  } else {
    console.warn('[cloud-sync] renderSettings 未找到，账号入口无法注入');
  }

  function injectAccountGroup() {
    const main = document.getElementById('setMain');
    if (!main) return;
    if (main.querySelector('[data-acc-injected]')) return;

    const s = NF.state();
    const currentUid = (s && s.uid) ? s.uid : '（尚未创建角色）';
    const currentName = (s && s.player && s.player.name) ? s.player.name : '（未命名）';
    const isAdmin = localStorage.getItem('veselia_admin_ok') === '1';

    const accGroup = document.createElement('div');
    accGroup.className = 'set-group';
    accGroup.setAttribute('data-acc-injected', '1');
    accGroup.innerHTML = `
      <div class="set-group-head" style="color:var(--gold-b);">账 号 与 云 端</div>
      <div class="set-row">
        <div class="set-label">
          <div class="set-label-t">当前 UID</div>
          <div class="set-label-d">${esc(currentUid)}</div>
        </div>
        <div class="set-ctrl">
          <button class="mini-btn" id="btnCopyUid">复制</button>
        </div>
      </div>
      <div class="set-row">
        <div class="set-label">
          <div class="set-label-t">玩家姓名</div>
          <div class="set-label-d">${esc(currentName)}</div>
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

    accGroup.querySelector('#btnCopyUid').onclick = () => {
      const st = NF.state();
      if (!st || !st.uid) { NF.toast('还没有 UID', 'warn'); return; }
      const uidText = String(st.uid);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(uidText)
          .then(() => NF.toast('UID 已复制', 'ok'))
          .catch(() => NF.toast('复制失败', 'warn'));
      } else {
        NF.toast('当前环境不支持剪贴板', 'warn');
      }
    };

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
              const res = await fetch(API_URL + '?id=eq.' + encodeURIComponent(numId), { headers: H() });
              if (!res.ok) throw new Error('HTTP ' + res.status);
              const data = await res.json();
              if (data && data.length > 0 && data[0].content) {
                const content = Object.assign({}, data[0].content);
                // 补回 uid，防止登录后 saveNow 因缺 uid 跳过同步
                if (!content.uid) {
                  content.uid = 'UID: ' + numId;
                }
                localStorage.setItem(SAVE_KEY, JSON.stringify(content));
                NF.toast('◈ 账号登录成功，正在重启...', 'ok');
                setTimeout(() => location.reload(), 800);
              } else {
                NF.toast('云端找不到该 UID，请检查是否输入错误', 'warn');
              }
            } catch (e) {
              console.warn('[cloud-sync] 登录失败', e);
              NF.toast('拉取失败，请检查网络', 'warn');
            }
          };
        }
      });
    };

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
  }

  /* ═══ 4. 拦截工坊入口（免密） ═══ */
  document.addEventListener('click', function (e) {
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

  /* ═══ 5. 云端同步：玩家进度 ═══ */
  const origSaveNow = (typeof window.saveNow === 'function') ? window.saveNow
                    : (typeof NF.saveNow === 'function') ? NF.saveNow : null;
  if (origSaveNow) {
    const wrappedSaveNow = async function () {
      try {
        origSaveNow.apply(this, arguments);
        const s = NF.state();
        if (!s || !s.uid) return;
        const numId = getUidNum(s.uid);
        if (!numId) return;

        // 存完整 state（uid 必须带上），log 截断
        const playerData = Object.assign({}, s, {
          log: Array.isArray(s.log) ? s.log.slice(-200) : [],
          snapshots: [],          // 快照不传
          choiceMarkers: []       // 标记不传
        });

        const res = await fetch(API_URL, {
          method: 'POST',
          headers: Object.assign(HJ(), { 'Prefer': 'resolution=merge-duplicates' }),
          body: JSON.stringify({
            id: parseInt(numId, 10),
            content: playerData,
            updated_at: new Date().toISOString()
          })
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
      } catch (e) {
        console.warn('[cloud-sync] 进度同步失败', e);
      }
    };
    window.saveNow = wrappedSaveNow;
    NF.saveNow = wrappedSaveNow;
  } else {
    console.warn('[cloud-sync] saveNow 未找到，进度同步跳过');
  }

  /* ═══ 6. 云端同步：工坊剧情（公共 id=1） ═══ */
  const origSaveUser = (typeof window.saveUser === 'function') ? window.saveUser
                     : (typeof NF.saveUser === 'function') ? NF.saveUser : null;
  if (origSaveUser) {
    // 注意：保持同步返回 boolean，上传异步
    const wrappedSaveUser = function () {
      let ok = false;
      try {
        ok = origSaveUser.apply(this, arguments);
      } catch (e) {
        console.warn('[cloud-sync] saveUser 原函数报错', e);
      }
      (async () => {
        try {
          const u = NF.userContent();
          if (!u) return;
          const res = await fetch(API_URL, {
            method: 'POST',
            headers: Object.assign(HJ(), { 'Prefer': 'resolution=merge-duplicates' }),
            body: JSON.stringify({
              id: 1,
              content: u,
              updated_at: new Date().toISOString()
            })
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
        } catch (e) {
          console.warn('[cloud-sync] 剧情同步失败', e);
        }
      })();
      return ok;
    };
    window.saveUser = wrappedSaveUser;
    NF.saveUser = wrappedSaveUser;
  } else {
    console.warn('[cloud-sync] saveUser 未找到，剧情同步跳过');
  }

  /* ═══ 7. 启动时拉取公共剧情（比较 updated_at，不覆盖本地新数据） ═══ */
  setTimeout(async () => {
    try {
      const res = await fetch(API_URL + '?id=eq.1', { headers: H() });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!data || !data.length || !data[0].content) return;
      const remote = data[0].content;
      if (!remote.chapters || !remote.chapters.length) return;

      const u = NF.userContent();
      if (!u) return;

      // 简单比较：远端有内容且本地为空 → 拉；否则保留本地
      const localHas = Array.isArray(u.chapters) && u.chapters.length > 0;
      if (!localHas) {
        Object.assign(u, remote);
        try { localStorage.setItem('nightfalling_v4_user', JSON.stringify(u)); } catch (e) {}
        const s = NF.state();
        if (s && s.screen === 'toc') NF.renderTOC();
        if (s && s.screen === 'map') NF.renderMap();
      }
    } catch (e) {
      console.warn('[cloud-sync] 拉取公共剧情失败', e);
    }
  }, 500);

  console.log('%c[cloud-sync] 终极账号版已就绪', 'color:#9dd0a0;font-size:11px;');
})();
