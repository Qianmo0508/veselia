/* ═══════════════════════════════════════════════════════════
   workshop.js · 剧情工坊全表单
   依赖 index.html 暴露的 window.NF
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.NF) { console.error('[workshop] window.NF 未找到'); return; }
  const NF = window.NF;
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  /* ─── 状态 ─── */
  let wsType = 'chapter';       // chapter | dungeon | location | bond | gift | cg
  let wsEditKey = null;
  let wsFormData = null;
  let wsEditKind = null;        // 记录的原始类型（编辑时区分 chapter vs dungeon）

  /* ─── 空表单工厂 ─── */
  function blankChapter(kind) {
    return {
      type: kind === 'dungeon' ? 'dungeon' : 'main',
      title:'', subtitle:'', location:'', bg:'city',
      lines: [{ type:'n', cn:'' }]
    };
  }
  function blankLocation() {
    return { name:'', region:'索姆尼亚帝国', bg:'city', desc:'', entries: [] };
  }
  function blankBond() {
    return { charId:'cash', mode:'chat', title:'', need:0, lines:[{ who:'cash', en:'', cn:'' }] };
  }
  function blankGift() {
    return { name:'', icon:'✦', cost:10, aff:5, likes:[], desc:'' };
  }
  function blankCG() {
    return { charId:'cash', title:'', subtitle:'', need:30, lines:[{ cn:'' }] };
  }

  /* ─── 角色/背景/小游戏 选项表 ─── */
  const CHAR_IDS = ['tavana','movioa','lidia','elsia','fiman','cash','reifina','cassi'];
  const BGS = ['city','tavern','grove','manor','archive','church','castle','dream'];
  const MGS = [
    { id:'pour', name:'调酒 (QTE)' },
    { id:'evidence', name:'证据链连线' },
    { id:'chess', name:'残局走位' },
    { id:'puzzle', name:'光影拼图' },
    { id:'dream', name:'梦域副本' }
  ];

  /* ═══════════════════════════════════════════════════════════
     主渲染
     ═══════════════════════════════════════════════════════════ */
  function render() {
    const main = $('#wsMain');
    if (!main) return;
    const types = [
      { id:'chapter',  label:'章节' },
      { id:'dungeon',  label:'副本' },
      { id:'location', label:'地点' },
      { id:'bond',     label:'乙游话题' },
      { id:'gift',     label:'礼物' },
      { id:'cg',       label:'特殊CG' }
    ];
    main.innerHTML =
      '<div class="ws-intro">在表单里填写内容，<b>保存后立刻能玩</b>。相同 key 会覆盖旧版本。<br>「地点」创建后，你还能往里面加剧情入口、小游戏入口、角色对话入口。</div>' +
      '<div class="ws-type-tabs">' +
        types.map(t => '<button class="ws-type-btn ' + (wsType===t.id?'on':'') + '" data-type="' + t.id + '">' + t.label + '</button>').join('') +
      '</div>' +
      '<div id="wsForm"></div>' +
      '<div class="divider" style="margin:26px 0 16px;"><span>已 导 入 的 内 容</span></div>' +
      '<div id="wsList"></div>';

    main.querySelectorAll('.ws-type-btn').forEach(b => {
      b.onclick = () => {
        NF.Sfx.click();
        wsType = b.dataset.type;
        wsFormData = null; wsEditKey = null; wsEditKind = null;
        render();
      };
    });

    renderForm(main);
    renderList(main);
  }

  /* ═══════════════════════════════════════════════════════════
     表单渲染（按类型分发）
     ═══════════════════════════════════════════════════════════ */
  function renderForm(main) {
    const box = main.querySelector('#wsForm');
    if (!box) return;

    if (wsType === 'chapter' || wsType === 'dungeon') renderChapterForm(box, main);
    else if (wsType === 'location') renderLocationForm(box, main);
    else if (wsType === 'bond') renderBondForm(box, main);
    else if (wsType === 'gift') renderGiftForm(box, main);
    else if (wsType === 'cg') renderCGForm(box, main);
  }

  /* ─────────────── 章节 / 副本表单 ─────────────── */
  function renderChapterForm(box, main) {
    if (!wsFormData) wsFormData = blankChapter(wsType);
    if (wsType === 'dungeon') wsFormData.type = 'dungeon';
    else if (wsType === 'chapter') wsFormData.type = 'main';

    box.innerHTML =
      '<div class="ws-field"><label>标 题 <b>（必填）</b></label><input class="inp" id="wsTitle" value="' + esc(wsFormData.title) + '" placeholder="例如：第二章 · 夜与晨"></div>' +
      '<div class="ws-field"><label>副 标 题</label><input class="inp" id="wsSubtitle" value="' + esc(wsFormData.subtitle) + '" placeholder="例如：落日之都的第二日"></div>' +
      '<div class="ws-field"><label>地 点</label><input class="inp" id="wsLoc" value="' + esc(wsFormData.location) + '" placeholder="例如：日不落酒馆 · 吧台"></div>' +
      '<div class="ws-field"><label>背 景</label><select class="inp" id="wsBg">' +
        BGS.map(b => '<option value="' + b + '" ' + (wsFormData.bg===b?'selected':'') + '>' + b + '</option>').join('') +
      '</select></div>' +
      '<div class="ws-field"><label>对 话 <b>（每行独立）</b></label>' +
        '<p class="ws-hint">旁白只填中文；角色台词填「角色 + 英文 + 中文」；主角台词填「英文 + 中文」。</p>' +
        '<div class="ws-lines" id="wsLines"></div>' +
        '<button class="ws-add-line" id="wsAddLine">＋ 添 加 一 行</button>' +
      '</div>' +
      '<div class="ws-field"><label>预 览</label><div class="ws-preview" id="wsPreview"></div></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;"><button class="btn ghost" id="wsCancel">取消</button><button class="btn primary" id="wsSave">' + (wsEditKey?'覆盖保存':'保存并加入游戏') + '</button></div>';

    const linesBox = box.querySelector('#wsLines');
    wsFormData.lines.forEach((l, i) => appendChapterLine(linesBox, l, i, box, main));
    updateChapterPreview(box);

    box.querySelector('#wsTitle').oninput = (e) => wsFormData.title = e.target.value;
    box.querySelector('#wsSubtitle').oninput = (e) => wsFormData.subtitle = e.target.value;
    box.querySelector('#wsLoc').oninput = (e) => wsFormData.location = e.target.value;
    box.querySelector('#wsBg').onchange = (e) => wsFormData.bg = e.target.value;
    box.querySelector('#wsAddLine').onclick = () => { NF.Sfx.click(); wsFormData.lines.push({ type:'n', cn:'' }); renderForm(main); };
    box.querySelector('#wsCancel').onclick = () => { NF.Sfx.click(); wsFormData=null; wsEditKey=null; wsEditKind=null; renderForm(main); };
    box.querySelector('#wsSave').onclick = () => saveChapter(box);
  }

  function appendChapterLine(box, line, i, formBox, main) {
    const card = document.createElement('div');
    card.className = 'ws-line-card';
    card.innerHTML =
      '<div class="ws-line-head">' +
        '<span class="ws-line-num">行 ' + (i+1) + '</span>' +
        '<select class="ws-line-type"><option value="n" ' + (line.type==='n'?'selected':'') + '>旁白</option><option value="s" ' + (line.type==='s'?'selected':'') + '>角色台词</option><option value="me" ' + (line.type==='me'?'selected':'') + '>主角</option></select>' +
        '<button class="ws-line-del">×</button>' +
      '</div>' +
      '<div class="ws-line-body">' +
        '<select class="inp ws-char" style="display:' + (line.type==='s'?'block':'none') + ';margin-bottom:8px;">' +
          CHAR_IDS.map(id => '<option value="' + id + '" ' + (line.who===id?'selected':'') + '>' + NF.CHARS[id].name + '</option>').join('') +
        '</select>' +
        '<input class="inp ws-en" placeholder="英文台词（可选）" value="' + esc(line.en||'') + '" style="font-family:var(--f-en);font-style:italic;margin-bottom:8px;">' +
        '<input class="inp ws-cn" placeholder="中文内容（必填）" value="' + esc(line.cn||'') + '">' +
      '</div>';
    box.appendChild(card);
    card.querySelector('.ws-line-type').onchange = (e) => {
      line.type = e.target.value;
      card.querySelector('.ws-char').style.display = e.target.value === 's' ? 'block' : 'none';
      updateChapterPreview(formBox);
    };
    card.querySelector('.ws-char').onchange = (e) => { line.who = e.target.value; updateChapterPreview(formBox); };
    card.querySelector('.ws-en').oninput = (e) => { line.en = e.target.value; updateChapterPreview(formBox); };
    card.querySelector('.ws-cn').oninput = (e) => { line.cn = e.target.value; updateChapterPreview(formBox); };
    card.querySelector('.ws-line-del').onclick = () => {
      NF.Sfx.click();
      if (wsFormData.lines.length <= 1) { NF.toast('至少保留一行', 'warn'); return; }
      wsFormData.lines.splice(i, 1);
      renderForm(main);
    };
  }

  function updateChapterPreview(formBox) {
    const prev = formBox.querySelector('#wsPreview');
    if (!prev) return;
    prev.innerHTML = '<div class="ws-preview-title">◈ PREVIEW</div>' +
      wsFormData.lines.map(l => {
        const isNarr = l.type === 'n';
        let html = '<div class="ws-preview-line ' + (isNarr?'narr':'') + '">';
        if (l.type === 's') html += '<div class="pp-speaker">' + esc(NF.CHARS[l.who]?.name || l.who || '') + '</div>';
        if (l.type === 'me') html += '<div class="pp-speaker">' + esc(NF.state()?.player?.name || '记者') + '</div>';
        if (!isNarr && l.en) html += '<div class="pp-en">' + esc(l.en) + '</div>';
        if (l.cn) html += '<div class="pp-cn">' + esc(l.cn) + '</div>';
        html += '</div>';
        return html;
      }).join('') || '<p style="font-size:12px;color:var(--text-d);font-style:italic;">尚未填写。</p>';
  }

  function saveChapter(formBox) {
    const title = formBox.querySelector('#wsTitle').value.trim();
    if (!title) { NF.toast('请填标题','warn'); return; }
    const lines = wsFormData.lines.filter(l => l.cn && l.cn.trim());
    if (!lines.length) { NF.toast('至少一行对话','warn'); return; }
    const key = wsEditKey || ('ch_' + Date.now());
    const data = {
      key, title,
      subtitle: formBox.querySelector('#wsSubtitle').value.trim(),
      location: formBox.querySelector('#wsLoc').value.trim(),
      bg: formBox.querySelector('#wsBg').value,
      type: wsFormData.type === 'dungeon' ? 'dungeon' : 'main',
      lines, ts: Date.now()
    };
    const list = NF.userContent().chapters;
    const idx = list.findIndex(x => x.key === key);
    if (idx >= 0) list[idx] = data;
    else list.push(data);
    NF.saveUser();
    NF.Sfx.success();
    NF.toast('◈ 已保存：' + title, 'ok');
    wsFormData = null; wsEditKey = null; wsEditKind = null;
    renderForm(document.querySelector('#wsMain'));
    renderList(document.querySelector('#wsMain'));
    if (NF.renderTOC) NF.renderTOC();
  }

  /* ─────────────── 地点表单（含 entries 编辑） ─────────────── */
  function renderLocationForm(box, main) {
    if (!wsFormData) wsFormData = blankLocation();

    box.innerHTML =
      '<div class="ws-field"><label>地 点 名 称 <b>（必填）</b></label><input class="inp" id="wsLocName" value="' + esc(wsFormData.name) + '" placeholder="例如：映月镇"></div>' +
      '<div class="ws-field"><label>所 属 区 域</label><input class="inp" id="wsLocRegion" value="' + esc(wsFormData.region) + '" placeholder="例如：索姆尼亚帝国"></div>' +
      '<div class="ws-field"><label>背 景</label><select class="inp" id="wsLocBg">' +
        BGS.map(b => '<option value="' + b + '" ' + (wsFormData.bg===b?'selected':'') + '>' + b + '</option>').join('') +
      '</select></div>' +
      '<div class="ws-field"><label>描 述</label><textarea class="inp" id="wsLocDesc" style="min-height:80px;">' + esc(wsFormData.desc) + '</textarea></div>' +
      '<div class="ws-field">' +
        '<label>可 交 互 入 口 <b>（可留空）</b></label>' +
        '<p class="ws-hint">进入这个地点后能点什么。可以加多个入口：剧情 / 小游戏 / 角色对话。</p>' +
        '<div id="wsLocEntries" style="display:flex;flex-direction:column;gap:10px;"></div>' +
        '<button class="ws-add-line" id="wsLocAddEntry" style="margin-top:10px;">＋ 添 加 一 个 入 口</button>' +
      '</div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;"><button class="btn ghost" id="wsCancel">取消</button><button class="btn primary" id="wsSave">' + (wsEditKey?'覆盖保存':'保存地点') + '</button></div>';

    const entriesBox = box.querySelector('#wsLocEntries');
    wsFormData.entries.forEach((e, i) => appendLocEntry(entriesBox, e, i, box, main));
    box.querySelector('#wsLocName').oninput = (e) => wsFormData.name = e.target.value;
    box.querySelector('#wsLocRegion').oninput = (e) => wsFormData.region = e.target.value;
    box.querySelector('#wsLocBg').onchange = (e) => wsFormData.bg = e.target.value;
    box.querySelector('#wsLocDesc').oninput = (e) => wsFormData.desc = e.target.value;
    box.querySelector('#wsLocAddEntry').onclick = () => {
      NF.Sfx.click();
      wsFormData.entries.push({ type:'scene', id:'', name:'', icon:'◆', desc:'' });
      renderForm(main);
    };
    box.querySelector('#wsCancel').onclick = () => { NF.Sfx.click(); wsFormData=null; wsEditKey=null; wsEditKind=null; renderForm(main); };
    box.querySelector('#wsSave').onclick = () => saveLocation(box);
  }

  function appendLocEntry(box, entry, i, formBox, main) {
    const card = document.createElement('div');
    card.className = 'ws-line-card';
    const type = entry.type || 'scene';
    // 生成 id 选择器内容
    let idSelector = '';
    if (type === 'scene') {
      const sceneIds = Object.keys(NF.SCENES).filter(k => !k.startsWith('__'));
      idSelector = '<select class="inp ws-entry-id" style="margin-bottom:8px;">' +
        '<option value="">（选择场景）</option>' +
        sceneIds.map(k => '<option value="' + k + '" ' + (entry.id===k?'selected':'') + '>' + k + '</option>').join('') +
      '</select>';
    } else if (type === 'character') {
      idSelector = '<select class="inp ws-entry-id" style="margin-bottom:8px;">' +
        CHAR_IDS.map(cid => '<option value="' + cid + '" ' + (entry.id===cid?'selected':'') + '>' + NF.CHARS[cid].name + '</option>').join('') +
      '</select>';
    } else if (type === 'minigame') {
      idSelector = '<select class="inp ws-entry-id" style="margin-bottom:8px;">' +
        MGS.map(m => '<option value="' + m.id + '" ' + (entry.id===m.id?'selected':'') + '>' + m.name + '</option>').join('') +
      '</select>';
    }
    card.innerHTML =
      '<div class="ws-line-head">' +
        '<span class="ws-line-num">入口 ' + (i+1) + '</span>' +
        '<select class="ws-line-type ws-entry-type">' +
          '<option value="scene" ' + (type==='scene'?'selected':'') + '>剧情</option>' +
          '<option value="minigame" ' + (type==='minigame'?'selected':'') + '>小游戏</option>' +
          '<option value="character" ' + (type==='character'?'selected':'') + '>角色对话</option>' +
        '</select>' +
        '<button class="ws-line-del">×</button>' +
      '</div>' +
      '<div class="ws-line-body">' +
        idSelector +
        '<input class="inp ws-entry-name" placeholder="入口名称（如：坐到吧台前）" value="' + esc(entry.name||'') + '" style="margin-bottom:8px;">' +
        '<input class="inp ws-entry-icon" placeholder="图标单字符（如 ♖）" value="' + esc(entry.icon||'') + '" maxlength="2" style="margin-bottom:8px;">' +
        '<input class="inp ws-entry-desc" placeholder="入口描述（可选）" value="' + esc(entry.desc||'') + '">' +
      '</div>';
    box.appendChild(card);

    card.querySelector('.ws-entry-type').onchange = (e) => {
      entry.type = e.target.value;
      if (entry.type === 'character') entry.id = 'cash';
      else if (entry.type === 'minigame') entry.id = 'pour';
      else entry.id = '';
      renderForm(main);
    };
    const idSel = card.querySelector('.ws-entry-id');
    if (idSel) idSel.onchange = (e) => entry.id = e.target.value;
    card.querySelector('.ws-entry-name').oninput = (e) => entry.name = e.target.value;
    card.querySelector('.ws-entry-icon').oninput = (e) => entry.icon = e.target.value;
    card.querySelector('.ws-entry-desc').oninput = (e) => entry.desc = e.target.value;
    card.querySelector('.ws-line-del').onclick = () => {
      NF.Sfx.click();
      wsFormData.entries.splice(i, 1);
      renderForm(main);
    };
  }

  function saveLocation(formBox) {
    const name = formBox.querySelector('#wsLocName').value.trim();
    if (!name) { NF.toast('请填地点名','warn'); return; }
    // 过滤掉没填 id 的无效入口
    const entries = (wsFormData.entries || []).filter(e => e.id && e.name);
    const key = wsEditKey || ('loc_' + Date.now());
    const data = {
      key, name,
      bg: formBox.querySelector('#wsLocBg').value,
      region: formBox.querySelector('#wsLocRegion').value.trim() || '其他',
      desc: formBox.querySelector('#wsLocDesc').value.trim(),
      entries, ts: Date.now()
    };
    const list = NF.userContent().locations;
    const idx = list.findIndex(x => x.key === key);
    if (idx >= 0) list[idx] = data;
    else list.push(data);
    NF.saveUser();
    NF.Sfx.success();
    NF.toast('◈ 地点已保存：' + name, 'ok');
    wsFormData = null; wsEditKey = null; wsEditKind = null;
    renderForm(document.querySelector('#wsMain'));
    renderList(document.querySelector('#wsMain'));
    if (NF.renderMap) NF.renderMap();
    if (NF.renderTOC) NF.renderTOC();
  }

  /* ─────────────── 乙游话题表单 ─────────────── */
  function renderBondForm(box, main) {
    if (!wsFormData) wsFormData = blankBond();
    box.innerHTML =
      '<div class="ws-field"><label>角 色</label><select class="inp" id="wsBondChar">' +
        CHAR_IDS.map(id => '<option value="' + id + '" ' + (wsFormData.charId===id?'selected':'') + '>' + NF.CHARS[id].name + '</option>').join('') +
      '</select></div>' +
      '<div class="ws-field"><label>类 型</label><select class="inp" id="wsBondMode">' +
        '<option value="chat" ' + (wsFormData.mode==='chat'?'selected':'') + '>闲聊</option>' +
        '<option value="deep" ' + (wsFormData.mode==='deep'?'selected':'') + '>深谈</option>' +
      '</select></div>' +
      '<div class="ws-field"><label>话 题 标 题 <b>（必填）</b></label><input class="inp" id="wsBondTitle" value="' + esc(wsFormData.title) + '" placeholder="例如：「今日份的闲聊」"></div>' +
      '<div class="ws-field"><label>好 感 门 槛（0-100）</label><input class="inp" id="wsBondNeed" type="number" min="0" max="100" value="' + wsFormData.need + '"></div>' +
      '<div class="ws-field"><label>对 话</label><div class="ws-lines" id="wsBondLines"></div><button class="ws-add-line" id="wsBondAddLine">＋ 添加一行</button></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;"><button class="btn ghost" id="wsCancel">取消</button><button class="btn primary" id="wsSave">保存</button></div>';

    const linesBox = box.querySelector('#wsBondLines');
    wsFormData.lines.forEach((l, i) => appendBondLine(linesBox, l, i, box, main));
    box.querySelector('#wsBondChar').onchange = (e) => wsFormData.charId = e.target.value;
    box.querySelector('#wsBondMode').onchange = (e) => wsFormData.mode = e.target.value;
    box.querySelector('#wsBondTitle').oninput = (e) => wsFormData.title = e.target.value;
    box.querySelector('#wsBondNeed').oninput = (e) => wsFormData.need = parseInt(e.target.value) || 0;
    box.querySelector('#wsBondAddLine').onclick = () => { NF.Sfx.click(); wsFormData.lines.push({ who: wsFormData.charId, en:'', cn:'' }); renderForm(main); };
    box.querySelector('#wsCancel').onclick = () => { NF.Sfx.click(); wsFormData=null; wsEditKey=null; wsEditKind=null; renderForm(main); };
    box.querySelector('#wsSave').onclick = () => saveBond(box);
  }

  function appendBondLine(box, line, i, formBox, main) {
    const card = document.createElement('div');
    card.className = 'ws-line-card';
    card.innerHTML =
      '<div class="ws-line-head"><span class="ws-line-num">行 ' + (i+1) + '</span><button class="ws-line-del">×</button></div>' +
      '<div class="ws-line-body">' +
        '<select class="inp ws-who" style="margin-bottom:8px;">' +
          '<option value="' + wsFormData.charId + '" ' + (line.who===wsFormData.charId?'selected':'') + '>' + NF.CHARS[wsFormData.charId].name + '</option>' +
          '<option value="me" ' + (line.who==='me'?'selected':'') + '>主角（你）</option>' +
          '<option value="narrator" ' + (line.who==='narrator'?'selected':'') + '>旁白</option>' +
        '</select>' +
        '<input class="inp ws-en" placeholder="英文台词（可选）" value="' + esc(line.en||'') + '" style="font-family:var(--f-en);font-style:italic;margin-bottom:8px;">' +
        '<input class="inp ws-cn" placeholder="中文内容" value="' + esc(line.cn||'') + '">' +
      '</div>';
    box.appendChild(card);
    card.querySelector('.ws-who').onchange = (e) => line.who = e.target.value;
    card.querySelector('.ws-en').oninput = (e) => line.en = e.target.value;
    card.querySelector('.ws-cn').oninput = (e) => line.cn = e.target.value;
    card.querySelector('.ws-line-del').onclick = () => { NF.Sfx.click(); if (wsFormData.lines.length<=1) return; wsFormData.lines.splice(i,1); renderForm(main); };
  }

  function saveBond(box) {
    const title = box.querySelector('#wsBondTitle').value.trim();
    if (!title) { NF.toast('请填话题标题','warn'); return; }
    const lines = wsFormData.lines.filter(l => l.cn && l.cn.trim());
    if (!lines.length) { NF.toast('至少一行对话','warn'); return; }
    const key = wsEditKey || ('bond_' + Date.now());
    const data = {
      key,
      charId: box.querySelector('#wsBondChar').value,
      mode: box.querySelector('#wsBondMode').value,
      title,
      need: parseInt(box.querySelector('#wsBondNeed').value) || 0,
      lines, ts: Date.now()
    };
    const list = NF.userContent().bondTopics;
    const idx = list.findIndex(x => x.key === key);
    if (idx >= 0) list[idx] = data;
    else list.push(data);
    NF.saveUser();
    NF.Sfx.success();
    NF.toast('◈ 话题已保存','ok');
    wsFormData = null; wsEditKey = null; wsEditKind = null;
    renderForm(document.querySelector('#wsMain'));
    renderList(document.querySelector('#wsMain'));
    if (NF.renderBondGrid) NF.renderBondGrid();
    if (NF.renderTOC) NF.renderTOC();
  }

  /* ─────────────── 礼物表单 ─────────────── */
  function renderGiftForm(box, main) {
    if (!wsFormData) wsFormData = blankGift();
    box.innerHTML =
      '<div class="ws-field"><label>礼 物 名 称 <b>（必填）</b></label><input class="inp" id="wsGiftName" value="' + esc(wsFormData.name) + '"></div>' +
      '<div class="ws-field"><label>图 标（单字符）</label><input class="inp" id="wsGiftIcon" value="' + esc(wsFormData.icon) + '" maxlength="2"></div>' +
      '<div class="ws-field"><label>银 镑 价 格</label><input class="inp" id="wsGiftCost" type="number" value="' + wsFormData.cost + '"></div>' +
      '<div class="ws-field"><label>好 感 加 成</label><input class="inp" id="wsGiftAff" type="number" value="' + wsFormData.aff + '"></div>' +
      '<div class="ws-field"><label>喜 欢 的 角 色（多选）</label><div style="display:flex;flex-wrap:wrap;gap:10px;" id="wsGiftLikes">' +
        CHAR_IDS.map(id => '<label style="font-size:11.5px;color:var(--text);letter-spacing:.08em;cursor:pointer;display:flex;align-items:center;gap:4px;"><input type="checkbox" data-char="' + id + '" ' + (wsFormData.likes.includes(id)?'checked':'') + '>' + NF.CHARS[id].name + '</label>').join('') +
      '</div></div>' +
      '<div class="ws-field"><label>描 述</label><input class="inp" id="wsGiftDesc" value="' + esc(wsFormData.desc) + '"></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;"><button class="btn ghost" id="wsCancel">取消</button><button class="btn primary" id="wsSave">保存</button></div>';

    box.querySelector('#wsGiftName').oninput = (e) => wsFormData.name = e.target.value;
    box.querySelector('#wsGiftIcon').oninput = (e) => wsFormData.icon = e.target.value;
    box.querySelector('#wsGiftCost').oninput = (e) => wsFormData.cost = parseInt(e.target.value) || 0;
    box.querySelector('#wsGiftAff').oninput = (e) => wsFormData.aff = parseInt(e.target.value) || 0;
    box.querySelector('#wsGiftDesc').oninput = (e) => wsFormData.desc = e.target.value;
    box.querySelectorAll('#wsGiftLikes input').forEach(cb => {
      cb.onchange = () => {
        const cid = cb.dataset.char;
        if (cb.checked) { if (!wsFormData.likes.includes(cid)) wsFormData.likes.push(cid); }
        else wsFormData.likes = wsFormData.likes.filter(x => x !== cid);
      };
    });
    box.querySelector('#wsCancel').onclick = () => { NF.Sfx.click(); wsFormData=null; wsEditKey=null; wsEditKind=null; renderForm(main); };
    box.querySelector('#wsSave').onclick = () => saveGift(box);
  }

  function saveGift(box) {
    const name = box.querySelector('#wsGiftName').value.trim();
    if (!name) { NF.toast('请填礼物名','warn'); return; }
    const key = wsEditKey || ('gift_' + Date.now());
    const data = {
      key, name,
      icon: box.querySelector('#wsGiftIcon').value || '✦',
      cost: parseInt(box.querySelector('#wsGiftCost').value) || 0,
      aff: parseInt(box.querySelector('#wsGiftAff').value) || 0,
      likes: wsFormData.likes,
      desc: box.querySelector('#wsGiftDesc').value.trim(),
      ts: Date.now()
    };
    const list = NF.userContent().gifts;
    const idx = list.findIndex(x => x.key === key);
    if (idx >= 0) list[idx] = data;
    else list.push(data);
    NF.saveUser();
    NF.Sfx.success();
    NF.toast('◈ 礼物已保存','ok');
    wsFormData = null; wsEditKey = null; wsEditKind = null;
    renderForm(document.querySelector('#wsMain'));
    renderList(document.querySelector('#wsMain'));
  }

  /* ─────────────── CG 表单 ─────────────── */
  function renderCGForm(box, main) {
    if (!wsFormData) wsFormData = blankCG();
    box.innerHTML =
      '<div class="ws-field"><label>角 色</label><select class="inp" id="wsCgChar">' +
        CHAR_IDS.map(id => '<option value="' + id + '" ' + (wsFormData.charId===id?'selected':'') + '>' + NF.CHARS[id].name + '</option>').join('') +
      '</select></div>' +
      '<div class="ws-field"><label>标 题 <b>（必填）</b></label><input class="inp" id="wsCgTitle" value="' + esc(wsFormData.title) + '"></div>' +
      '<div class="ws-field"><label>副 标 题</label><input class="inp" id="wsCgSub" value="' + esc(wsFormData.subtitle) + '"></div>' +
      '<div class="ws-field"><label>好 感 门 槛</label><input class="inp" id="wsCgNeed" type="number" value="' + wsFormData.need + '"></div>' +
      '<div class="ws-field"><label>对 话</label><div class="ws-lines" id="wsCgLines"></div><button class="ws-add-line" id="wsCgAddLine">＋ 添加一行</button></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;"><button class="btn ghost" id="wsCancel">取消</button><button class="btn primary" id="wsSave">保存</button></div>';

    const linesBox = box.querySelector('#wsCgLines');
    wsFormData.lines.forEach((l, i) => appendCGLine(linesBox, l, i, box, main));
    box.querySelector('#wsCgChar').onchange = (e) => wsFormData.charId = e.target.value;
    box.querySelector('#wsCgTitle').oninput = (e) => wsFormData.title = e.target.value;
    box.querySelector('#wsCgSub').oninput = (e) => wsFormData.subtitle = e.target.value;
    box.querySelector('#wsCgNeed').oninput = (e) => wsFormData.need = parseInt(e.target.value) || 0;
    box.querySelector('#wsCgAddLine').onclick = () => { NF.Sfx.click(); wsFormData.lines.push({ cn:'' }); renderForm(main); };
    box.querySelector('#wsCancel').onclick = () => { NF.Sfx.click(); wsFormData=null; wsEditKey=null; wsEditKind=null; renderForm(main); };
    box.querySelector('#wsSave').onclick = () => saveCG(box);
  }

  function appendCGLine(box, line, i, formBox, main) {
    const card = document.createElement('div');
    card.className = 'ws-line-card';
    card.innerHTML =
      '<div class="ws-line-head"><span class="ws-line-num">行 ' + (i+1) + '</span>' +
        '<select class="ws-line-type"><option value="n" ' + ((line.type==='n'||!line.type)?'selected':'') + '>旁白</option><option value="s" ' + (line.type==='s'?'selected':'') + '>角色</option><option value="me" ' + (line.type==='me'?'selected':'') + '>主角</option></select>' +
        '<button class="ws-line-del">×</button></div>' +
      '<div class="ws-line-body">' +
        '<input class="inp ws-en" placeholder="英文台词（可选）" value="' + esc(line.en||'') + '" style="font-family:var(--f-en);font-style:italic;margin-bottom:8px;">' +
        '<input class="inp ws-cn" placeholder="中文内容" value="' + esc(line.cn||'') + '">' +
      '</div>';
    box.appendChild(card);
    card.querySelector('.ws-line-type').onchange = (e) => line.type = e.target.value;
    card.querySelector('.ws-en').oninput = (e) => line.en = e.target.value;
    card.querySelector('.ws-cn').oninput = (e) => line.cn = e.target.value;
    card.querySelector('.ws-line-del').onclick = () => { NF.Sfx.click(); if (wsFormData.lines.length<=1) return; wsFormData.lines.splice(i,1); renderForm(main); };
  }

  function saveCG(box) {
    const title = box.querySelector('#wsCgTitle').value.trim();
    if (!title) { NF.toast('请填标题','warn'); return; }
    const lines = wsFormData.lines.filter(l => l.cn && l.cn.trim());
    if (!lines.length) { NF.toast('至少一行','warn'); return; }
    const key = wsEditKey || ('cg_' + Date.now());
    const data = {
      key,
      charId: box.querySelector('#wsCgChar').value,
      title,
      subtitle: box.querySelector('#wsCgSub').value.trim(),
      need: parseInt(box.querySelector('#wsCgNeed').value) || 0,
      lines, ts: Date.now()
    };
    const list = NF.userContent().cgs;
    const idx = list.findIndex(x => x.key === key);
    if (idx >= 0) list[idx] = data;
    else list.push(data);
    NF.saveUser();
    NF.Sfx.success();
    NF.toast('◈ 特殊剧情已保存','ok');
    wsFormData = null; wsEditKey = null; wsEditKind = null;
    renderForm(document.querySelector('#wsMain'));
    renderList(document.querySelector('#wsMain'));
    if (NF.renderBondGrid) NF.renderBondGrid();
  }

  /* ═══════════════════════════════════════════════════════════
     已导入列表
     ═══════════════════════════════════════════════════════════ */
  function renderList(main) {
    const box = main.querySelector('#wsList');
    if (!box) return;
    const u = NF.userContent();
    const all = [
      ...(u.chapters || []).map(c => ({ ...c, _type:'chapter', _kind:c.type || 'main' })),
      ...(u.locations || []).map(l => ({ ...l, _type:'location' })),
      ...(u.bondTopics || []).map(t => ({ ...t, _type:'bond' })),
      ...(u.gifts || []).map(g => ({ ...g, _type:'gift' })),
      ...(u.cgs || []).map(c => ({ ...c, _type:'cg' }))
    ].sort((a, b) => (b.ts||0) - (a.ts||0));

    if (!all.length) {
      box.innerHTML = '<div class="empty">还没有任何导入内容。<br>选一个类型开始写吧。</div>';
      return;
    }

    let html = '<div class="ws-pack-list">';
    all.forEach(item => {
      const t = new Date(item.ts || Date.now());
      const time = t.getFullYear()+'/'+(t.getMonth()+1)+'/'+t.getDate()+' '+String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0');
      const typeLabel = {
        chapter: item._kind === 'dungeon' ? '副本' : (item._kind === 'side' ? '支线' : '章节'),
        location: '地点', bond: '乙游话题', gift: '礼物', cg: 'CG'
      }[item._type] || item._type;
      const name = item.title || item.name || item.key;
      html += '<div class="ws-pack" data-key="' + esc(item.key) + '" data-type="' + item._type + '" data-kind="' + (item._kind||'') + '">' +
        '<div class="ws-pack-head"><div class="ws-pack-title">' + esc(name) + '</div><div style="font-size:11px;color:var(--gold-d);">' + typeLabel + '</div></div>' +
        '<div class="ws-pack-meta">' + time + '</div>' +
        '<div class="ws-pack-actions">' +
          '<button class="mini-btn" data-a="edit">编辑</button>' +
          '<button class="mini-btn danger" data-a="del">删除</button>' +
        '</div>' +
      '</div>';
    });
    html += '</div>';
    box.innerHTML = html;

    box.querySelectorAll('.ws-pack').forEach(el => {
      const key = el.dataset.key;
      const type = el.dataset.type;
      const kind = el.dataset.kind;
      el.querySelector('[data-a="edit"]').onclick = () => {
        NF.Sfx.click();
        wsEditKey = key;
        wsEditKind = kind || null;
        wsType = type === 'chapter' ? (kind === 'dungeon' ? 'dungeon' : 'chapter') : type;
        const u = NF.userContent();
        if (type === 'chapter') wsFormData = JSON.parse(JSON.stringify(u.chapters.find(x => x.key === key) || blankChapter(kind)));
        else if (type === 'location') wsFormData = JSON.parse(JSON.stringify(u.locations.find(x => x.key === key) || blankLocation()));
        else if (type === 'bond') wsFormData = JSON.parse(JSON.stringify(u.bondTopics.find(x => x.key === key) || blankBond()));
        else if (type === 'gift') wsFormData = JSON.parse(JSON.stringify(u.gifts.find(x => x.key === key) || blankGift()));
        else if (type === 'cg') wsFormData = JSON.parse(JSON.stringify(u.cgs.find(x => x.key === key) || blankCG()));
        render();
      };
      el.querySelector('[data-a="del"]').onclick = () => {
        if (!confirm('确定删除「' + el.querySelector('.ws-pack-title').textContent + '」？')) return;
        NF.Sfx.fail();
        const u = NF.userContent();
        if (type === 'chapter') u.chapters = u.chapters.filter(x => x.key !== key);
        else if (type === 'location') u.locations = u.locations.filter(x => x.key !== key);
        else if (type === 'bond') u.bondTopics = u.bondTopics.filter(x => x.key !== key);
        else if (type === 'gift') u.gifts = u.gifts.filter(x => x.key !== key);
        else if (type === 'cg') u.cgs = u.cgs.filter(x => x.key !== key);
        NF.saveUser();
        NF.toast('◈ 已删除','ok');
        render();
        if (NF.renderMap) NF.renderMap();
        if (NF.renderBondGrid) NF.renderBondGrid();
        if (NF.renderTOC) NF.renderTOC();
      };
    });
  }

  /* ═══════════════════════════════════════════════════════════
     暴露给 index.html
     ═══════════════════════════════════════════════════════════ */
  window.Workshop = { render };

  /* 兜底：DOM 就绪后如果还在工坊页则立即渲染 */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if ($('#screen-workshop')?.classList.contains('active')) render();
    });
  }

})();
