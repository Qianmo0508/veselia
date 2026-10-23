/* ═══════════════════════════════════════════════════════════
   locations-extra.js · 王翼国度扩容（全复用棋局厅底纹）
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.NF) { console.error('[locations-extra] NF 未找到'); return; }
  const NF = window.NF;

  /* ═══════════════════════════════════════════════════════════
     重排地图（直接放在王翼国度栏）
     ═══════════════════════════════════════════════════════════ */
  const LOCS = window.NF.LOCATIONS;
  if (!Array.isArray(LOCS)) return;

  /* 1-A：棋局厅 */
  const oldChess = LOCS.find(l => l.key === 'chess');
  if (oldChess) {
    oldChess.name = '棋局厅';
    oldChess.desc = '黑白棋盘，一步之差。每日皆可对弈，首局有奖励。';
    oldChess.region = '王翼国度';
    oldChess.bg = 'castle'; // 原版黑白棋盘底纹
    oldChess.entries = [
      { type:'minigame', id:'chess', name:'坐下对弈', icon:'♔', desc:'骑士 / 主教 / 皇后。每日首局有奖励。' }
    ];
  }

  /* 1-B：伊林堡·东塔（底纹统一为 castle） */
  if (!LOCS.find(l => l.key === 'erenhold_east')) {
    LOCS.push({
      key:'erenhold_east', name:'伊林堡·东塔', bg:'castle', region:'王翼国度',
      desc:'大理石白得发亮。学徒在这里复盘、阅读、背诵残局。',
      unlock:null,
      entries:[
        { type:'minigame', id:'quiz', name:'学徒测验', icon:'♗', desc:'答题拿奖励。每日首测有奖励。' },
        { type:'minigame', id:'library_quiz', name:'查阅棋谱', icon:'❖', desc:'图书馆里的残局测验。' }
      ]
    });
  }

  /* 1-C：伊林堡·西塔（底纹统一为 castle） */
  if (!LOCS.find(l => l.key === 'erenhold_west')) {
    LOCS.push({
      key:'erenhold_west', name:'伊林堡·西塔', bg:'castle', region:'王翼国度',
      desc:'黑曜石铸成的西塔。彩窗被几百年的积尘染成了深色。',
      unlock:{ flag:'metTavana' },
      entries:[
        { type:'minigame', id:'chapel_quiz', name:'礼拜堂沉思', icon:'☩', desc:'关于醒派与梦派的教义问答。' }
      ]
    });
  }

  /* ═══════════════════════════════════════════════════════════
     刷新地图和目录
     ═══════════════════════════════════════════════════════════ */
  try {
    if (typeof NF.renderMap === 'function' && NF.state && NF.state()) NF.renderMap();
    if (typeof NF.renderTOC === 'function' && NF.state && NF.state()) NF.renderTOC();
  } catch(e) {}

  console.log('%c[locations-extra] 王翼国度平铺 · 日夜底纹统一完成', 'color:#9dd0a0;font-size:11px;');
})();
