/* ═══════════════════════════════════════════════════════════
   locations-extra.js · 伊林堡扩充（不强制剧情）+ 地点重排
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.NF) { console.error('[locations-extra] NF 未找到'); return; }
  const NF = window.NF;

  /* ═══════════════════════════════════════════════════════════
     1. 剔除学徒乙游注入
     ═══════════════════════════════════════════════════════════ */
  /* 不注册学徒的 CHARS，也不注册 bondTopics，彻底移出乙游 */

  /* ═══════════════════════════════════════════════════════════
     2. 重排地图（直接放在王翼国度栏）
     ═══════════════════════════════════════════════════════════ */
  const LOCS = window.NF.LOCATIONS;
  if (!Array.isArray(LOCS)) return;

  /* 2-A：把原来的 chess 直接改成“棋局厅” */
  const oldChess = LOCS.find(l => l.key === 'chess');
  if (oldChess) {
    oldChess.name = '王翼 · 棋局厅';
    oldChess.desc = '黑白棋盘，一步之差。每日皆可下棋，首局有奖励。';
    oldChess.region = '王翼国度';
    oldChess.entries = [
      { type:'minigame', id:'chess', name:'坐下对弈', icon:'♔', desc:'骑士 / 主教 / 皇后。每日首局有奖励。' }
    ];
  }

  /* 2-B：新增“王翼 · 东塔” */
  if (!LOCS.find(l => l.key === 'erenhold_east')) {
    LOCS.push({
      key:'erenhold_east', name:'王翼 · 东塔', bg:'castle', region:'王翼国度',
      desc:'大理石白得发亮。学徒在这里复盘、阅读、背诵残局。',
      unlock:null,
      entries:[
        { type:'minigame', id:'quiz', name:'学徒测验', icon:'♗', desc:'答题拿奖励。每日首测有奖励。' },
        { type:'minigame', id:'library_quiz', name:'查阅棋谱', icon:'❖', desc:'图书馆里的残局测验。' }
      ]
    });
  }

  /* 2-C：新增“王翼 · 西塔” */
  if (!LOCS.find(l => l.key === 'erenhold_west')) {
    LOCS.push({
      key:'erenhold_west', name:'王翼 · 西塔', bg:'church', region:'王翼国度',
      desc:'黑曜石铸成的西塔。彩窗被几百年的积尘染成了深色。',
      unlock:{ flag:'metTavana' },
      entries:[
        { type:'minigame', id:'chapel_quiz', name:'礼拜堂沉思', icon:'☩', desc:'关于醒派与梦派的教义问答。' }
      ]
    });
  }

  /* ═══════════════════════════════════════════════════════════
     3. 修复：之前误加的剧情场景直接删除
     ═══════════════════════════════════════════════════════════ */
  /* 因为我们改用纯小游戏/弹窗了，所以这里不需要往 SCENES 里塞剧情了 */

  /* ═══════════════════════════════════════════════════════════
     4. 刷新地图 / 目录
     ═══════════════════════════════════════════════════════════ */
  try {
    if (typeof NF.renderMap === 'function' && NF.state && NF.state()) NF.renderMap();
    if (typeof NF.renderTOC === 'function' && NF.state && NF.state()) NF.renderTOC();
  } catch(e) {}

  console.log('%c[locations-extra] 王翼国度扩充 · 纯弹窗 / 小游戏 已加载', 'color:#9dd0a0;font-size:11px;');
})();
