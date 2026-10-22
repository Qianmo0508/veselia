const CHARS = {
  fiman: { 
    name: '菲曼·卡桑拉', en: 'Fiman Kasandra', sym: '♖', title: '暗联 / 调酒师', 
    desc: '日不落酒馆的调酒师，其实是接线员。性格直率爽朗活泼，干脆利落。', 
    likes: ['酒具', '旧唱片'],
    likesEn: "Now this is what I'm talking about. Drinks are on me tonight, reporter.",
    likesCn: '「这才像话嘛。今晚的酒我请了，大记者。」',
    dislikeEn: "Huh. I'll stick it in the storage room. Thanks.",
    dislikeCn: '「呃。我把它塞储藏室吧。谢了。」'
  },
  cash: { 
    name: '卡什·洛克威尔', en: 'Cash Rockwell', sym: '♘', title: '新调入成员', 
    desc: '美式年轻白男。金发碧眼，半永久墨镜。轻浮、热脸贱，实则视弱（半米外人畜不分）。', 
    likes: ['墨镜', '机车模型'],
    likesEn: "Oh sweet! You're a lifesaver. I owe you one.",
    likesCn: '「哦太棒了！你真是我的救星。我欠你一次。」',
    dislikeEn: "Oh, thanks. Can't really see the details though...",
    dislikeCn: '「哦，谢了。虽然我看不清上面的细节……」'
  },
  tavana: { 
    name: '塔瓦娜·卡伊', en: 'Tavana Kay', sym: '♕', title: '梦目院院长', 
    desc: '温和谨慎，优雅大方。姐姐塔尔莎战死，她被迫接任院长。', 
    likes: ['书籍', '咖啡豆'],
    likesEn: "...Thank you. I really appreciate this. I'll find some time to read it.",
    likesCn: '「……谢谢。我真的很喜欢。我会找时间读的。」',
    dislikeEn: "Thank you. I'll keep it safe. You're very thoughtful.",
    dislikeCn: '「谢谢，我会妥善收好的。您有心了。」'
  },
  movioa: { 
    name: '莫维奥娅·沃特森', en: 'Movioa Watson', sym: '♜', title: '梦目院副院长', 
    desc: '黑发血瞳，黑纱礼帽。言语刻薄，一款冷脸贱，只对塔瓦娜温柔。', 
    likes: ['黑羽毛', '红茶'],
    likesEn: "...You have decent taste. I've been looking for this. Don't expect me to say thanks.",
    likesCn: '「……算你有眼光。这玩意儿我找很久了。别指望我会谢你。」',
    dislikeEn: "Useless. Take it away, don't clutter my desk.",
    dislikeCn: '「无聊的东西。拿走，别占我桌上的位置。」'
  }
};

const GIFTS = [
  { id: 'g1', name: '威士忌酒具', icon: '🍷', tags: ['酒具'] },
  { id: 'g2', name: '一张旧唱片', icon: '💿', tags: ['旧唱片'] },
  { id: 'g3', name: '黑色墨镜', icon: '🕶️', tags: ['墨镜'] },
  { id: 'g4', name: '机车模型', icon: '🏍️', tags: ['机车模型'] },
  { id: 'g5', name: '复古线装书', icon: '📖', tags: ['书籍'] },
  { id: 'g6', name: '手工咖啡豆', icon: '☕', tags: ['咖啡豆'] },
  { id: 'g7', name: '精致的黑鸦羽毛', icon: '🪶', tags: ['黑羽毛'] },
  { id: 'g8', name: '特级红茶', icon: '🍵', tags: ['红茶'] },
  { id: 'g9', name: '银杏叶书签', icon: '🍂', tags: ['通用'] }
];

const LEVELS = [
  { min: 0, max: 9, name: '陌生' },
  { min: 10, max: 29, name: '相识' },
  { min: 30, max: 59, name: '暧昧' },
  { min: 60, max: 89, name: '心动' },
  { min: 90, max: 100, name: '灵魂烙印' }
];

const SCENES = {};
const MAP_DATA = [
  { region: '落日之都', spots: [
    { id: 'tavern', name: '日不落酒馆', ico: '♖', desc: '进行调酒小游戏。', tag: '调酒', action: 'pour', unlock: 0 },
    { id: 'reception', name: '梦目院·会客室', ico: '♕', desc: '与角色闲聊、深谈、送礼、解锁CG。', tag: '羁绊', action: 'chars', unlock: 0 },
    { id: 'archive', name: '档案室', ico: '❖', desc: '铁门之后，卷宗与秘密。', tag: '证据链', action: 'evidence', unlock: 1 },
    { id: 'church', name: '卡特琳教堂', ico: '☩', desc: '哥特尖顶，彩窗破碎。', tag: '拼图', action: 'puzzle', unlock: 2 }
  ]},
  { region: '王翼国度', spots: [
    { id: 'chess', name: '伊林堡·棋局厅', ico: '♔', desc: '黑白棋盘，一步之差。', tag: '走位', action: 'chess', unlock: 3 }
  ]}
];

SCENES.prologue_1 = {
  bg: 'city', loc: '落日之都 · 城门', unlockMap: 0,
  lines: [
    { t: 'n', cn: '暮色像一层薄薄的灰纱，覆在落日之都的煤气灯上。' },
    { t: 'me', cn: '（王翼的记者证在我口袋里，纸边已经磨得发毛。）', byPers: {
      '冷静': '（王翼的记者证在我口袋里，纸边已经磨得发毛。）',
      '直率': '（这破证件磨得真旧。希望这地方值得我来。）'
    }},
    { t: 'n', cn: '一个赶路的老人撞了你一下，消失在巷子里。' },
    { t: 'me', cn: '（……他们怕的不是贼。）' }
  ],
  next: 'prologue_2'
};
SCENES.prologue_2 = {
  bg: 'tavern', loc: '日不落酒馆', unlockMap: 1,
  lines: [
    { t: 'n', cn: '你推开了日不落酒馆的门。' },
    { t: 'd', who: 'fiman', en: 'Evening, stranger. You look like you just walked out of a storm.', cn: '「晚上好，陌生人。你看起来像刚从风暴里走出来。」' },
    { t: 'd', who: 'cash', en: "Oh hey! You must be the new one. Fiman told me about you.", cn: '「哦嘿！你就是新来的那个吧。菲曼跟我提过你。」' }
  ],
  onEnd: () => { window.NF.showScreen('map'); window.NF.toast('◈ 序章完成，地图解锁', 'ok'); }
};
