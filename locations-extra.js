/* ═══════════════════════════════════════════════════════════
   locations-extra.js · 伊林堡扩充 + 学徒角色
   依赖 index.html 暴露的 window.NF.LOCATIONS / window.NF.CHARS
   必须在 index.html 与 minigames-extra.js 之后加载
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.NF) { console.error('[locations-extra] NF 未找到'); return; }
  const NF = window.NF;

  /* ═══════════════════════════════════════════════════════════
     1. 新增学徒角色
     ═══════════════════════════════════════════════════════════ */
  if (window.NF.CHARS) {
    window.NF.CHARS.lina = {
      name:'丽娜·怀特', en:'Lina White', sym:'♙', title:'王翼学徒 · 白方',
      desc:'二十岁，出身王翼东塔的白方学徒。话不多，记性好，梦想是有一天能在真正的棋局厅里执白。',
      color:'#e8d5a0'
    };
    window.NF.CHARS.owen = {
      name:'欧文·布莱克', en:'Owen Black', sym:'♟', title:'王翼学徒 · 黑方',
      desc:'二十三岁，西塔出身的黑方学徒。嘴上没个正形，棋却下得极认真。和丽娜是对手也是朋友。',
      color:'#8a9ab0'
    };
    window.NF.CHARS.bram = {
      name:'布拉姆·格雷', en:'Bram Grey', sym:'♗', title:'王翼老学徒',
      desc:'年长些的学徒，早年因伤退出了赛场，留在这里做训练助教。话少，爱喝茶，说得每句话都带着点旧书味。',
      color:'#a78bd0'
    };
  }

  /* ═══════════════════════════════════════════════════════════
     2. 学徒对话（挂在 BOND_TOPICS_BUILTIN 之后用）
     ═══════════════════════════════════════════════════════════ */
  /* 通过 userContent.bondTopics 注入，让它们进入乙游列表 */
  if (window.NF.userContent) {
    const u = NF.userContent();
    const extra = [
      { key:'lina_chat', charId:'lina', mode:'chat', title:'「第一次出塔」', need:0,
        lines:[
          { who:'lina', en:"You're the reporter from the Sunset City? I've never left the towers before.", cn:'「你是落日之都来的记者？我从没出过塔。」' },
          { who:'lina', en:"They say the dream fields out there are like a chessboard that keeps changing.", cn:'「他们说外面的梦域像一张一直在变的棋盘。」' }
        ], ts: Date.now() },
      { key:'lina_deep', charId:'lina', mode:'deep', title:'「白方与黑方」', need:15,
        lines:[
          { who:'lina', en:"My father was White. My mother was Black. Neither side would let me choose.", cn:'「我父亲是白方。母亲是黑方。两边都不让我选。」' },
          { who:'lina', en:"So I chose the pieces, not the sides. It's the only honest move I've ever made.", cn:'「所以我选了棋子，没选边。那是我做过最诚实的一步。」' }
        ], ts: Date.now() },
      { key:'owen_chat', charId:'owen', mode:'chat', title:'「棋局厅的怪癖」', need:0,
        lines:[
          { who:'owen', en:"Half the apprentices here don't even like chess. They just like winning.", cn:'「这里一半学徒根本不喜欢下棋。他们只是喜欢赢。」' },
          { who:'owen', en:"Me? I like the losing ones. They teach you things.", cn:'「我？我喜欢输的那盘。输的那盘会教你东西。」' }
        ], ts: Date.now() },
      { key:'owen_deep', charId:'owen', mode:'deep', title:'「输棋的那天」', need:15,
        lines:[
          { who:'owen', en:"I lost to a pawn once. A pawn. It reached the end and became a queen.", cn:'「我曾经输给过一枚兵。一枚兵。它走到尽头，变成了皇后。」' },
          { who:'owen', en:"I've never trusted the small pieces since.", cn:'「从那以后，我再也没敢小看小棋子。」' }
        ], ts: Date.now() },
      { key:'bram_chat', charId:'bram', mode:'chat', title:'「旧棋盘」', need:0,
        lines:[
          { who:'bram', en:"Old board. Chipped corner. Nobody wants to play on it.", cn:'「旧棋盘。缺了个角。没人愿意在这上面下。」' },
          { who:'bram', en:"But it's the only one that remembers every game it's seen.", cn:'「但它是唯一一个记得自己看过的每一局的。」' }
        ], ts: Date.now() },
      { key:'bram_deep', charId:'bram', mode:'deep', title:'「留下的理由」', need:20,
        lines:[
          { who:'bram', en:"I stopped playing when my hand started to shake. Couldn't hold the pieces steady.", cn:'「手开始抖的那年，我就不下了。握不稳棋子。」' },
          { who:'bram', en:"So I stayed. Someone has to keep the board warm for the next one.", cn:'「所以我留下来了。总得有人替后来的人，让棋盘还热着。」' }
        ], ts: Date.now() }
    ];
    /* 只在第一次运行时注入（避免重复） */
    const existing = (u.bondTopics || []).some(t => t.key === 'lina_chat');
    if (!existing) {
      extra.forEach(t => u.bondTopics.push(t));
      NF.saveUser();
    }
  }

  /* ═══════════════════════════════════════════════════════════
     3. 扩充伊林堡地点
     ═══════════════════════════════════════════════════════════ */
  const LOCS = window.NF.LOCATIONS;
  if (!Array.isArray(LOCS)) return;

  /* 3-A：找到原 chess 地点，改成"伊林堡 · 东塔"，扩展 entries */
  const oldChess = LOCS.find(l => l.key === 'chess');
  if (oldChess) {
    oldChess.name = '伊林堡 · 东塔';
    oldChess.desc = '大理石白得发亮。东塔的走廊总有人走，但没人停下来。';
    oldChess.region = '王翼国度';
    oldChess.entries = [
      { type:'scene', id:'erenhold_chesshall', name:'走进棋局厅', icon:'♔', desc:'黑白格地板。伊林堡最安静的地方。' },
      { type:'scene', id:'erenhold_training', name:'学徒训练室', icon:'♟', desc:'丽娜和欧文正在复盘。' },
      { type:'scene', id:'erenhold_library', name:'东塔图书馆', icon:'❖', desc:'旧书与棋谱。布拉姆常年待的地方。' },
      { type:'character', id:'lina', name:'与丽娜对话', icon:'♙', desc:'闲聊 / 深谈 / 送礼' },
      { type:'character', id:'owen', name:'与欧文对话', icon:'♟', desc:'闲聊 / 深谈 / 送礼' },
      { type:'character', id:'bram', name:'与布拉姆对话', icon:'♗', desc:'闲聊 / 深谈 / 送礼' }
    ];
  }

  /* 3-B：新增"伊林堡 · 棋局厅"独立地点（其实入口已在东塔里，但地图上也可直接看到） */
  if (!LOCS.find(l => l.key === 'chess_hall')) {
    LOCS.push({
      key:'chess_hall', name:'棋局厅', bg:'castle', region:'王翼国度 · 伊林堡',
      desc:'黑白格地板像一张巨大的棋盘，两侧是东西两方的醒者学者。这里是王翼的中心。',
      unlock:null,
      entries:[
        { type:'minigame', id:'chess', name:'下 一 局', icon:'♔', desc:'骑士 · 主教 · 皇后。每日一局。' },
        { type:'minigame', id:'quiz', name:'学 徒 测 验', icon:'♗', desc:'答对更多题，得到更多银镑。每日一次。' }
      ]
    });
  }

  /* 3-C：新增"伊林堡 · 西塔" */
  if (!LOCS.find(l => l.key === 'erenhold_west')) {
    LOCS.push({
      key:'erenhold_west', name:'伊林堡 · 西塔', bg:'castle', region:'王翼国度',
      desc:'黑曜石铸成的西塔。廊道缠满蜘蛛网，但墙上的彩窗仍透着哥特式旧光。',
      unlock:{ flag:'metTavana' },
      entries:[
        { type:'scene', id:'erenhold_west_chapel', name:'走进西塔礼拜堂', icon:'☩', desc:'彩窗在黑暗里发着光。' },
        { type:'scene', id:'erenhold_west_hall', name:'穿过西塔长厅', icon:'♚', desc:'黑曜石地板，脚步声传得很远。' }
      ]
    });
  }

  /* 3-D：注册新场景 */
  if (window.NF.SCENES) {
    const SCENES = window.NF.SCENES;

    /* —— 棋局厅 —— */
    SCENES.erenhold_chesshall = {
      bg:'castle', loc:'伊林堡 · 棋局厅', chapter:'伊林堡 · 东塔',
      lines:[
        { cn:'地板是黑白两色的大理石，像一张被放大到整间屋子的棋盘。' },
        { cn:'两侧的长椅上坐着穿黑白两色礼服的醒者学者。没有人说话，只有棋子落在石面上的声音。' },
        { cn:'你走到棋盘中央的讲话台。台上空着。' },
        { s:'丽娜', who:'lina', en:'You must be the visitor from the Sunset City. Are you here for the match?', cn:'「您一定是从落日之都来的客人吧。是来看棋的吗？」' },
        { me:'（她朝你微微点头。黑发梳得一丝不乱。）' },
        { cn:'你注意到墙上嵌着一面巨大的水晶吊灯，坠着数百根蜡烛。光在黑白格上跳。' }
      ],
      onEnd: () => { NF.showScreen('map'); }
    };

    /* —— 学徒训练室 —— */
    SCENES.erenhold_training = {
      bg:'castle', loc:'伊林堡 · 学徒训练室', chapter:'伊林堡 · 东塔',
      lines:[
        { cn:'训练室不大，一张小棋桌，两把椅子，一块刻着残局的黑板。' },
        { cn:'丽娜坐在白方，欧文坐在黑方。两人的手指都停在棋子上。' },
        { s:'欧文', who:'owen', en:"A reporter, huh. Sit. Watch. You might learn something.", cn:'「记者啊。坐吧。看着。说不定能学到点什么。」' },
        { s:'丽娜', who:'lina', en:"Owen, don't be rude.", cn:'「欧文，别没礼貌。」' },
        { cn:'黑板上写着：「白方 · 三步行棋 · 不死格」。' }
      ],
      onEnd: () => { NF.showScreen('map'); }
    };

    /* —— 东塔图书馆 —— */
    SCENES.erenhold_library = {
      bg:'archive', loc:'伊林堡 · 东塔图书馆', chapter:'伊林堡 · 东塔',
      lines:[
        { cn:'一排排棋谱塞满书架。从十六世纪的意大利开局到最近的伊林堡手抄本。' },
        { cn:'靠窗的桌上放着一本旧书，书脊裂了，摊开在第 47 页。' },
        { s:'布拉姆', who:'bram', en:'…That book is about losing. It is the only one worth reading twice.', cn:'「那本书写的是输。是唯一值得读两遍的书。」' },
        { t:'你抬起头。窗边的老人没有回头。' },
        { cn:'窗外银杏林的叶子在飘落。风里有旧纸的味道。' }
      ],
      onEnd: () => { NF.showScreen('map'); }
    };

    /* —— 西塔礼拜堂 —— */
    SCENES.erenhold_west_chapel = {
      bg:'church', loc:'伊林堡 · 西塔礼拜堂', chapter:'王翼 · 西塔',
      lines:[
        { cn:'礼拜堂里很暗。彩窗被几百年的积尘染成了深色。' },
        { cn:'一束光从最高那扇窗里透下来，落在地面的黑白格上。' },
        { cn:'没有人。只有琴键上落下的一层薄灰。' },
        { me:'（这里像一间被时间忘掉的房间。）' }
      ],
      onEnd: () => { NF.showScreen('map'); }
    };

    /* —— 西塔长厅 —— */
    SCENES.erenhold_west_hall = {
      bg:'castle', loc:'伊林堡 · 西塔长厅', chapter:'王翼 · 西塔',
      lines:[
        { cn:'黑曜石地板被磨得发亮。脚步声在这里能传很远。' },
        { cn:'墙上挂着一幅幅褪色的画像。你认出其中一张：一个黑发红瞳的女人，肩上立着一只黑鸦。' },
        { cn:'画像下方刻着一个名字——沃特森。' },
        { me:'（原来莫维奥娅也和这里有关。）' }
      ],
      onEnd: () => { NF.showScreen('map'); }
    };
  }

  /* 4. 刷新地图 / 目录 / 关系（如果已经渲染过） */
  try {
    if (typeof NF.renderMap === 'function' && NF.state && NF.state()) NF.renderMap();
    if (typeof NF.renderBondGrid === 'function' && NF.state && NF.state()) NF.renderBondGrid();
    if (typeof NF.renderTOC === 'function' && NF.state && NF.state()) NF.renderTOC();
  } catch(e) {}

  console.log('%c[locations-extra] 伊林堡扩充 · 3 个学徒 · 4 个新场景 已加载', 'color:#9dd0a0;font-size:11px;');
})();
