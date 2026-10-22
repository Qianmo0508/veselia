/* ═══════════════════════════════════════════════════════════
   workshop.js · v2 · 支持选项的批量导入 + 全表单
   依赖 index.html 暴露的 window.NF
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.NF) { console.error('[workshop] window.NF 未找到'); return; }
  const NF = window.NF;
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  let wsType = 'chapter';
  let wsEditKey = null;
  let wsFormData = null;
  let wsEditKind = null;

  function blankChapter(kind) {
    return { type: kind === 'dungeon' ? 'dungeon' : 'main', title:'', subtitle:'', location:'', bg:'city', lines: [{ type:'n', cn:'' }], branches: null };
  }
  function blankLocation() { return { name:'', region:'索姆尼亚帝国', bg:'city', desc:'', entries: [] }; }
  function blankBond() { return { charId:'cash', mode:'chat', title:'', need:0, lines:[{ who:'cash', en:'', cn:'' }] }; }
  function blankGift() { return { name:'', icon:'✦', cost:10, aff:5, likes:[], desc:'' }; }
  function blankCG() { return { charId:'cash', title:'', subtitle:'', need:30, lines:[{ cn:'' }] }; }

  const CHAR_IDS = ['tavana','movioa','lidia','elsia','fiman','cash','reifina','cassi'];
  const BGS = ['city','tavern','grove','manor','archive','church','castle','dream'];
  const MGS = [
    { id:'pour', name:'调酒 (QTE)' },
    { id:'evidence', name:'证据链连线' },
    { id:'chess', name:'残局走位' },
    { id:'puzzle', name:'光影拼图' },
    { id:'dream', name:'梦域副本' }
  ];

  /* ═══ 角色别名 ═══ */
  const CHAR_ALIASES = {
    'fiman': ['fiman','Fiman','菲曼','菲曼·卡桑拉'],
    'cash':  ['cash','Cash','卡什','卡什·洛克威尔','Kash'],
    'tavana':['tavana','Tavana','塔瓦娜','塔瓦娜·卡伊','塔瓦娜·凯','Kay'],
    'movioa':['movioa','Movioa','莫维奥娅','莫维奥娅·沃特森','Watson'],
    'lidia': ['lidia','Lidia','莉迪亚','莉迪亚·简','Jane'],
    'elsia': ['elsia','Elsia','艾尔丝娅','艾尔丝亚','艾尔丝娅·简'],
    'reifina':['reifina','Reifina','瑞菲纳'],
    'cassi': ['cassi','Cassi','卡修斯尔'],
    'morpheus':['morpheus','Morpheus','摩耳甫斯','梦魇']
  };
  function matchCharId(name) {
    if (!name) return name;
    const n = name.trim();
    for (const id in CHAR_ALIASES) {
      if (CHAR_ALIASES[id].some(a => a === n || a.toLowerCase() === n.toLowerCase())) return id;
    }
    for (const id in CHAR_ALIASES) {
      if (CHAR_ALIASES[id].some(a => n.includes(a) || a.includes(n))) return id;
    }
    return n;
  }

  /* ═══════════════════════════════════════════════════════════
     扩展批量格式解析器
     ═══════════════════════════════════════════════════════════
     指令：
       # 标题            → title
       ## 副标题         → subtitle
       @地点             → location
       !背景             → bg
       --- / ===         → 分隔（忽略）
       ? 选项文字 -> 标签 [!条件] [效果]   → choice
       :标签             → 分支开始
       -> 标签           → 跳到某分支
     条件：
       !aff.cash>=20     → 卡什好感 ≥ 20
       !flag.metCash     → flag
       !silver>=50       → 银镑 ≥ 50
       !vars.xxx==yyy    → 自定义变量
     效果（行尾）：
       {aff:cash+5}
       {silver+20} {silver-5}
       {flag:metCash}
     ═══════════════════════════════════════════════════════════ */

  /* 解析效果串：{aff:cash+5} {silver+20} {flag:metCash} */
  function parseEffects(str) {
    const fx = {};
    if (!str) return fx;
    const affRe = /\{aff:([a-z]+)([+-])(\d+)\}/g;
    let m;
    while ((m = affRe.exec(str)) !== null) {
      if (!fx.aff) fx.aff = {};
      fx.aff[m[1]] = (fx.aff[m[1]] || 0) + (m[2] === '+' ? parseInt(m[3]) : -parseInt(m[3]));
    }
    const silverRe = /\{silver([+-])(\d+)\}/g;
    while ((m = silverRe.exec(str)) !== null) {
      fx.silver = (fx.silver || 0) + (m[1] === '+' ? parseInt(m[2]) : -parseInt(m[2]));
    }
    const flagRe = /\{flag:([a-zA-Z0-9_]+)\}/g;
    while ((m = flagRe.exec(str)) !== null) {
      if (!fx.flags) fx.flags = {};
      fx.flags[m[1]] = true;
    }
    return fx;
  }

  /* 解析条件串（!之后的部分）：
     aff.cash>=20 | flag.metCash | silver>=50 | vars.xxx==yyy */
  function parseCondition(str) {
    if (!str) return null;
    const s = str.trim();
    // aff.xxx>=n / aff.xxx<=n / aff.xxx>n / aff.xxx<n
    let m = s.match(/^aff\.([a-z]+)\s*(>=|<=|>|<|==)\s*(\d+)$/);
    if (m) {
      const charId = m[1], op = m[2], val = parseInt(m[3]);
      return (st) => {
        const v = (st?.affection?.[charId]) || 0;
        switch (op) {
          case '>=': return v >= val;
          case '<=': return v <= val;
          case '>': return v > val;
          case '<': return v < val;
          case '==': return v === val;
        }
        return true;
      };
    }
    // flag.xxx
    m = s.match(/^flag\.([a-zA-Z0-9_]+)$/);
    if (m) {
      const key = m[1];
      return (st) => !!st?.flags?.[key];
    }
    // silver>=n
    m = s.match(/^silver\s*(>=|<=|>|<|==)\s*(\d+)$/);
    if (m) {
      const op = m[1], val = parseInt(m[2]);
      return (st) => {
        const v = (st?.stats?.silver) || 0;
        switch (op) {
          case '>=': return v >= val;
          case '<=': return v <= val;
          case '>': return v > val;
          case '<': return v < val;
          case '==': return v === val;
        }
        return true;
      };
    }
    // vars.xxx==yyy
    m = s.match(/^vars\.([a-zA-Z0-9_]+)\s*==\s*["']?([^"']*)["']?$/);
    if (m) {
      const key = m[1], val = m[2];
      return (st) => String(st?.vars?.[key]) === String(val);
    }
    return null;
  }

  /* 拆分一行到 选项文本 / 目标标签 / 条件 / 效果 */
  function parseChoiceLine(line) {
    // ? 选项文字 -> 标签 [!条件] [效果]
    // 或 ? 选项文字 -> 标签 {aff:cash+5} !aff.cash>=20
    if (!line.startsWith('?')) return null;
    let rest = line.slice(1).trim();
    if (!rest) return null;
    // 提取所有 {...} 效果
    const effects = (rest.match(/\{[^}]*\}/g) || []).join(' ');
    rest = rest.replace(/\{[^}]*\}/g, '').trim();
    // 提取所有 !条件
    let condition = null;
    const condMatch = rest.match(/\s+!([a-zA-Z0-9_.]+[<>=!]*\d*|flag\.[a-zA-Z0-9_]+|vars\.[a-zA-Z0-9_]+(==[^ ]+)?)$/);
    // 简化：找最后一个 !xxx 作为条件
    const condRe = /\s+(![a-zA-Z0-9_.]+(?:[<>=]+\d+)?)\s*$/;
    const cm = rest.match(condRe);
    if (cm) {
      condition = cm[1].slice(1);
      rest = rest.slice(0, cm.index).trim();
    }
    // 找 ->
    const arrowIdx = rest.indexOf('->');
    if (arrowIdx < 0) return { text: rest, next: null, condition: parseCondition(condition), effects: parseEffects(effects) };
    const text = rest.slice(0, arrowIdx).trim();
    const next = rest.slice(arrowIdx + 2).trim();
    return {
      text,
      next: next || null,
      condition: parseCondition(condition),
      effects: parseEffects(effects)
    };
  }

  /* 解析完整批量文本 → 结构：
     {
       title, subtitle, location, bg,
       nodes: {
         main: [{ type:'n'|'s'|'me', cn, en, who } | { type:'choice', choices:[{text, next, condition, effects}] }],
         分支标签: [...]
       }
     } */
  function parseBulkText(text) {
    const result = { title:'', subtitle:'', location:'', bg:'city', nodes: { main: [] } };
    if (!text) return result;
    const rawLines = text.split(/\r?\n/);
    let currentKey = 'main';
    let currentNode = result.nodes.main;

    for (let raw of rawLines) {
      const line = raw.trim();
      if (!line) continue;

      /* 指令头 */
      if (line.startsWith('## ')) { result.subtitle = line.slice(3).trim(); continue; }
      if (line.startsWith('#')) { result.title = line.replace(/^#+\s*/, '').trim(); continue; }
      if (line.startsWith('@')) { result.location = line.slice(1).trim(); continue; }
      if (line.startsWith('!') && BGS.includes(line.slice(1).trim())) { result.bg = line.slice(1).trim(); continue; }
      if (/^[-=*]{3,}$/.test(line)) continue;

      /* 分支开始 :标签 */
      if (line.startsWith(':')) {
        const key = line.slice(1).trim();
        if (!key) continue;
        currentKey = key;
        if (!result.nodes[currentKey]) result.nodes[currentKey] = [];
        currentNode = result.nodes[currentKey];
        continue;
      }

      /* 跳到某分支 -> 标签（或 -> 结束） */
      if (line.startsWith('->')) {
        const target = line.slice(2).trim();
        currentNode.push({ type: 'jump', to: target || 'end' });
        continue;
      }

      /* 选项 ? */
      if (line.startsWith('?')) {
        const choice = parseChoiceLine(line);
        if (!choice) continue;
        // 找最后一条是不是 choice，如果是就合并
        const last = currentNode[currentNode.length - 1];
        if (last && last.type === 'choice') {
          last.choices.push(choice);
        } else {
          currentNode.push({ type: 'choice', choices: [choice] });
        }
        continue;
      }

      /* 单独的效果行 {aff:cash+5} */
      if (/^\{[^}]+\}$/.test(line)) {
        currentNode.push({ type: 'effect', effects: parseEffects(line) });
        continue;
      }

      /* 主角内心独白（括号） */
      if (/^[（(].+[）)]$/.test(line)) {
        currentNode.push({ type: 'me', cn: line.slice(1, -1).trim(), en: '' });
        continue;
      }

      /* 冒号分隔 */
      const colonMatch = line.match(/^([^:：]{1,30})[:：](.+)$/);
      if (colonMatch) {
        const who = colonMatch[1].trim();
        let body = colonMatch[2].trim();
        if (!body) continue;
        // 行尾效果
        const effects = (body.match(/\{[^}]*\}/g) || []).join(' ');
        body = body.replace(/\{[^}]*\}/g, '').trim();
        let en = '', cn = body;
        const pipeIdx = body.indexOf('|');
        if (pipeIdx >= 0) { en = body.slice(0, pipeIdx).trim(); cn = body.slice(pipeIdx + 1).replace(/^\|/, '').trim(); }
        const isMe = ['我','主角','你','我(主角)','主人公'].includes(who);
        if (isMe) {
          currentNode.push({ type: 'me', cn, en });
        } else {
          currentNode.push({ type: 'dialogue', who: matchCharId(who), char: who, cn, en });
        }
        if (effects) currentNode.push({ type: 'effect', effects: parseEffects(effects) });
        continue;
      }

      /* 其他 → 旁白 */
      currentNode.push({ type: 'narration', cn: line });
    }

    return result;
  }

  /* ═══ 预览渲染 ═══ */
  function renderBulkPreview(box, result) {
    if (!result) { box.innerHTML = ''; return; }
    let html = '';
    const meta = [];
    if (result.title) meta.push('标题：' + esc(result.title));
    if (result.subtitle) meta.push('副标题：' + esc(result.subtitle));
    if (result.location) meta.push('地点：' + esc(result.location));
    if (result.bg && result.bg !== 'city') meta.push('背景：' + esc(result.bg));
    if (meta.length) html += '<div style="font-size:11px;color:var(--gold-d);letter-spacing:.08em;padding-bottom:10px;margin-bottom:10px;border-bottom:1px dashed var(--line);line-height:1.7;">' + meta.join('　·　') + '</div>';

    const nodeKeys = Object.keys(result.nodes);
    let totalLines = 0, totalChoices = 0;
    nodeKeys.forEach(k => {
      const node = result.nodes[k];
      totalLines += node.length;
      node.forEach(n => { if (n.type === 'choice') totalChoices += n.choices.length; });
    });

    if (!totalLines) {
      html += '<p style="color:var(--text-d);font-style:italic;font-size:12px;">尚未输入任何内容。</p>';
    } else {
      nodeKeys.forEach(k => {
        const isMain = k === 'main';
        if (!isMain) {
          html += '<div style="margin-top:16px;padding:6px 10px;background:rgba(201,169,97,.08);border-left:2px solid var(--gold);font-size:11px;color:var(--gold-b);letter-spacing:.12em;">分支 · ' + esc(k) + '</div>';
        }
        result.nodes[k].forEach((n, i) => {
          if (n.type === 'choice') {
            html += '<div style="padding:8px 0;border-top:1px dashed rgba(201,169,97,.1);">' +
              '<div style="font-size:10.5px;letter-spacing:.14em;color:var(--gold-d);margin-bottom:4px;">◇ 选项' + (n.choices.some(c=>c.condition) ? '（含条件）' : '') + '</div>';
            n.choices.forEach((c, j) => {
              html += '<div style="font-size:12.5px;color:var(--text);line-height:1.7;padding:3px 0 3px 12px;border-left:2px solid rgba(201,169,97,.3);margin-bottom:4px;">' +
                '<span style="color:var(--gold);font-family:var(--f-sym);">' + '①②③④⑤⑥⑦⑧⑨'.charAt(j) + '</span> ' +
                esc(c.text) +
                (c.next ? ' <span style="color:var(--gold-d);font-size:10.5px;">→ ' + esc(c.next) + '</span>' : '') +
                (c.condition ? ' <span style="color:#d08a9c;font-size:10px;">[条件]</span>' : '') +
                (c.effects && Object.keys(c.effects).length ? ' <span style="color:#9dd0a0;font-size:10px;">[效果]</span>' : '') +
              '</div>';
            });
            html += '</div>';
          } else if (n.type === 'jump') {
            html += '<div style="padding:8px 0;border-top:1px dashed rgba(201,169,97,.1);">' +
              '<div style="font-size:10.5px;letter-spacing:.14em;color:var(--gold-d);margin-bottom:4px;">→ 跳转</div>' +
              '<div style="font-size:12px;color:var(--gold-b);">→ ' + esc(n.to) + '</div>' +
            '</div>';
          } else if (n.type === 'effect') {
            const parts = [];
            if (n.effects.aff) for (const k2 in n.effects.aff) parts.push('好感 ' + k2 + ' ' + (n.effects.aff[k2] >= 0 ? '+' : '') + n.effects.aff[k2]);
            if (n.effects.silver) parts.push('银镑 ' + (n.effects.silver >= 0 ? '+' : '') + n.effects.silver);
            if (n.effects.flags) for (const k2 in n.effects.flags) parts.push('flag ' + k2);
            html += '<div style="padding:6px 0;color:#9dd0a0;font-size:11px;letter-spacing:.06em;">◇ 效果：' + esc(parts.join('　')) + '</div>';
          } else {
            const isNarr = n.type === 'narration';
            const isMe = n.type === 'me';
            let speaker = '';
            if (n.type === 'dialogue') {
              const ch = NF.CHARS[n.who];
              speaker = ch ? ch.name : (n.char || n.who || '？？？');
            } else if (isMe) speaker = NF.state()?.player?.name || '记者';
            html += '<div style="padding:8px 0;' + (i>0?'border-top:1px dashed rgba(201,169,97,.1);':'') + '">' +
              '<div style="font-size:10.5px;letter-spacing:.14em;color:var(--gold-d);margin-bottom:3px;">' + (isNarr ? '旁白' : (isMe ? '主角 · ' + esc(speaker) : '角色 · ' + esc(speaker))) + '</div>';
            if (n.en) html += '<div style="font-family:var(--f-en);font-style:italic;font-size:13px;color:var(--gold-b);line-height:1.6;">' + esc(n.en) + '</div>';
            if (n.cn) html += '<div style="font-size:12.5px;color:' + (isNarr?'var(--text-d)':'var(--text)') + ';line-height:1.75;' + (isNarr?'font-style:italic;':'') + '">' + esc(n.cn) + '</div>';
            html += '</div>';
          }
        });
      });
      html += '<div style="text-align:center;font-size:11px;color:var(--gold-d);padding-top:12px;margin-top:12px;border-top:1px dashed var(--line);letter-spacing:.14em;">共 ' + totalLines + ' 个节点' + (totalChoices ? ' · ' + totalChoices + ' 个选项' : '') + '</div>';
    }
    box.innerHTML = html;
  }

  const BULK_TEMPLATE =
`# 第一章 · 塔瓦娜
## 面见院长
@梦目院总部 · 大厅
!manor

梦目院的大厅比想象中安静。高耸的石柱，冷白色的穹顶。

塔瓦娜：Welcome. Please, sit. Coffee? | 「欢迎。请坐。咖啡？」
塔瓦娜：I'll be direct. You want to investigate the nightmare. I want to know why. | 「我直说了。你想调查魇。我想知道为什么。」

? 「我是记者。这是我的职责。」 -> 职责线
? 「我在王翼见过不该看见的东西。」 -> 王翼线
? 「我听说……这里有人能让人再也醒不过来。」 -> 未归线

:职责线
我：我是记者。这是我的职责。
塔瓦娜：A duty. Good. Duty is more reliable than curiosity. | 「职责。很好。职责比好奇心可靠。」
{aff:tavana+3}
-> 收束

:王翼线
我：我在王翼见过不该看见的东西。
塔瓦娜：In the Wing... What did you see? | 「在王翼……你看见了什么？」
我：一座城市。所有人都在睡觉。但没有人做梦。
塔瓦娜：That is worse than a nightmare. Much worse. | 「那比噩梦更糟。糟得多。」
{aff:tavana+5}
{flag:seenWing}
-> 收束

:未归线
我：我听说……这里有人能让人再也醒不过来。
塔瓦娜：Yes. Those are called the Unreturned. | 「是的。那些人叫未归之人。」
{aff:tavana+1}
-> 收束

:收束
塔瓦娜：One more thing. Stay away from the church. | 「还有一件事。远离教堂。」

她笑了一下，露出一点疲惫。

【条件与效果示例】
? 「问问卡什的墨镜。」 -> 墨镜线 !aff.cash>=20
? 「送他一片银杏叶。」 -> 送礼线 !silver>=5 {silver-5}{aff:cash+4}

:墨镜线
卡什：Oh, you know. Style. | 「哦，你知道的。造型。」
-> 收束`;

  function openBulkImport(formBox, main) {
    NF.openModal({
      title: '📋 批 量 导 入',
      wide: true,
      body:
        '<div class="ws-hint" style="margin-bottom:14px;line-height:1.95;font-size:11.5px;">' +
          '<b style="color:var(--gold-b);"># 标题</b>　<b style="color:var(--gold-b);">## 副标题</b>　<b style="color:var(--gold-b);">@地点</b>　<b style="color:var(--gold-b);">!背景</b><br>' +
          '<b style="color:var(--gold-b);">角色名：英文 | 中文</b>　角色台词<br>' +
          '<b style="color:var(--gold-b);">我：内容</b>　主角台词　　<b style="color:var(--gold-b);">（括号包起来）</b>　主角独白<br>' +
          '<b style="color:var(--gold-b);">? 选项文字 -> 标签</b>　选项（连续多行 = 同一组选项）<br>' +
          '<b style="color:var(--gold-b);">:标签</b>　分支开始　　<b style="color:var(--gold-b);">-> 标签</b>　跳到某分支<br>' +
          '<b style="color:var(--gold-b);">!条件</b>（行尾）：!aff.cash>=20　!flag.metCash　!silver>=50<br>' +
          '<b style="color:var(--gold-b);">效果</b>（行尾）：{aff:cash+5}　{silver+20}　{flag:metCash}' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center;">' +
          '<button class="mini-btn" id="biInsertTpl">插入示例模板</button>' +
          '<button class="mini-btn" id="biClear">清空</button>' +
          '<span style="flex:1"></span>' +
          '<select class="inp" id="biMode" style="max-width:160px;font-size:12px;padding:6px 10px;">' +
            '<option value="append">追加到末尾</option>' +
            '<option value="replace">替换全部对话</option>' +
          '</select>' +
        '</div>' +
        '<textarea class="inp" id="biText" placeholder="在此粘贴你写好的文字…" style="min-height:220px;font-family:ui-monospace,\'Courier New\',monospace;font-size:12.5px;line-height:1.75;resize:vertical;"></textarea>' +
        '<div style="margin-top:16px;font-family:var(--f-deco);font-size:11px;letter-spacing:.24em;color:var(--gold-d);">◈ PREVIEW · 解 析 预 览</div>' +
        '<div id="biPreview" style="max-height:300px;overflow-y:auto;border:1px solid var(--line);background:rgba(0,0,0,.25);padding:14px;margin-top:10px;"></div>',
      footHTML:'<button class="btn ghost" id="biCancel">取消</button><button class="btn primary" id="biOk">解 析 并 导 入</button>',
      onMount: (w) => {
        const textarea = w.querySelector('#biText');
        const preview = w.querySelector('#biPreview');
        const update = () => { renderBulkPreview(preview, parseBulkText(textarea.value)); };
        textarea.oninput = update;
        update();
        w.querySelector('#biClear').onclick = () => { textarea.value = ''; update(); NF.Sfx.click(); };
        w.querySelector('#biInsertTpl').onclick = () => { textarea.value = BULK_TEMPLATE; update(); NF.Sfx.click(); };
        w.querySelector('#biCancel').onclick = () => { NF.Sfx.click(); NF.closeModal(w); };
        w.querySelector('#biOk').onclick = () => {
          const text = textarea.value.trim();
          if (!text) { NF.toast('请先粘贴文字','warn'); return; }
          const result = parseBulkText(text);
          const totalLines = Object.keys(result.nodes).reduce((s,k)=>s+result.nodes[k].length, 0);
          if (!totalLines) { NF.toast('没有解析出任何对话','warn'); return; }
          // 转换成 wsFormData.lines + wsFormData.branches
          wsFormData.lines = convertNodesToFlatLines(result.nodes);
          wsFormData.branches = result.nodes;
          if (result.title && !wsFormData.title) wsFormData.title = result.title;
          if (result.subtitle && !wsFormData.subtitle) wsFormData.subtitle = result.subtitle;
          if (result.location && !wsFormData.location) wsFormData.location = result.location;
          if (result.bg && result.bg !== 'city') wsFormData.bg = result.bg;
          NF.Sfx.success();
          NF.toast('◈ 已导入 ' + totalLines + ' 个节点（含分支）','ok');
          NF.closeModal(w);
          renderForm(main);
        };
        setTimeout(() => textarea.focus(), 100);
      }
    });
  }

  /* 把解析出来的节点转成表单可显示的"扁平行"（用于预览/无分支情况） */
  function convertNodesToFlatLines(nodes) {
    const lines = [];
    Object.keys(nodes).forEach(key => {
      if (key !== 'main') return;
      nodes[key].forEach(n => {
        if (n.type === 'narration') lines.push({ type:'n', cn: n.cn, en: '' });
        else if (n.type === 'me') lines.push({ type:'me', cn: n.cn, en: n.en || '' });
        else if (n.type === 'dialogue') lines.push({ type:'s', who: n.who, char: n.char, cn: n.cn, en: n.en || '' });
        else if (n.type === 'choice') lines.push({ type:'choice_placeholder', cn: '[选项] ' + n.choices.map(c=>c.text).join(' / '), en: '' });
        else if (n.type === 'jump') lines.push({ type:'jump_placeholder', cn: '→ ' + n.to, en: '' });
      });
    });
    return lines.length ? lines : [{ type:'n', cn:'' }];
  }

  /* ═══ 主渲染 ═══ */
  function render() {
    const main = $('#wsMain'); if (!main) return;
    const types = [
      { id:'chapter',  label:'章节' },
      { id:'dungeon',  label:'副本' },
      { id:'location', label:'地点' },
      { id:'bond',     label:'乙游话题' },
      { id:'gift',     label:'礼物' },
      { id:'cg',       label:'特殊CG' }
    ];
    main.innerHTML =
      '<div class="ws-intro">在表单里填写内容，<b>保存后立刻能玩</b>。相同 key 会覆盖旧版本。<br>「地点」创建后，你还能往里面加剧情入口、小游戏入口、角色对话入口。<br>不想一条条填？用<b>章节/副本</b>里的「📋 批量导入」一次性贴整段文字，<b>支持选项分支</b>。<br><b>章节标题里带「第一章 / 第二章 / 第1章 / Chapter 2」会被自动排序</b>，与内置章节同序号时<b>自动覆盖内置</b>。</div>' +
      '<div class="ws-type-tabs">' + types.map(t => '<button class="ws-type-btn ' + (wsType===t.id?'on':'') + '" data-type="' + t.id + '">' + t.label + '</button>').join('') + '</div>' +
      '<div id="wsForm"></div>' +
      '<div class="divider" style="margin:26px 0 16px;"><span>已 导 入 的 内 容</span></div>' +
      '<div id="wsList"></div>';
    main.querySelectorAll('.ws-type-btn').forEach(b => {
      b.onclick = () => { NF.Sfx.click(); wsType = b.dataset.type; wsFormData = null; wsEditKey = null; wsEditKind = null; render(); };
    });
    renderForm(main);
    renderList(main);
  }

  function renderForm(main) {
    const box = main.querySelector('#wsForm'); if (!box) return;
    if (wsType === 'chapter' || wsType === 'dungeon') renderChapterForm(box, main);
    else if (wsType === 'location') renderLocationForm(box, main);
    else if (wsType === 'bond') renderBondForm(box, main);
    else if (wsType === 'gift') renderGiftForm(box, main);
    else if (wsType === 'cg') renderCGForm(box, main);
  }

  /* ─── 章节表单 ─── */
  function renderChapterForm(box, main) {
    if (!wsFormData) wsFormData = blankChapter(wsType);
    if (wsType === 'dungeon') wsFormData.type = 'dungeon';
    else if (wsType === 'chapter') wsFormData.type = 'main';

    const previewNum = NF.parseChapterNum(wsFormData.title);
    const numLabel = (previewNum !== null) ? ('第 ' + (previewNum === 0 ? '序' : previewNum) + ' 章') : '未识别（标题里带「第一章 / 第1章 / Chapter 2」即可）';
    const conflictText = (() => {
      if (previewNum === null) return '';
      const list = NF.getChapterList();
      const conflict = list.find(c => c.num === previewNum && !c.isUser);
      if (conflict) return '<div style="font-size:11px;color:#d08a9c;margin-top:6px;">⚠ 将覆盖内置章节：' + esc(conflict.name) + '</div>';
      return '';
    })();

    // 分支提示
    const hasBranches = wsFormData.branches && Object.keys(wsFormData.branches).filter(k => k !== 'main').length > 0;
    const branchInfo = hasBranches ? '<div style="font-size:11px;color:#9dd0a0;margin:-12px 0 14px;letter-spacing:.06em;">◈ 已包含 ' + (Object.keys(wsFormData.branches).length - 1) + ' 个选项分支（用「编辑对话」可查看/修改）</div>' : '';

    box.innerHTML =
      '<div class="ws-field"><label>标 题 <b>（必填）</b></label><input class="inp" id="wsTitle" value="' + esc(wsFormData.title) + '" placeholder="例如：第二章 · 夜与晨 / 第1章 / 序章"></div>' +
      '<div style="font-size:11px;color:var(--gold-d);margin:-12px 0 14px;letter-spacing:.06em;">◈ ' + esc(numLabel) + conflictText + '</div>' +
      '<div class="ws-field"><label>副 标 题</label><input class="inp" id="wsSubtitle" value="' + esc(wsFormData.subtitle) + '" placeholder="例如：落日之都的第二日"></div>' +
      '<div class="ws-field"><label>地 点</label><input class="inp" id="wsLoc" value="' + esc(wsFormData.location) + '" placeholder="例如：日不落酒馆 · 吧台"></div>' +
      '<div class="ws-field"><label>背 景</label><select class="inp" id="wsBg">' + BGS.map(b => '<option value="' + b + '" ' + (wsFormData.bg===b?'selected':'') + '>' + b + '</option>').join('') + '</select></div>' +
      '<div class="ws-field">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;flex-wrap:wrap;">' +
          '<label style="margin:0;">对 话 <b>（每行独立）</b></label>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
            '<button class="mini-btn" id="wsBulkImport" style="background:rgba(201,169,97,.12);border-color:var(--gold);color:var(--gold-b);">📋 批量导入</button>' +
            '<button class="mini-btn danger" id="wsClearLines">🗑 清空对话</button>' +
          '</div>' +
        '</div>' +
        branchInfo +
        '<p class="ws-hint">旁白只填中文；角色台词填「角色 + 英文 + 中文」；主角台词填「英文 + 中文」。</p>' +
        '<div class="ws-lines" id="wsLines"></div>' +
        '<button class="ws-add-line" id="wsAddLine">＋ 添 加 一 行</button>' +
      '</div>' +
      '<div class="ws-field"><label>预 览</label><div class="ws-preview" id="wsPreview"></div></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;"><button class="btn ghost" id="wsCancel">取消</button><button class="btn primary" id="wsSave">' + (wsEditKey?'覆盖保存':'保存并加入游戏') + '</button></div>';

    const linesBox = box.querySelector('#wsLines');
    (wsFormData.lines || []).forEach((l, i) => appendChapterLine(linesBox, l, i, box, main));
    updateChapterPreview(box);

    box.querySelector('#wsTitle').oninput = (e) => {
      wsFormData.title = e.target.value;
      const num = NF.parseChapterNum(wsFormData.title);
      const label = (num !== null) ? ('第 ' + (num === 0 ? '序' : num) + ' 章') : '未识别（标题里带「第一章 / 第1章 / Chapter 2」即可）';
      const conflictEl = box.querySelector('.ws-field label').nextElementSibling;
      if (conflictEl) {
        const conflict = (num !== null) ? NF.getChapterList().find(c => c.num === num && !c.isUser) : null;
        conflictEl.innerHTML = '◈ ' + esc(label) + (conflict ? '<div style="font-size:11px;color:#d08a9c;margin-top:6px;">⚠ 将覆盖内置章节：' + esc(conflict.name) + '</div>' : '');
      }
    };
    box.querySelector('#wsSubtitle').oninput = (e) => wsFormData.subtitle = e.target.value;
    box.querySelector('#wsLoc').oninput = (e) => wsFormData.location = e.target.value;
    box.querySelector('#wsBg').onchange = (e) => wsFormData.bg = e.target.value;
    box.querySelector('#wsAddLine').onclick = () => { NF.Sfx.click(); wsFormData.lines.push({ type:'n', cn:'' }); renderForm(main); };
    box.querySelector('#wsBulkImport').onclick = () => { NF.Sfx.click(); openBulkImport(box, main); };
    box.querySelector('#wsClearLines').onclick = () => {
      if (!confirm('确定清空所有对话行？')) return;
      NF.Sfx.click();
      wsFormData.lines = [{ type:'n', cn:'' }];
      wsFormData.branches = null;
      renderForm(main);
    };
    box.querySelector('#wsCancel').onclick = () => { NF.Sfx.click(); wsFormData=null; wsEditKey=null; wsEditKind=null; renderForm(main); };
    box.querySelector('#wsSave').onclick = () => saveChapter(box);
  }

  function appendChapterLine(box, line, i, formBox, main) {
    // 处理特殊类型（从批量导入来的占位）
    if (line.type === 'choice_placeholder' || line.type === 'jump_placeholder') {
      const card = document.createElement('div');
      card.className = 'ws-line-card';
      card.style.borderColor = 'rgba(201,169,97,.5)';
      card.style.background = 'rgba(201,169,97,.06)';
      card.innerHTML =
        '<div style="font-size:11.5px;color:var(--gold-b);letter-spacing:.08em;line-height:1.7;">' +
          (line.type === 'choice_placeholder' ? '◇ ' + esc(line.cn) + '<div style="font-size:10.5px;color:var(--gold-d);margin-top:4px;">（选项逻辑已保存。切到「📋 批量导入」可查看/修改）</div>' : '→ ' + esc(line.cn)) +
        '</div>';
      box.appendChild(card);
      return;
    }
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
    card.querySelector('.ws-line-del').onclick = () => { NF.Sfx.click(); if (wsFormData.lines.length<=1) { NF.toast('至少保留一行','warn'); return; } wsFormData.lines.splice(i,1); renderForm(main); };
  }

  function updateChapterPreview(formBox) {
    const prev = formBox.querySelector('#wsPreview'); if (!prev) return;
    prev.innerHTML = '<div class="ws-preview-title">◈ PREVIEW</div>' +
      (wsFormData.lines || []).map(l => {
        if (l.type === 'choice_placeholder') return '<div class="ws-preview-line"><div class="pp-cn" style="color:var(--gold-b);">' + esc(l.cn) + '</div></div>';
        if (l.type === 'jump_placeholder') return '<div class="ws-preview-line"><div class="pp-cn" style="color:var(--gold-d);">' + esc(l.cn) + '</div></div>';
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
    // 如果有分支，从 branches 生成 lines（供无分支场景用）；否则用表单 lines
    let lines;
    if (wsFormData.branches && Object.keys(wsFormData.branches).length > 1) {
      lines = convertNodesToFlatLines(wsFormData.branches);
    } else {
      lines = (wsFormData.lines || []).filter(l => l.cn && l.cn.trim() && l.type !== 'choice_placeholder' && l.type !== 'jump_placeholder');
    }
    if (!lines.length) { NF.toast('至少一行对话','warn'); return; }
    const chapterNum = NF.parseChapterNum(title);
    const key = wsEditKey || ('ch_' + Date.now());
    const data = {
      key, title,
      subtitle: formBox.querySelector('#wsSubtitle').value.trim(),
      location: formBox.querySelector('#wsLoc').value.trim(),
      bg: formBox.querySelector('#wsBg').value,
      type: wsFormData.type === 'dungeon' ? 'dungeon' : 'main',
      chapterNum: chapterNum,
      lines,
      branches: wsFormData.branches || null,
      ts: Date.now()
    };
    if (chapterNum !== null && (data.type === 'main')) {
      const conflict = NF.getChapterList().find(c => c.num === chapterNum && !c.isUser);
      if (conflict) {
        if (!confirm('「' + conflict.name + '」是同序号的内置章节，保存后会覆盖它。继续？')) return;
      }
    }
    const list = NF.userContent().chapters;
    const idx = list.findIndex(x => x.key === key);
    if (idx >= 0) list[idx] = data;
    else list.push(data);
    NF.saveUser();
    delete NF.SCENES['user_scene_' + key];
    NF.Sfx.success();
    NF.toast('◈ 已保存：' + title + (chapterNum !== null ? '（' + (chapterNum === 0 ? '序章' : '第 ' + chapterNum + ' 章') + '）' : ''), 'ok');
    wsFormData = null; wsEditKey = null; wsEditKind = null;
    renderForm(document.querySelector('#wsMain'));
    renderList(document.querySelector('#wsMain'));
    if (NF.renderTOC) NF.renderTOC();
  }

  /* ─── 地点表单 ─── */
  function renderLocationForm(box, main) {
    if (!wsFormData) wsFormData = blankLocation();
    box.innerHTML =
      '<div class="ws-field"><label>地 点 名 称 <b>（必填）</b></label><input class="inp" id="wsLocName" value="' + esc(wsFormData.name) + '" placeholder="例如：映月镇"></div>' +
      '<div class="ws-field"><label>所 属 区 域</label><input class="inp" id="wsLocRegion" value="' + esc(wsFormData.region) + '" placeholder="例如：索姆尼亚帝国"></div>' +
      '<div class="ws-field"><label>背 景</label><select class="inp" id="wsLocBg">' + BGS.map(b => '<option value="' + b + '" ' + (wsFormData.bg===b?'selected':'') + '>' + b + '</option>').join('') + '</select></div>' +
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
    box.querySelector('#wsLocAddEntry').onclick = () => { NF.Sfx.click(); wsFormData.entries.push({ type:'scene', id:'', name:'', icon:'◆', desc:'' }); renderForm(main); };
    box.querySelector('#wsCancel').onclick = () => { NF.Sfx.click(); wsFormData=null; wsEditKey=null; wsEditKind=null; renderForm(main); };
    box.querySelector('#wsSave').onclick = () => saveLocation(box);
  }

  function appendLocEntry(box, entry, i, formBox, main) {
    const card = document.createElement('div');
    card.className = 'ws-line-card';
    const type = entry.type || 'scene';
    let idSelector = '';
    if (type === 'scene') {
      const sceneIds = Object.keys(NF.SCENES).filter(k => !k.startsWith('__'));
      idSelector = '<select class="inp ws-entry-id" style="margin-bottom:8px;"><option value="">（选择场景）</option>' + sceneIds.map(k => '<option value="' + k + '" ' + (entry.id===k?'selected':'') + '>' + k + '</option>').join('') + '</select>';
    } else if (type === 'character') {
      idSelector = '<select class="inp ws-entry-id" style="margin-bottom:8px;">' + CHAR_IDS.map(cid => '<option value="' + cid + '" ' + (entry.id===cid?'selected':'') + '>' + NF.CHARS[cid].name + '</option>').join('') + '</select>';
    } else if (type === 'minigame') {
      idSelector = '<select class="inp ws-entry-id" style="margin-bottom:8px;">' + MGS.map(m => '<option value="' + m.id + '" ' + (entry.id===m.id?'selected':'') + '>' + m.name + '</option>').join('') + '</select>';
    }
    card.innerHTML =
      '<div class="ws-line-head"><span class="ws-line-num">入口 ' + (i+1) + '</span>' +
        '<select class="ws-line-type ws-entry-type">' +
          '<option value="scene" ' + (type==='scene'?'selected':'') + '>剧情</option>' +
          '<option value="minigame" ' + (type==='minigame'?'selected':'') + '>小游戏</option>' +
          '<option value="character" ' + (type==='character'?'selected':'') + '>角色对话</option>' +
        '</select>' +
        '<button class="ws-line-del">×</button></div>' +
      '<div class="ws-line-body">' + idSelector +
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
    card.querySelector('.ws-line-del').onclick = () => { NF.Sfx.click(); wsFormData.entries.splice(i, 1); renderForm(main); };
  }

  function saveLocation(formBox) {
    const name = formBox.querySelector('#wsLocName').value.trim();
    if (!name) { NF.toast('请填地点名','warn'); return; }
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

  /* ─── 乙游话题表单 ─── */
  function renderBondForm(box, main) {
    if (!wsFormData) wsFormData = blankBond();
    box.innerHTML =
      '<div class="ws-field"><label>角 色</label><select class="inp" id="wsBondChar">' + CHAR_IDS.map(id => '<option value="' + id + '" ' + (wsFormData.charId===id?'selected':'') + '>' + NF.CHARS[id].name + '</option>').join('') + '</select></div>' +
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
      key, charId: box.querySelector('#wsBondChar').value,
      mode: box.querySelector('#wsBondMode').value,
      title, need: parseInt(box.querySelector('#wsBondNeed').value) || 0,
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

  /* ─── 礼物表单 ─── */
  function renderGiftForm(box, main) {
    if (!wsFormData) wsFormData = blankGift();
    box.innerHTML =
      '<div class="ws-field"><label>礼 物 名 称 <b>（必填）</b></label><input class="inp" id="wsGiftName" value="' + esc(wsFormData.name) + '"></div>' +
      '<div class="ws-field"><label>图 标（单字符）</label><input class="inp" id="wsGiftIcon" value="' + esc(wsFormData.icon) + '" maxlength="2"></div>' +
      '<div class="ws-field"><label>银 镑 价 格</label><input class="inp" id="wsGiftCost" type="number" value="' + wsFormData.cost + '"></div>' +
      '<div class="ws-field"><label>好 感 加 成</label><input class="inp" id="wsGiftAff" type="number" value="' + wsFormData.aff + '"></div>' +
      '<div class="ws-field"><label>喜 欢 的 角 色（多选）</label><div style="display:flex;flex-wrap:wrap;gap:10px;" id="wsGiftLikes">' + CHAR_IDS.map(id => '<label style="font-size:11.5px;color:var(--text);letter-spacing:.08em;cursor:pointer;display:flex;align-items:center;gap:4px;"><input type="checkbox" data-char="' + id + '" ' + (wsFormData.likes.includes(id)?'checked':'') + '>' + NF.CHARS[id].name + '</label>').join('') + '</div></div>' +
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

  /* ─── CG 表单 ─── */
  function renderCGForm(box, main) {
    if (!wsFormData) wsFormData = blankCG();
    box.innerHTML =
      '<div class="ws-field"><label>角 色</label><select class="inp" id="wsCgChar">' + CHAR_IDS.map(id => '<option value="' + id + '" ' + (wsFormData.charId===id?'selected':'') + '>' + NF.CHARS[id].name + '</option>').join('') + '</select></div>' +
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
      key, charId: box.querySelector('#wsCgChar').value,
      title, subtitle: box.querySelector('#wsCgSub').value.trim(),
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

  /* ─── 列表 ─── */
  function renderList(main) {
    const box = main.querySelector('#wsList'); if (!box) return;
    const u = NF.userContent();
    const all = [
      ...(u.chapters || []).map(c => ({ ...c, _type:'chapter', _kind:c.type || 'main' })),
      ...(u.locations || []).map(l => ({ ...l, _type:'location' })),
      ...(u.bondTopics || []).map(t => ({ ...t, _type:'bond' })),
      ...(u.gifts || []).map(g => ({ ...g, _type:'gift' })),
      ...(u.cgs || []).map(c => ({ ...c, _type:'cg' }))
    ].sort((a, b) => (b.ts||0) - (a.ts||0));

    if (!all.length) { box.innerHTML = '<div class="empty">还没有任何导入内容。<br>选一个类型开始写吧。</div>'; return; }

    let html = '<div class="ws-pack-list">';
    all.forEach(item => {
      const t = new Date(item.ts || Date.now());
      const time = t.getFullYear()+'/'+(t.getMonth()+1)+'/'+t.getDate()+' '+String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0');
      let typeLabel = { chapter:'章节', dungeon:'副本', location:'地点', bond:'乙游话题', gift:'礼物', cg:'CG' }[item._type] || item._type;
      if (item._type === 'chapter') {
        const n = item.chapterNum;
        if (n !== null && n !== undefined) typeLabel = (n === 0 ? '序章' : '第 ' + n + ' 章');
        if (item.branches) typeLabel += ' · 分支';
      }
      const name = item.title || item.name || item.key;
      html += '<div class="ws-pack" data-key="' + esc(item.key) + '" data-type="' + item._type + '" data-kind="' + (item._kind||'') + '">' +
        '<div class="ws-pack-head"><div class="ws-pack-title">' + esc(name) + '</div><div style="font-size:11px;color:var(--gold-d);">' + typeLabel + '</div></div>' +
        '<div class="ws-pack-meta">' + time + '</div>' +
        '<div class="ws-pack-actions"><button class="mini-btn" data-a="edit">编辑</button><button class="mini-btn danger" data-a="del">删除</button></div>' +
      '</div>';
    });
    html += '</div>';
    box.innerHTML = html;

    box.querySelectorAll('.ws-pack').forEach(el => {
      const key = el.dataset.key, type = el.dataset.type, kind = el.dataset.kind;
      el.querySelector('[data-a="edit"]').onclick = () => {
        NF.Sfx.click();
        wsEditKey = key; wsEditKind = kind || null;
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
        delete NF.SCENES['user_scene_' + key];
        NF.toast('◈ 已删除','ok');
        render();
        if (NF.renderMap) NF.renderMap();
        if (NF.renderBondGrid) NF.renderBondGrid();
        if (NF.renderTOC) NF.renderTOC();
      };
    });
  }

  window.Workshop = { render };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if ($('#screen-workshop')?.classList.contains('active')) render();
    });
  }
})();
