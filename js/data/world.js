const WORLD = {
  nations: [
    { id: 'somnia', name: '索姆尼亚帝国', en: 'Somnia', capital: 'solma', color: 'rgba(120,90,160,.18)', border: 'rgba(160,130,200,.5)' },
    { id: 'alaregia', name: '王翼国度', en: 'Alaregia', capital: 'elynburg', color: 'rgba(180,160,120,.15)', border: 'rgba(220,200,160,.5)' }
  ],
  locations: [
    { id:'solma', nation:'somnia', name:'落日之都', en:'Solma', type:'都', x:250, y:280, unlocked:true, desc:'帝国的中心。\n日不落酒馆的橡木门就在转角处。', subs:[ 
      { id:'tavern', name:'日不落酒馆', en:'The Sun-Not-Setting Tavern', unlocked:true, gameType:'tavern' }, 
      { id:'archive', name:'管理院总部', en:'Somnii Oculus Curia', unlocked:true, gameType:'archive' },
      { id:'ginkgo', name:'银杏林', en:'Ginkgo Wood', unlocked:true, gameType:'dream' } 
    ]},
    { id:'yingyue', nation:'somnia', name:'映月镇', en:'Yingyue', type:'镇', x:330, y:430, unlocked:true, desc:'小镇沿着日月湖铺开。', subs:[ { id:'riyuehu', name:'日月湖', unlocked:true }, { id:'yeniao', name:'夜鸟林', unlocked:true } ]},
    { id:'riwang', nation:'somnia', name:'日往城', en:'Riwang', type:'城', x:180, y:500, unlocked:true, desc:'城外的向日葵在风里低头。', subs:[ { id:'xiangrikui', name:'向日葵花海', unlocked:true }, { id:'bihansuo', name:'救助灾魇避难所', unlocked:false, mystery:['大门紧闭。守门人说：「等灾厄再来的时候。」','——此处尚不可入。'] } ]},
    { id:'rumeng', nation:'somnia', name:'入梦之谷', en:'Valley', type:'禁地', x:100, y:380, unlocked:false, mystery:['档案在此中断。纸页似乎被人撕去了。','——此处尚不可入。'] },
    { id:'elynburg', nation:'alaregia', name:'伊林堡', en:'Elynburg', type:'堡', x:720, y:280, unlocked:true, desc:'一半黑曜石、一半白大理石的城堡。', subs:[ 
      { id:'chess', name:'棋局厅', en:'Chess Hall', unlocked:true, gameType:'chess' },
      { id:'elyn-street', name:'伊林古街', unlocked:true } 
    ]},
    { id:'arena', nation:'alaregia', name:'王翼赛场', en:'Alaregian Arena', type:'场', x:820, y:400, unlocked:true, desc:'巨型棋盘广场。', subs:[ { id:'arena-wait', name:'王翼大赛候场处', unlocked:true } ]},
    { id:'catrin', nation:'alaregia', name:'卡特琳教堂', en:'Catrin Church', type:'堂', x:700, y:450, unlocked:true, desc:'尖顶刺向灰蒙蒙的天空。', subs:[ 
      { id:'catrin-main', name:'卡特琳大教堂', unlocked:true, gameType:'church' } 
    ]},
    { id:'jingmeng', nation:'alaregia', name:'荆梦之城', en:'Jingmeng', type:'城', x:780, y:550, unlocked:true, desc:'玫瑰与荆棘同时生长的地方。', subs:[ 
      { id:'dream-sect', name:'梦派据点', unlocked:true, gameType:'stealth' } 
    ]}
  ]
};

const CHARACTERS = [
  { id:'tavana', name:'塔瓦娜·卡伊', en:'Tavana Kai', role:'梦目院局长' },
  { id:'mauvia', name:'莫维奥娅·沃特森', en:'Mauvia Watson', role:'副局长' },
  { id:'lydia', name:'莉迪亚·简', en:'Lydia Jane', role:'联络员' },
  { id:'elsia', name:'艾尔丝娅·简', en:'Elsia Jane', role:'特务/杀手' },
  { id:'fiman', name:'菲曼·卡桑拉', en:'Fiman Kasandra', role:'调酒师' },
  { id:'cash', name:'卡什·洛克威尔', en:'Cash Rockwell', role:'新调入成员' }
];

let GAME_STATE = { san: 100, maxSan: 100, dreamNode: 0, enemy: null };

const DREAM_NODES = [
  { type: 'event', name: '迷雾低语', text: '你在迷雾中看到地上有一个巨大的乌鸦烙印，散发着诱人的黑气。', sanLoss: 10 },
  { type: 'battle', name: '残破的守卫', enemy: { name: '焦土残影', hp: 30, atk: 10 } },
  { type: 'rest', name: '微光营地', text: '这里有一簇微弱的火光，你坐下来喘了口气。', sanHeal: 20 },
  { type: 'battle', name: '痛苦的魂灵', enemy: { name: '痛苦的梦灵', hp: 50, atk: 15 } },
  { type: 'boss', name: '梦魇核心', enemy: { name: '缇斯的残影', hp: 100, atk: 20 } }
];
