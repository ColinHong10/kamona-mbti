/* ================================================================
 * 暗区 MBTI · 数据层（使用单引号避免引号冲突）
 * 18 个人格 + 20 道题 + 权重矩阵
 * ================================================================ */

const PERSONAS = {
  leg_meta:{
    id:'leg_meta', code:'LEGM',
    en:'Leg Meta Enjoyer', cn:'打腿流信徒',
    img:'assets/personas/p1.png', rarity:'普通',
    tag:'#一枪爆腿 #六级甲笑话',
    punch:'你的甲是甲，我的腿是刀。',
    summary:'深信「膝盖是人类最脆弱的部位」，你不瞄头、不瞄胸，只瞄那对暴露在外的大腿肉。打不穿就磨，磨不死就追。',
    vibes:['腿部命中声效收藏家','见面先蹲下','主武器弹匣永远 60 发起步'],
    match:['squad_commander','safe_rusher','w_maniac'],
    clash:['tier6_chad','evita_simp','apex']
  },
  rat:{
    id:'rat', code:'RATX',
    en:'The Rat', cn:'老鼠人',
    img:'assets/personas/p2.png', rarity:'普通',
    tag:'#阴人艺术 #活着就是赢',
    punch:'你看不见我，所以我杀得死你。',
    summary:'草丛、墙角、门后三大阴间道场常驻选手。你的信条是：死了什么都没有，活着就是胜利。',
    vibes:['对脚步声过敏','静步键比 W 键磨得还亮','最爱的时刻是敌人转身的那一秒'],
    match:['extraction_camper','sniper','headtap'],
    clash:['w_maniac','knife','chad']
  },
  extraction_camper:{
    id:'extraction_camper', code:'EXCP',
    en:'Extraction Camper', cn:'撤离点蹲王',
    img:'assets/personas/p3.png', rarity:'普通',
    tag:'#GHO 常驻 #绿光陷阱',
    punch:'你能撤，但我会让你带不走任何东西。',
    summary:'别人在搜东西，你在搜「他们」。撤离点 30 米半径是你的私人领地，爆炸物是门票。',
    vibes:['GHO 永远带满','听到脚步先扔再说','最享受的是胜利那三声提示音'],
    match:['rat','babysitter','sniper'],
    clash:['knife','loot_goblin','safe_rusher']
  },
  sniper:{
    id:'sniper', code:'SNPR',
    en:'Naked Sniper', cn:'裸装狙仔',
    img:'assets/personas/p4.png', rarity:'普通',
    tag:'#一枪一个 #裤衩干翻顶配',
    punch:'我带不起装备，但我带得走你的头。',
    summary:'身上最贵的是枪，最便宜的是命。哲学很简单：反正会死，那不如死得刺激点。',
    vibes:['只练 800 米以上的心理素质','背包空到能听见回声','最讨厌近战'],
    match:['rat','headtap','lone_wolf'],
    clash:['knife','chad','backpack']
  },
  chad:{
    id:'chad', code:'CHAD',
    en:'Tier 6 Chad', cn:'T6 全装猛男',
    img:'assets/personas/p5.png', rarity:'稀有',
    tag:'#横着走 #保险箱就是取款机',
    punch:'别躲，我知道你打不穿。',
    summary:'T6 头 T6 甲 T6 枪，你不是在玩游戏，你是在走红毯。别人看到你撤离，你看到别人撤离——通过击杀提示。',
    vibes:['刷仓库时最有安全感','最怕穿帆布鞋的对手','血条比别人多一半还骂护甲差'],
    match:['apex','squad_commander','evita_simp'],
    clash:['leg_meta','sniper','rat']
  },
  knife:{
    id:'knife', code:'KNFE',
    en:'Knife Runner', cn:'刀仔疾跑怪',
    img:'assets/personas/p6.png', rarity:'稀有',
    tag:'#跑刀乐子 #白给但开心',
    punch:'别人玩游戏，我玩行为艺术。',
    summary:'装备？不要。枪？不要。只要一把刀、两条腿、和一种名为「乐子」的人生观。',
    vibes:['活着是意外，死了是日常','跑路线比撤离时间还熟','击杀回放是全网最爆的素材'],
    match:['w_maniac','safe_rusher','loot_goblin'],
    clash:['sniper','rat','extraction_camper']
  },
  thermal:{
    id:'thermal', code:'THRM',
    en:'Thermal Addict', cn:'热成像依赖症',
    img:'assets/personas/p7.png', rarity:'稀有',
    tag:'#上帝视角 #装备即修行',
    punch:'你在阴影里，我在热像里。',
    summary:'肉眼？那是原始人的工具。你只相信能发光的生命体。树后？草里？墙角？都逃不过你。',
    vibes:['最爱夜图','看到没热像的玩家觉得他们辛苦','续航焦虑晚期'],
    match:['sniper','headtap','apex'],
    clash:['rat','extraction_camper','knife']
  },
  loot_goblin:{
    id:'loot_goblin', code:'LOOT',
    en:'Loot Goblin', cn:'舔包小精灵',
    img:'assets/personas/p8.png', rarity:'普通',
    tag:'#舔舔舔 #见包走不动',
    punch:'能带走就是我的，带不走是下一个人的。',
    summary:'击杀提示不是为了战绩，是为了「又有包可舔了」。地上掉一颗子弹你都要蹲下来捡。',
    vibes:['对「啪」的一声有生理反应','背包永远整理不完','把对手的内裤都翻出来卖钱'],
    match:['backpack','stash','knife'],
    clash:['apex','lone_wolf','sniper']
  },
  evita_simp:{
    id:'evita_simp', code:'EVTA',
    en:'The Evita Simp', cn:'艾薇塔厨',
    img:'assets/personas/p9.png', rarity:'稀有',
    tag:'#角色厨 #为爱氪金',
    punch:'她说的话我都信，就算她是 NPC。',
    summary:'你玩的不是暗区突围，是艾薇塔模拟器。钱都花在皮肤和挂件上，战斗力靠爱发电。',
    vibes:['语音包收集强迫症','任务剧情一个字不跳','打不过也不卸载，因为她还在'],
    match:['chad','babysitter','squad_commander'],
    clash:['leg_meta','rat','sniper']
  },
  w_maniac:{
    id:'w_maniac', code:'WWWW',
    en:'W-Key Maniac', cn:'钢枪狂',
    img:'assets/personas/p10.png', rarity:'普通',
    tag:'#只会冲 #脑子是什么',
    punch:'撤什么撤，子弹没打完不能走。',
    summary:'你的键盘上只有一个键磨损严重：W。听到枪声不是躲，是方位定位。',
    vibes:['撤离时间永远差 30 秒','最爱的播报是「敌人已被消灭」','最讨厌的词是「绕后」'],
    match:['knife','safe_rusher','leg_meta'],
    clash:['extraction_camper','rat','lone_wolf']
  },
  squad_commander:{
    id:'squad_commander', code:'CMDR',
    en:'Squad Commander', cn:'队伍指挥官',
    img:'assets/personas/p11.png', rarity:'稀有',
    tag:'#人形雷达 #报点达人',
    punch:'左前方灌木里，两点钟方向，我看你不动就是死了。',
    summary:'别人组队是为了取暖，你组队是为了调度。战术地图、报点系统、分工安排全流程你一人承包。',
    vibes:['说话自带播音腔','标点速度比呼吸还快','最爱的时刻是队友说「听你的」'],
    match:['babysitter','chad','evita_simp'],
    clash:['lone_wolf','rat','knife']
  },
  lone_wolf:{
    id:'lone_wolf', code:'LONE',
    en:'The Lone Wolf', cn:'独狼',
    img:'assets/personas/p12.png', rarity:'普通',
    tag:'#我一个人就够了 #队友是累赘',
    punch:'组队？不了，我的狗都比你听话。',
    summary:'不是社交恐惧，是社交能力浪费。你相信——能一个人解决的，绝不让别人添乱。',
    vibes:['语音常年关闭','最怕被邀请组队','撤离时最爱听自己的脚步声'],
    match:['sniper','rat','headtap'],
    clash:['squad_commander','babysitter','evita_simp']
  },
  safe_rusher:{
    id:'safe_rusher', code:'SAFE',
    en:'Safe Rusher', cn:'保险箱冲锋选手',
    img:'assets/personas/p13.png', rarity:'稀有',
    tag:'#刷点如风 #开局冲保险箱',
    punch:'我不是来玩的，我是来下班的。',
    summary:'路线比外卖员熟，时间比时钟准。打开保险箱那一秒钟你闻到的是金钱味。',
    vibes:['背点表比课表还清楚','最怕被人先一步到点位','最爱的词是「这把出货」'],
    match:['w_maniac','loot_goblin','knife'],
    clash:['rat','extraction_camper','babysitter']
  },
  headtap:{
    id:'headtap', code:'HEAD',
    en:'Headtap Artist', cn:'爆头艺术家',
    img:'assets/personas/p14.png', rarity:'稀有',
    tag:'#精准制导 #一枪一个头',
    punch:'我不浪费子弹，我浪费的是你。',
    summary:'别人打 10 枪爆一次头，你打一枪爆十次头。鼠标 DPI 比你心跳数稳定。',
    vibes:['看到别人打腿会叹气','枪械后坐力图表背得比课文还熟','死亡回放里的最高艺术'],
    match:['sniper','lone_wolf','thermal'],
    clash:['leg_meta','knife','loot_goblin']
  },
  backpack:{
    id:'backpack', code:'BACK',
    en:'Backpack Maxxer', cn:'背包塞满大师',
    img:'assets/personas/p15.png', rarity:'普通',
    tag:'#空间魔法师 #每一格都不浪费',
    punch:'这个格子还能塞一颗电池，信不信？',
    summary:'你的背包是俄罗斯方块冠军现场。物资整理比整理人生还上瘾。',
    vibes:['出发前整理 10 分钟','看到没塞满的格子会焦虑','朋友搬家都来找你'],
    match:['loot_goblin','stash','safe_rusher'],
    clash:['sniper','knife','apex']
  },
  stash:{
    id:'stash', code:'STSH',
    en:'Stash Hoarder', cn:'仓库囤囤鼠',
    img:'assets/personas/p16.png', rarity:'普通',
    tag:'#舍不得卖 #万一以后用得上',
    punch:'这个以后说不定会涨，我先留着。',
    summary:'仓库容量永远不够，不是你东西多，是你不舍得。连过期药品都要收藏。',
    vibes:['仓库整理三小时，实际用 0 件','最爱的词是「以防万一」','看到「限量」两个字心就软'],
    match:['loot_goblin','backpack','babysitter'],
    clash:['knife','sniper','apex']
  },
  babysitter:{
    id:'babysitter', code:'BABY',
    en:'The Babysitter', cn:'队伍大保姆',
    img:'assets/personas/p17.png', rarity:'稀有',
    tag:'#暖心医疗兵 #队友的爹妈',
    punch:'你先撤，我断后。',
    summary:'队里摔了给你扶，出血了给你包，没子弹给你递。你打不打得赢不重要，队友活着就行。',
    vibes:['医疗包比弹匣多','最喜欢的反馈是「谢谢大哥」','死亡原因 80% 是救队友'],
    match:['squad_commander','evita_simp','stash'],
    clash:['lone_wolf','rat','knife']
  },
  apex:{
    id:'apex', code:'APEX',
    en:'The Dark Zone Apex', cn:'暗区顶点',
    img:'assets/personas/p18.png', rarity:'隐藏',
    tag:'#隐藏款 #天选之人',
    punch:'我不说话，我只让你看结算。',
    summary:'枪法、意识、路线、节奏，全部顶配。你不是在玩游戏，你是游戏的一部分。——恭喜你抽到了隐藏款。',
    vibes:['KD 是别人的梦想','连举报你的人都尊敬你','退游都会被挽留'],
    match:['chad','headtap','thermal'],
    clash:['rat','loot_goblin','stash']
  }
};

/* 20 道题 */
const QUESTIONS = [
  {
    q:'开局落地，你第一件事是？',
    options:[
      { text:'冲最近的保险箱，时间就是金钱', w:{ safe_rusher:3, w_maniac:1, loot_goblin:1 } },
      { text:'蹲一波声音，听清再动',       w:{ rat:3, extraction_camper:2, sniper:1 } },
      { text:'报点给队友，安排分工',       w:{ squad_commander:3, babysitter:1 } },
      { text:'扛枪冲锋，打起来就对了',     w:{ w_maniac:3, knife:2, chad:1 } }
    ]
  },
  {
    q:'听到远处有枪声，你的第一反应是？',
    options:[
      { text:'绕过去打黑枪 / 收尸',    w:{ rat:3, sniper:2, headtap:1 } },
      { text:'换方向撤，不蹚浑水',     w:{ lone_wolf:2, stash:1, extraction_camper:1 } },
      { text:'喊队友一起过去支援',     w:{ squad_commander:3, babysitter:2 } },
      { text:'直接冲过去加入战场',     w:{ w_maniac:3, chad:2, knife:1 } }
    ]
  },
  {
    q:'一个 T6 甲和一支好狙同时出现在你面前，你选？',
    options:[
      { text:'T6 甲必须是我的',          w:{ chad:3, apex:1, evita_simp:1 } },
      { text:'狙才是真爱，甲卖了换子弹', w:{ sniper:3, headtap:2 } },
      { text:'都捡，背包塞得下',         w:{ backpack:3, loot_goblin:2, stash:1 } },
      { text:'都不要，不想冒险被发现',   w:{ rat:2, lone_wolf:2 } }
    ]
  },
  {
    q:'你背包里永远少不了的是？',
    options:[
      { text:'一堆投掷物，尤其是 GHO', w:{ extraction_camper:3, rat:1 } },
      { text:'热成像瞄具',             w:{ thermal:3, headtap:1 } },
      { text:'医疗包，多多益善',       w:{ babysitter:3, stash:1 } },
      { text:'一把随时换的备用刀',     w:{ knife:3, w_maniac:1 } }
    ]
  },
  {
    q:'遇到一个只带白板装的新手，你选择？',
    options:[
      { text:'放他一马，没必要',       w:{ babysitter:3, evita_simp:1 } },
      { text:'打腿取乐，让他见识一下', w:{ leg_meta:3, knife:1 } },
      { text:'直接一枪爆头结束',       w:{ headtap:3, sniper:2, apex:1 } },
      { text:'躲起来观察他会去哪',     w:{ rat:3, extraction_camper:2 } }
    ]
  },
  {
    q:'你玩这个游戏最享受的瞬间是？',
    options:[
      { text:'成功撤离，包里东西价值六位数', w:{ loot_goblin:3, safe_rusher:2, backpack:1 } },
      { text:'一枪爆头的清脆声',             w:{ headtap:3, sniper:2 } },
      { text:'指挥队伍打出完美团灭',         w:{ squad_commander:3, chad:1 } },
      { text:'阴到别人，对方还不知道怎么死的', w:{ rat:3, extraction_camper:2 } }
    ]
  },
  {
    q:'组队偏好？',
    options:[
      { text:'四人满编，指挥系统拉满', w:{ squad_commander:3, chad:1, babysitter:1 } },
      { text:'双排就够了，稳稳发育',   w:{ babysitter:2, evita_simp:1, safe_rusher:1 } },
      { text:'独狼，我只信自己',       w:{ lone_wolf:3, sniper:2, rat:1 } },
      { text:'随机匹配，玩的是缘分',   w:{ knife:2, w_maniac:1 } }
    ]
  },
  {
    q:'仓库满了怎么办？',
    options:[
      { text:'一件都舍不得卖',         w:{ stash:3, loot_goblin:1 } },
      { text:'把装备塞到背包带出去用', w:{ backpack:3, chad:1 } },
      { text:'高价值的留着，其他全卖', w:{ safe_rusher:2, squad_commander:1 } },
      { text:'氪金扩仓库，完美解决',   w:{ evita_simp:3, chad:1 } }
    ]
  },
  {
    q:'看到陌生人向你挥手，你？',
    options:[
      { text:'挥回去，世界有爱',         w:{ babysitter:3, evita_simp:2 } },
      { text:'挥回去，然后枪响',         w:{ rat:3, headtap:1, knife:1 } },
      { text:'不理他，稳住阵型',         w:{ squad_commander:2, lone_wolf:2 } },
      { text:'转身就跑，不信任何人',     w:{ stash:1, extraction_camper:1, sniper:1 } }
    ]
  },
  {
    q:'关于「撤离点」，你的看法是？',
    options:[
      { text:'最危险的地方，轻易不靠近',     w:{ lone_wolf:2, safe_rusher:1 } },
      { text:'我的主战场，专蹲别人撤离',     w:{ extraction_camper:3, rat:2 } },
      { text:'终点线，听到音乐就松口气',     w:{ loot_goblin:2, backpack:2, babysitter:1 } },
      { text:'没什么特别的，路过而已',       w:{ chad:2, w_maniac:1, apex:1 } }
    ]
  },
  {
    q:'如果可以拥有一个超能力，你选？',
    options:[
      { text:'热成像永久开启', w:{ thermal:3, headtap:1 } },
      { text:'隐身三十秒',     w:{ rat:3, extraction_camper:2 } },
      { text:'一击必杀',       w:{ headtap:3, apex:2, sniper:1 } },
      { text:'无限空间背包',   w:{ backpack:3, loot_goblin:2, stash:1 } }
    ]
  },
  {
    q:'你觉得「装备好坏」和「技术好坏」哪个重要？',
    options:[
      { text:'装备，有钱能使鬼推磨',         w:{ chad:3, evita_simp:1, stash:1 } },
      { text:'技术，裸装也能干翻 T6',        w:{ sniper:3, knife:2, apex:1 } },
      { text:'意识最重要，两者都次要',       w:{ rat:2, squad_commander:2, lone_wolf:1 } },
      { text:'反正都没我重要（bushi）',      w:{ evita_simp:2, w_maniac:1 } }
    ]
  },
  {
    q:'你最讨厌遇到什么样的敌人？',
    options:[
      { text:'GHO 扔得比你腰还准的',           w:{ w_maniac:2, knife:2, safe_rusher:1 } },
      { text:'永远不出现只打黑枪的',           w:{ chad:2, squad_commander:1, apex:1 } },
      { text:'热成像全套，你连草都不敢蹲',     w:{ rat:3, sniper:2, knife:1 } },
      { text:'枪枪爆头的',                     w:{ leg_meta:2, backpack:1, loot_goblin:1 } }
    ]
  },
  {
    q:'任务 / 皮肤 / 剧情，你最在意哪个？',
    options:[
      { text:'皮肤和挂件，好看最重要',   w:{ evita_simp:3 } },
      { text:'任务，有奖励我才玩',       w:{ safe_rusher:2, loot_goblin:2 } },
      { text:'剧情，沉浸感拉满',         w:{ evita_simp:2, babysitter:1 } },
      { text:'我只玩对抗，别的不重要',   w:{ chad:2, apex:2, w_maniac:2, headtap:1 } }
    ]
  },
  {
    q:'队友倒地了，你在 50 米外，正在交火，你？',
    options:[
      { text:'立刻脱战去救，不能丢下',   w:{ babysitter:3, squad_commander:1 } },
      { text:'打完再说，保命要紧',       w:{ lone_wolf:2, chad:1, w_maniac:1 } },
      { text:'喊他别投降，顺便报个点',   w:{ squad_commander:3, evita_simp:1 } },
      { text:'太远了，让他投了吧',       w:{ rat:1, safe_rusher:1, loot_goblin:1 } }
    ]
  },
  {
    q:'你最想被其他玩家叫做什么？',
    options:[
      { text:'大佬、神、顶点',     w:{ apex:3, chad:2, headtap:1 } },
      { text:'指挥、队长、带飞',   w:{ squad_commander:3, babysitter:1 } },
      { text:'刺客、阴影、绝影',   w:{ rat:3, sniper:2 } },
      { text:'乐子人、开心果',     w:{ knife:3, leg_meta:2, w_maniac:1 } }
    ]
  },
  {
    q:'死亡回放里你最接受不了哪种？',
    options:[
      { text:'被裸装一枪爆头',       w:{ chad:2, backpack:2, stash:1 } },
      { text:'被 GHO 炸死在撤离点',  w:{ w_maniac:3, knife:1, loot_goblin:1 } },
      { text:'被刀仔跑刀砍死',       w:{ sniper:3, headtap:1, chad:1 } },
      { text:'被队友误伤',           w:{ lone_wolf:3, babysitter:1 } }
    ]
  },
  {
    q:'真实朋友在现实中形容你，更像？',
    options:[
      { text:'精打细算的理财大师',    w:{ stash:3, backpack:2, loot_goblin:1 } },
      { text:'话题中心的乐子人',      w:{ knife:3, w_maniac:2, leg_meta:1 } },
      { text:'靠谱到可怕的组织者',    w:{ squad_commander:3, babysitter:2 } },
      { text:'内敛高冷的扫地僧',      w:{ lone_wolf:3, sniper:1, apex:1, headtap:1 } }
    ]
  },
  {
    q:'对你来说，暗区突围的终极意义是？',
    options:[
      { text:'赚钱 + 爽 + 出货',           w:{ loot_goblin:3, safe_rusher:2, backpack:1 } },
      { text:'证明我最强',                 w:{ apex:3, chad:2, headtap:1 } },
      { text:'和朋友 / 喜欢的角色待在一起', w:{ evita_simp:3, babysitter:2, squad_commander:1 } },
      { text:'活着，且让别人活不成',       w:{ rat:3, extraction_camper:2, sniper:1 } }
    ]
  },
  {
    q:'如果有一天你不玩了，原因最可能是？',
    options:[
      { text:'东西越攒越多，仓库装不下了', w:{ stash:3, loot_goblin:1 } },
      { text:'太卷了，没人打得过我',       w:{ apex:3, headtap:2, chad:1 } },
      { text:'队友全跑光了，一个人没意思', w:{ babysitter:2, squad_commander:2, evita_simp:1 } },
      { text:'直到现在我都没真的玩过它（笑）', w:{ knife:2, leg_meta:2, w_maniac:1 } }
    ]
  }
];

/* 人格签名维度 */
const SIGNATURE = {
  offense:['w_maniac','chad','knife','headtap','apex','leg_meta'],
  stealth:['rat','extraction_camper','sniper','lone_wolf'],
  support:['squad_commander','babysitter','evita_simp'],
  loot:   ['loot_goblin','backpack','stash','safe_rusher'],
  tech:   ['thermal','headtap','apex','sniper']
};

window.__DATA__ = { PERSONAS, QUESTIONS, SIGNATURE };
