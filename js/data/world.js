// 维塞利亚大陆 · 地图与地点数据
// unlocked: false 表示锁住（显示但不可进入，点开给迷雾文案）
const WORLD = {
  nations: [
    {
      id: 'somnia', name: '索姆尼亚帝国', en: 'Somnia',
      capital: 'solma', color: 'rgba(120,90,160,.18)', border: 'rgba(160,130,200,.5)'
    },
    {
      id: 'alaregia', name: '王翼国度', en: 'Alaregia',
      capital: 'elynburg', color: 'rgba(180,160,120,.15)', border: 'rgba(220,200,160,.5)'
    }
  ],
  locations: [
    // ── 索姆尼亚 ──
    { id:'solma', nation:'somnia', name:'落日之都', en:'Solma', type:'都',
      x:250, y:280, unlocked:true, parent:null,
      desc:'帝国的中心。煤气灯沿着青石板路一盏盏亮起，维多利亚式的铁艺阳台上晾着昨夜未干的衣裳。\n日不落酒馆的橡木门就在转角处。',
      subs:[
        { id:'tavern', name:'日不落酒馆', en:'The Sun-Not-Setting Tavern', unlocked:true, desc:'梦目院总部。壁炉里的火正烧到第三块柴。' },
        { id:'ginkgo', name:'银杏林', en:'Ginkgo Wood', unlocked:true, desc:'落叶铺满小径，踩上去沙沙作响。林子深处有一家旧书店。' }
      ]},
    { id:'yingyue', nation:'somnia', name:'映月镇', en:'Yingyue', type:'镇',
      x:330, y:430, unlocked:true, parent:null,
      desc:'小镇沿着日月湖铺开，屋檐低垂，窗台上摆着晒干的薰衣草。\n夜里湖面会映出两轮月亮。',
      subs:[
        { id:'riyuehu', name:'日月湖', en:'Sun-Moon Lake', unlocked:true, desc:'湖水很静，静得能听见自己的心跳。' },
        { id:'mengzhixiang', name:'梦之乡', en:'Dreamland', unlocked:true, desc:'镇子最深处的一条巷子。据说走进去的人，会忘记自己来做什么。' },
        { id:'yeniao', name:'夜鸟林', en:'Nightbird Wood', unlocked:true, desc:'入夜后林子里的鸟叫声会变调。' }
      ]},
    { id:'riwang', nation:'somnia', name:'日往城', en:'Riwang', type:'城',
      x:180, y:500, unlocked:true, parent:null,
      desc:'城外的向日葵在风里低头。城里的人说，这里是太阳最后停留的地方。',
      subs:[
        { id:'xiangrikui', name:'向日葵花海', en:'Sunflower Field', unlocked:true, desc:'花海一直延伸到地平线。风过时，像金色的潮。' },
        { id:'riguang', name:'日光展', en:'Sunlight Exhibition', unlocked:true, desc:'一座玻璃穹顶的展览馆。里面陈列着「梦」的标本。' },
        { id:'bihansuo', name:'救助灾魇避难所', en:'Refuge', unlocked:false,
          mystery:['大门紧闭。守门人说：「等灾厄再来的时候。」','窗内似乎有光，但你数不清里面有多少人。','——此处尚不可入。'] }
      ]},
    { id:'rumeng', nation:'somnia', name:'入梦之谷', en:'Valley of Falling Sleep', type:'禁地',
      x:100, y:380, unlocked:false, parent:null,
      mystery:['档案在此中断。纸页似乎被人撕去了，断口很齐。','……有人用铅笔在背面写了三个字，又被涂掉了。','——此处尚不可入。'] },

    // ── 王翼 ──
    { id:'elynburg', nation:'alaregia', name:'伊林堡', en:'Elynburg', type:'堡',
      x:720, y:280, unlocked:true, parent:null,
      desc:'一半黑曜石、一半白大理石的城堡。大厅的地板是巨大的黑白棋盘格。',
      subs:[
        { id:'elynburg-hall', name:'伊林堡', en:'Elyn Hall', unlocked:true, desc:'棋局厅里，两侧学者按棋子布局端坐。' },
        { id:'elyn-street', name:'伊林古街', en:'Elyn Old Street', unlocked:true, desc:'石板路两侧是旧书摊和钟表铺。' },
        { id:'parade-park', name:'游行公园', en:'Parade Park', unlocked:true, desc:'每逢节庆，这里会举行人棋游行。' }
      ]},
    { id:'arena', nation:'alaregia', name:'王翼赛场', en:'Alaregian Arena', type:'场',
      x:820, y:400, unlocked:true, parent:null,
      desc:'巨型棋盘广场。参赛者身着棋子礼服，站在格子上。',
      subs:[
        { id:'arena-wait', name:'王翼大赛候场处', en:'Waiting Hall', unlocked:true, desc:'候场的人低头整理袖口，没有人说话。' },
        { id:'arena-park', name:'王翼公园', en:'Arena Park', unlocked:true, desc:'棋盘格的草坪，修剪得很整齐。' },
        { id:'arena-museum', name:'王翼赛事展览馆', en:'Tournament Museum', unlocked:true, desc:'历届大赛的棋子礼服陈列在玻璃柜里。' }
      ]},
    { id:'catrin', nation:'alaregia', name:'卡特琳教堂', en:'Catrin Church', type:'堂',
      x:700, y:450, unlocked:true, parent:null,
      desc:'尖顶刺向灰蒙蒙的天空。钟声每天敲三次。',
      subs:[
        { id:'catrin-main', name:'卡特琳大教堂', en:'Catrin Cathedral', unlocked:true, desc:'内部很暗，只有几盏蜡烛。' },
        { id:'catrin-side', name:'教堂侧厅', en:'Side Chapel', unlocked:false,
          mystery:['门锁着。钥匙孔里塞满了蜡。','门缝里透出一线暖光，像是有人在里面点着蜡烛。','——此处尚不可入。'] },
        { id:'catrin-garden', name:'教堂后花园', en:'Back Garden', unlocked:true, desc:'玫瑰丛修剪得整齐，但没人敢摘。' },
        { id:'nun-house', name:'修女舍', en:'Sisters\' House', unlocked:false,
          mystery:['门楣上贴着封条。字迹被雨水洇开了。','侧窗的百叶窗合着，但你能听见翻书声。','——此处尚不可入。'] }
      ]},
    { id:'jingmeng', nation:'alaregia', name:'荆梦之城', en:'Jingmeng', type:'城',
      x:780, y:550, unlocked:true, parent:null,
      desc:'玫瑰与荆棘同时生长的地方。夜里能听见远处音乐厅的琴声。',
      subs:[
        { id:'jingyue-tower', name:'荆月塔', en:'Jingyue Tower', unlocked:true, desc:'塔顶挂着一口不响的钟。' },
        { id:'rose-garden', name:'玫瑰夜园', en:'Rose Night Garden', unlocked:true, desc:'只在夜里开放的玫瑰园。' },
        { id:'ruite-music', name:'瑞特丝音乐厅', en:'Ruites Concert Hall', unlocked:true, desc:'琴声从半开的门里漏出来。' },
        { id:'huaqin-sea', name:'花琴宫海', en:'Huaqin Sea', unlocked:true, desc:'一片被宫墙围住的海。' }
      ]}
  ]
};

// 可攻略角色（阶段 2 用，先占位）
const CHARACTERS = [
  { id:'tavana', name:'塔瓦娜·卡伊', en:'Tavana Kai', role:'梦目院局长', loc:'tavern' },
  { id:'mauvia', name:'莫维奥娅·沃特森', en:'Mauvia Watson', role:'副局长', loc:'tavern' },
  { id:'lydia', name:'莉迪亚·简', en:'Lydia Jane', role:'联络员', loc:'tavern' },
  { id:'elsia', name:'艾尔丝娅·简', en:'Elsia Jane', role:'特务/杀手', loc:'tavern' },
  { id:'fiman', name:'菲曼·卡桑拉', en:'Fiman Kasandra', role:'调酒师/专接线员', loc:'tavern' },
  { id:'cash', name:'卡什·洛克威尔', en:'Cash Rockwell', role:'梦目院成员', loc:'tavern' },
  { id:'refina', name:'瑞菲娜', en:'Refina', role:'魇境任务小组队长', loc:'riguang' }
];
