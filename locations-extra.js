/* ═══════════════════════════════════════════════════════════
   locations-extra.js · 王翼国度扩容（东塔/西塔/棋局厅）
   依赖 window.NF.LOCATIONS
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.NF) { console.error('[locations-extra] NF 未找到'); return; }
  const NF = window.NF;

  /* ═══════════════════════════════════════════════════════════
     0. 动态注入东塔 / 西塔 / 棋局厅的专属日夜底纹
     （覆盖 index.html 里的滤镜，保证颜色正确）
     ═══════════════════════════════════════════════════════════ */
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    /* 强制覆盖全局的日间滤镜，避免颜色失真 */
    [data-theme="day"] .bg-east_tower, 
    [data-theme="day"] .bg-west_tower, 
    [data-theme="day"] .bg-castle { filter: none !important; }

    /* --- 1. 东塔 (east_tower) --- */
    /* 夜间：深木色 + 暗金格，绝不刺眼 */
    .bg-east_tower { background: linear-gradient(180deg, #1a1408 0%, #2e2410 50%, #1e1808 100%); }
    .bg-east_tower::before {
      content: ''; position: absolute; inset: 0;
      background: repeating-conic-gradient(from 0deg at 50% 50%, rgba(201,169,97,.08) 0deg 90deg, transparent 90deg 180deg);
      background-size: 80px 80px;
    }
    /* 日间：象牙白底 + 浅棕格，有温润的对比度 */
    [data-theme="day"] .bg-east_tower { background: linear-gradient(180deg, #fffcf2 0%, #fbf3e2 50%, #f2ead7 100%); }
    [data-theme="day"] .bg-east_tower::before {
      background: repeating-conic-gradient(from 0deg at 50% 50%, rgba(139,111,47,.12) 0deg 90deg, transparent 90deg 180deg);
    }

    /* --- 2. 西塔 (west_tower) --- */
    /* 夜间：黑曜石 + 银灰格，深邃 */
    .bg-west_tower { background: linear-gradient(180deg, #060810 0%, #0e1420 50%, #080a14 100%); }
    .bg-west_tower::before {
      content: ''; position: absolute; inset: 0;
      background: repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,.06) 0deg 90deg, transparent 90deg 180deg);
      background-size: 80px 80px;
    }
    /* 日间：烟灰色底 + 深灰格，不再黑不拉几 */
    [data-theme="day"] .bg-west_tower { background: linear-gradient(180deg, #e0e4ec 0%, #d0d8e8 50%, #c0c8d8 100%); }
    [data-theme="day"] .bg-west_tower::before {
      background: repeating-conic-gradient(from 0deg at 50% 50%, rgba(40,50,70,.1) 0deg 90deg, transparent 90deg 180deg);
    }

    /* --- 3. 棋局厅 (castle) 日间优化 --- */
    /* 原版夜间没动，只改日间，让它有质感不泛白 */
    [data-theme="day"] .bg-castle { background: linear-gradient(180deg, #f4efe3 0%, #ece4d2 50%, #dfd5c0 100%); }
    [data-theme="day"] .bg-castle::before {
      background: repeating-conic-gradient(from 0deg at 50% 50%, rgba(139,111,47,.1) 0deg 90deg, transparent 90deg 180deg);
      background-size: 80px 80px;
    }
  `;
  document.head.appendChild(styleEl);

  /* ═══════════════════════════════════════════════════════════
     1. 重排地图（直接放在王翼国度栏）
     ═══════════════════════════════════════════════════════════ */
  const LOCS = window.NF.LOCATIONS;
  if (!Array.isArray(LOCS)) return;

  /* 1-A：棋局厅 */
  const oldChess = LOCS.find(l => l.key === 'chess');
  if (oldChess) {
    oldChess.name = '棋局厅';
    oldChess.desc = '黑白棋盘，一步之差。每日皆可对弈，首局有奖励。';
    oldChess.region = '王翼国度';
    oldChess.bg = 'castle'; 
    oldChess.entries = [
      { type:'minigame', id:'chess', name:'坐下对弈', icon:'♔', desc:'骑士 / 主教 / 皇后。每日首局有奖励。' }
    ];
  }

  /* 1-B：伊林堡·东塔 */
  if (!LOCS.find(l => l.key === 'erenhold_east')) {
    LOCS.push({
      key:'erenhold_east', name:'伊林堡·东塔', bg:'east_tower', region:'王翼国度',
      desc:'大理石白得发亮。学徒在这里复盘、阅读、背诵残局。',
      unlock:null,
      entries:[
        { type:'minigame', id:'quiz', name:'学徒测验', icon:'♗', desc:'答题拿奖励。每日首测有奖励。' },
        { type:'minigame', id:'library_quiz', name:'查阅棋谱', icon:'❖', desc:'图书馆里的残局测验。' }
      ]
    });
  }

  /* 1-C：伊林堡·西塔 */
  if (!LOCS.find(l => l.key === 'erenhold_west')) {
    LOCS.push({
      key:'erenhold_west', name:'伊林堡·西塔', bg:'west_tower', region:'王翼国度',
      desc:'黑曜石铸成的西塔。彩窗被几百年的积尘染成了深色。',
      unlock:{ flag:'metTavana' },
      entries:[
        { type:'minigame', id:'chapel_quiz', name:'礼拜堂沉思', icon:'☩', desc:'关于醒派与梦派的教义问答。' }
      ]
    });
  }

  /* ═══════════════════════════════════════════════════════════
     2. 刷新地图和目录
     ═══════════════════════════════════════════════════════════ */
  try {
    if (typeof NF.renderMap === 'function' && NF.state && NF.state()) NF.renderMap();
    if (typeof NF.renderTOC === 'function' && NF.state && NF.state()) NF.renderTOC();
  } catch(e) {}

  console.log('%c[locations-extra] 王翼国度平铺 · 专属日夜底纹已修复', 'color:#9dd0a0;font-size:11px;');
})();
