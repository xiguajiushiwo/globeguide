export type JapanPhoto = {
  src: string;
  alt: string;
  credit: string;
  url: string;
};

export type JapanStop = {
  id: string;
  name: string;
  city: string;
  coordinates: [number, number];
  arrival: string;
  photoTip: string;
  photo?: JapanPhoto;
};

export type JapanLeg = {
  from: string;
  to: string;
  instruction: string;
  fare: string;
  evidence?: string;
  evidenceLabel?: string;
};

export type JapanFieldDay = {
  day: number;
  title: string;
  base: string;
  stops: [JapanStop, ...JapanStop[]];
  legs: JapanLeg[];
  fieldNotes: string[];
};

const pexels = (id: string, photographer: string): JapanPhoto => ({
  src: `/images/japan-${id}.jpg`,
  alt: '',
  credit: `${photographer} / Pexels`,
  url: `https://www.pexels.com/photo/${id}/`,
});

const shibuya = { ...pexels('19658291', 'wwarby'), alt: '夜间的涩谷十字路口和周边街景' };
const kiyomizu = { ...pexels('10453082', 'Natsuko Aoyama'), alt: '秋季的京都清水寺本堂与山坡' };
const fushimi = { ...pexels('1310788', 'Vincent Ma Janssen'), alt: '伏见稻荷大社的千本鸟居步道' };

const yahooFare = (from: string, to: string) => `https://transit.yahoo.co.jp/search/result?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

// Coordinates identify landmarks, not station exits or a surveyed walking path.
export const japanFieldDays: [JapanFieldDay, ...JapanFieldDay[]] = [
  {
    day: 1, title: '机场到酒店', base: '东京住宿基点：上野站步行圈；以下以羽田 T3 入境为例，成田到达请改查京成或 JR。',
    stops: [{ id: 'ueno', name: '上野公园', city: '东京', coordinates: [139.7738278, 35.7152915], arrival: '先办入住或寄存行李；上野公园作为酒店周边的方位锚点。', photoTip: '第一天不安排必须完成的拍照任务，优先摸清次日进站入口。' }],
    legs: [{ from: '羽田机场 T3', to: '上野住宿区', instruction: '到京急羽田机场第 3 航站楼站，坐开往品川方向的车至品川；按当天路线换 JR 山手线至上野。京急列车终点和直通情况不同，上车前看站台显示。', fare: '羽田 T3 → 品川：成人 IC 参考 ¥454；品川 → 上野另计。', evidence: yahooFare('羽田空港第３ターミナル', '品川'), evidenceLabel: '查询京急段' }],
    fieldNotes: ['先从航班信息确认 HND/NRT 和航站楼，不要只看“东京机场”。', '酒店地址必须精确到门牌；上野有 JR、东京地铁和京成多个站，按酒店地图选择出口。', '晚到时先查末班；别把含换乘的路线当作直达。'],
  },
  {
    day: 2, title: '上野、浅草、晴空塔', base: '从上野站出发，上午留给博物馆或公园，下午浅草，日落前后到晴空塔。',
    stops: [
      { id: 'ueno-park', name: '上野公园', city: '东京', coordinates: [139.7738278, 35.7152915], arrival: '上野站出站后按“公园口 / Ueno Park”指示走；若进博物馆，先核当天休馆与最后入馆时间。', photoTip: '公园主通道适合广角街景；拍人像先征得同意。' },
      { id: 'sensoji', name: '浅草寺', city: '东京', coordinates: [139.7955265, 35.7134032], arrival: '东京地铁银座线在浅草终点下车；跟随雷门与浅草寺指示，经仲见世走向本堂。', photoTip: '从雷门朝仲见世拍纵深；不要堵住参拜动线。' },
      { id: 'skytree', name: '东京晴空塔', city: '东京', coordinates: [139.8107141, 35.7100543], arrival: '浅草站的东武线路与东京地铁不是同一闸口；找东武晴空塔线到“とうきょうスカイツリー”站。', photoTip: '可从隅田川沿岸先拍塔身，再按预约时段进展望台。' },
    ],
    legs: [
      { from: '上野', to: '浅草', instruction: '东京地铁银座线，往浅草方向坐到终点；出站后步行到雷门、仲见世、浅草寺。', fare: '成人 IC 参考 ¥178。', evidence: yahooFare('上野', '浅草'), evidenceLabel: '查询本段' },
      { from: '浅草', to: '东京晴空塔', instruction: '东武晴空塔线普通车一站；也可沿隅田川步行，步行方案由实时地图判断。', fare: '成人 IC 参考 ¥157；步行 ¥0。', evidence: yahooFare('浅草', 'とうきょうスカイツリー'), evidenceLabel: '查询本段' },
    ],
    fieldNotes: ['浅草站有东京地铁、都营与东武三个体系；转去晴空塔时不要回到银座线闸口。', '晴空塔展望台需要按日期与时段买票；如果云层低，保留河岸免费拍照方案。', '这天进上野博物馆就减少商店街停留，别同时排满三个馆。'],
  },
  {
    day: 3, title: '原宿、涩谷、新宿', base: '从上野乘 JR 山手线到原宿，沿西南方向游玩；晚间从新宿回酒店。',
    stops: [
      { id: 'meiji', name: '明治神宫本殿', city: '东京', coordinates: [139.6996266, 35.6748417], arrival: '原宿站一带按明治神宫指示进入林荫参道，到本殿还需较长步行。', photoTip: '参道与鸟居可拍环境；神宫内遵守现场摄影标志。' },
      { id: 'shibuya', name: '涩谷十字路口', city: '东京', coordinates: [139.7005723, 35.6594821], arrival: '从涩谷站找八公口方向；大站内部通道会变化，跟着现场“Hachiko”指示。', photoTip: '照片是路口夜景示例；拍摄时站在人行道安全区域，不在过街中央停留。', photo: shibuya },
    ],
    legs: [
      { from: '原宿', to: '涩谷', instruction: 'JR 山手线内回/涩谷方向一站；体力充足可从表参道一带步行，路线以当天导航为准。', fare: '成人 IC 参考 ¥155。', evidence: yahooFare('原宿', '渋谷'), evidenceLabel: '查询本段' },
      { from: '涩谷', to: '新宿', instruction: 'JR 山手线往新宿方向；也可比较埼京线直达班次，按站台屏幕确认。', fare: '直达优先路线成人 IC 参考 ¥199。', evidence: yahooFare('渋谷', '新宿'), evidenceLabel: '查询本段' },
    ],
    fieldNotes: ['明治神宫本殿不在原宿站门口，留足进出参道时间。', '涩谷与新宿大站的“最近出口”取决于具体商店或酒店，不提供未经核验的出口编号。', '十字路口在信号灯允许时通行；夜景示例照片不代表当天广告屏或灯光样式。'],
  },
  {
    day: 4, title: '东京机动日', base: '从上野出发；镰仓、乐园和市内展馆三选一，地图不将互斥方案画成一条线。',
    stops: [{ id: 'ueno-day4', name: '上野公园', city: '东京', coordinates: [139.7738278, 35.7152915], arrival: '若遇雨或交通中断，可留在东京市内，选择上野的博物馆或其他室内场馆。', photoTip: '当天按所选项目在实时地图收藏实际入口。' }],
    legs: [{ from: '上野酒店', to: '当天所选项目', instruction: '前晚确定唯一主项目，再查当日开放、预约票和往返末班；跨县项目不要跟另一个远距离项目叠加。', fare: '取决于所选项目；不提供虚假的统一票价。' }],
    fieldNotes: ['如果隔日从东京站坐新干线，今晚把乘车站、列车号、行李尺寸和退房时间逐项确认。'],
  },
  {
    day: 5, title: '东京转京都、锦市场', base: '京都住宿基点：京都站步行圈；先放行李，再轻装去锦市场。',
    stops: [{ id: 'nishiki', name: '锦市场', city: '京都', coordinates: [135.7655699, 35.0050244], arrival: '抵达京都站后先处理行李；按酒店位置选择地铁或巴士到四条/河原町周边，再步行入市场。', photoTip: '市场是通行空间，不边走边吃；拍摊主、店内商品先征得允许。' }],
    legs: [{ from: '东京站', to: '京都站', instruction: '东海道新干线 Nozomi 指定席；按车票上的东京/品川乘车站、列车号、车厢和座位进站。SmartEX 订票时选具体班次。', fare: 'SmartEX 2025-04-01 官方表：东京 → 京都普通车 Nozomi 指定席常规季节成人 ¥13,970；繁忙/淡季与产品可能调整。', evidence: 'https://smart-ex.jp/en/product/plan/service/pdf/service_fares_reserved.pdf', evidenceLabel: '查看官方价格表' }],
    fieldNotes: ['东京站与品川站都可乘东海道新干线，票面起点必须与实际上车站一致。', '从京都站到酒店的最后几百米按酒店地址实时导航，不猜测车站出口。', '锦市场店铺营业时间不统一；跨城当天不安排固定时段的远处门票。'],
  },
  {
    day: 6, title: '清水寺、三年坂、八坂', base: '从京都站出发，清水寺上坡、三年坂下坡，最后走到八坂神社；下雨时石板路要减速。',
    stops: [
      { id: 'kiyomizu', name: '清水寺本堂', city: '京都', coordinates: [135.7844389, 34.994303], arrival: '先导航到清水寺主入口；公交下车后仍有上坡步行，拥挤或带长者可比较出租车落点。', photoTip: '实景图显示秋季本堂；红叶只在对应季节出现，拍摄请遵守寺院限制。', photo: kiyomizu },
      { id: 'sannenzaka', name: '三年坂', city: '京都', coordinates: [135.7808266, 34.9979857], arrival: '从清水寺下行，经产宁坂/三年坂向祇园方向；沿途店铺和巷口密集，用地图确认下一点。', photoTip: '在不挡人行的位置拍坡道与传统町家；勿闯入私人院落。' },
      { id: 'yasaka', name: '八坂神社', city: '京都', coordinates: [135.7782611, 35.0036027], arrival: '沿东山街巷往北，抵达八坂神社后再按体力决定是否去圆山公园。', photoTip: '黄昏可拍西楼门一带；避开祭祀活动和明确禁拍区域。' },
    ],
    legs: [
      { from: '京都站', to: '清水寺', instruction: '京都市巴士 206 系统可到五条坂一带，再上坡步行；京都公交线路、站台和拥堵会变化，出发前看京都市交通局与实时导航。', fare: '普通市巴士均一区间票价请在上车前查现价；这里不把未核实的金额写死。', evidence: 'https://www2.city.kyoto.lg.jp/kotsu/webguide/en/', evidenceLabel: '京都市交通局' },
      { from: '清水寺', to: '八坂神社', instruction: '经三年坂、二年坂方向步行；途中有台阶与坡道，路线不适合直接按直线距离估计。', fare: '步行 ¥0。' },
    ],
    fieldNotes: ['这里的三个点适合连续步行，地图只标位置，不伪造转角级步行线。', '清水寺门票、开放与夜间特别参观按日期查官网。', '祇园居民街道有禁拍和禁入提示，现场标志优先于网络照片。'],
  },
  {
    day: 7, title: '伏见稻荷；岚山作整日替换', base: '主方案是伏见稻荷；岚山在京都西侧，建议作为整日替换，不与伏见硬拼。',
    stops: [
      { id: 'fushimi', name: '伏见稻荷千本鸟居', city: '京都', coordinates: [135.7737731, 34.9672545], arrival: '京都站乘 JR 奈良线到稻荷站；出站按大社指示步行入内，千本鸟居在参道继续向山上。', photoTip: '照片为鸟居内步道；不要为了空镜挡住通行或触碰鸟居。', photo: fushimi },
      { id: 'arashiyama', name: '岚山竹林（替换方案）', city: '京都', coordinates: [135.6711482, 35.0167419], arrival: '若选岚山，先确定竹林或渡月桥为首站，再查 JR 嵯峨岚山、阪急岚山或岚电站的步行距离。', photoTip: '竹林早间光线和人流随季节变化；不要误把伏见鸟居照片当竹林。' },
    ],
    legs: [{ from: '京都站', to: '稻荷站', instruction: 'JR 奈良线普通车到稻荷站；确认列车停靠稻荷，再由站前步行至伏见稻荷大社。', fare: '成人 IC 参考 ¥150。', evidence: yahooFare('京都', '稲荷'), evidenceLabel: '查询本段' }],
    fieldNotes: ['千本鸟居入口与山顶不是同一个点；上山长度依体力决定，留原路返回时间。', '岚山是独立替换路线，不把两处照片与同一天乘车费用混算。'],
  },
  {
    day: 8, title: '京都经奈良到大阪', base: '先处理大件行李：寄送大阪酒店或在有保障的地点寄存；奈良公园不适合拖箱。',
    stops: [
      { id: 'todaiji', name: '东大寺', city: '奈良', coordinates: [135.8397568, 34.6882437], arrival: '近铁奈良站出站后按东大寺/奈良公园方向步行；不要误在 JR 奈良站按相同步行距离估计。', photoTip: '大佛殿外部适合留广角；殿内拍摄按现场规则。' },
      { id: 'nara-park', name: '奈良公园', city: '奈良', coordinates: [135.8430955, 34.6806024], arrival: '东大寺与公园步行相连；遇鹿群保持距离，鹿饼按现场提示购买和投喂。', photoTip: '鹿是野生动物，先观察再拍，不以食物引诱动物冲向人群。' },
      { id: 'dotonbori', name: '道顿堀戎桥', city: '大阪', coordinates: [135.5013046, 34.6690672], arrival: '近铁奈良回到大阪难波，先到酒店放行李，再步行去戎桥。', photoTip: '桥上人流密集，靠边短暂停留；夜间招牌会随商户变化。' },
    ],
    legs: [
      { from: '京都站', to: '近铁奈良', instruction: '到京都站近铁闸口，查开往近铁奈良的班次；若选特急，还需要另买特急券。', fare: '普通列车成人 IC 参考 ¥760；特急另加座席费用。', evidence: yahooFare('京都', '近鉄奈良'), evidenceLabel: '查询本段' },
      { from: '近铁奈良', to: '大阪难波', instruction: '近铁奈良线向大阪难波方向；到站后先认准近铁大阪难波站，再按酒店地址步行。', fare: '普通列车成人 IC 参考 ¥680；特急另计。', evidence: yahooFare('近鉄奈良', '大阪難波'), evidenceLabel: '查询本段' },
    ],
    fieldNotes: ['奈良半日适合东大寺和公园；若加春日大社，应减少大阪晚间安排。', '“近铁奈良”“JR 奈良”“大阪难波”“南海难波”不是同一座车站。', '酒店位于难波步行圈是本路线的假设，其他酒店要重新算最后一段。'],
  },
  {
    day: 9, title: '大阪城与难波', base: '从难波出发；大阪城是上午主项目，下午选梅田或难波一片，不把 USJ 塞进来。',
    stops: [
      { id: 'osaka-castle', name: '大阪城天守阁', city: '大阪', coordinates: [135.5253958, 34.6871828], arrival: '大阪城公园范围很大；先在导航里选择天守阁或具体入口，不把“到公园”当作“到天守阁”。', photoTip: '天守阁外景可从城濠与广场拍摄；进馆票价与展览按官网查。' },
      { id: 'dotonbori-day9', name: '道顿堀戎桥', city: '大阪', coordinates: [135.5013046, 34.6690672], arrival: '晚餐前返回难波片区；若下午改去梅田，应在实时地图重新选回程线路。', photoTip: '桥上夜景适合城市记录，留意行人和车辆。' },
    ],
    legs: [{ from: '难波酒店', to: '大阪城天守阁', instruction: '先步行至酒店附近实际运营商车站，再查到大阪城公园或谷町四丁目等站的当日线路；两站到天守阁的步行口不同。', fare: '随酒店所在站与运营商变化；购票前实时查询。' }],
    fieldNotes: ['大阪城公园免费区域与天守阁收费入口不同。', 'USJ 需要另留完整一天，不能按大阪市区景点的交通预算估。'],
  },
  {
    day: 10, title: '难波到关西机场', base: '以 KIX 离境、南海难波站附近酒店为例；航班若从 ITM 起飞，整段必须重查。',
    stops: [{ id: 'kix', name: '关西国际机场', city: '大阪', coordinates: [135.222523, 34.4342045], arrival: '在南海难波站核对关西机场方向站台与列车种别；到机场后看航空公司对应航站楼。', photoTip: '返程只标交通终点；不把航站楼照片当作实时导向。' }],
    legs: [{ from: '南海难波', to: '关西机场', instruction: '南海空港线普通/空港急行到关西机场站；若选 Rapi:t 特急，需要确认特急座席票。', fare: '普通/空港急行成人 IC 参考 ¥970；Rapi:t 特急另计。', evidence: yahooFare('南海難波', '関西空港'), evidenceLabel: '查询本段' }],
    fieldNotes: ['前一晚核对起飞机场、航站楼、首班车、行李额度和航空公司建议的到机场时间。', '机场铁路站与实际值机柜台仍有步行或接驳距离；国际航班留足安检与出境时间。'],
  },
];
