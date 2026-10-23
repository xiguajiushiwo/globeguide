export type JapanThemeCategory = 'anime' | 'heritage' | 'museum';

export type JapanThemePlace = {
  id: string;
  category: JapanThemeCategory;
  name: string;
  city: string;
  coordinates: [number, number];
  context: string;
  visitTip: string;
  source: { label: string; url: string };
};

export const japanThemeCategories: { id: JapanThemeCategory; label: string }[] = [
  { id: 'anime', label: '动漫取景' },
  { id: 'heritage', label: '人文' },
  { id: 'museum', label: '博物馆' },
];

// A scene association is a travel reference, not an endorsement by the rights holder.
export const japanThemePlaces: JapanThemePlace[] = [
  { id: 'suga-stairs', category: 'anime', name: '须贺神社阶梯', city: '东京 · 四谷', coordinates: [139.7225263, 35.6853339], context: '《你的名字。》结尾场景的巡礼参考。地图标在神社附近，具体拍摄阶梯请在现场辨认。', visitTip: '住宅街通道狭窄，勿占据台阶拍摄或拍入住户门窗。', source: { label: '作品资料', url: 'https://en.wikipedia.org/wiki/Your_Name' } },
  { id: 'kamakura-crossing', category: 'anime', name: '镰仓高校前站海侧道口', city: '神奈川 · 镰仓', coordinates: [139.5007098, 35.3067209], context: '《灌篮高手》片头海边电车画面的巡礼参考。点位标在车站周边，实际取景角度以现场安全位置为准。', visitTip: '这里仍有列车和车流，禁止进入轨道或在道路中央停留。', source: { label: '作品资料', url: 'https://en.wikipedia.org/wiki/Slam_Dunk_(manga)' } },
  { id: 'toyosato-school', category: 'anime', name: '丰乡小学校旧校舍群', city: '滋贺 · 丰乡', coordinates: [136.2325671, 35.2036085], context: '《轻音少女》粉丝熟悉的校舍巡礼地点；是现实中的历史建筑，不是作品官方主题园。', visitTip: '先查看开放与活动安排，进入建筑时遵守馆内摄影规定。', source: { label: '场所资料', url: 'https://www.town.toyosato.shiga.jp/' } },
  { id: 'hida-furukawa', category: 'anime', name: '飞驒古川站', city: '岐阜 · 飞驒', coordinates: [137.1896089, 36.2367306], context: '《你的名字。》飞驒地区场景巡礼的常见起点；电影画面并非车站的逐帧实拍。', visitTip: '在站内拍照先确认站方规则，不越过站台黄线。', source: { label: '地方观光', url: 'https://www.hida-kankou.jp/' } },
  { id: 'washinomiya', category: 'anime', name: '鹫宫神社', city: '埼玉 · 久喜', coordinates: [139.6548687, 36.0999753], context: '《幸运星》相关巡礼地，也是仍在使用的神社。', visitTip: '先以参拜者身份遵守礼仪；绘马、活动与拍摄规则以神社现场为准。', source: { label: '作品资料', url: 'https://en.wikipedia.org/wiki/Lucky_Star_(manga)' } },
  { id: 'mito-beach', category: 'anime', name: '三津浜海水浴场', city: '静冈 · 沼津', coordinates: [138.897304, 35.0206983], context: '《Love Live! Sunshine!!》沼津内浦地区巡礼的海边地标，周边有居民与经营场所。', visitTip: '海岸天气和开放范围会变化；拍摄不妨碍渔业、商户和居民。', source: { label: '作品资料', url: 'https://en.wikipedia.org/wiki/Love_Live!_Sunshine!!' } },
  { id: 'akihabara-radio', category: 'anime', name: '秋叶原 Radio Kaikan', city: '东京 · 秋叶原', coordinates: [139.772, 35.698], context: '《命运石之门》关联的秋叶原地标。现有建筑与作品播出时的街景不同。', visitTip: '从秋叶原站电器街口步行前往；商场内拍摄以店铺规定为准。', source: { label: '场所官网', url: 'https://www.akihabara-radiokaikan.co.jp/' } },
  { id: 'sensoji-theme', category: 'heritage', name: '浅草寺', city: '东京 · 浅草', coordinates: [139.7955265, 35.7134032], context: '东京历史悠久的寺院与仲见世商店街，适合观察寺社、街区和城市生活。', visitTip: '本堂与参道参观规则不同，遇祭事听从现场指引。', source: { label: '寺院官网', url: 'https://www.senso-ji.jp/' } },
  { id: 'meiji-theme', category: 'heritage', name: '明治神宫', city: '东京 · 原宿', coordinates: [139.6996266, 35.6748417], context: '从城市中心步入林荫参道，参观神宫建筑与常设文化展示。', visitTip: '入口到本殿仍有较长步行；开放时间随季节变化。', source: { label: '神宫官网', url: 'https://www.meijijingu.or.jp/en/' } },
  { id: 'kiyomizu-theme', category: 'heritage', name: '清水寺', city: '京都 · 东山', coordinates: [135.7844389, 34.994303], context: '京都东山的历史寺院，可与三年坂传统街区安排为半日步行。', visitTip: '上坡与石阶较多；夜间特别开放和禁拍区域请当日确认。', source: { label: '寺院官网', url: 'https://www.kiyomizudera.or.jp/en/' } },
  { id: 'fushimi-theme', category: 'heritage', name: '伏见稻荷大社', city: '京都 · 伏见', coordinates: [135.772576, 34.96714], context: '以千本鸟居与稻荷信仰闻名；鸟居步道延伸到山上。', visitTip: '别把山顶往返当作短暂停留，天黑后留意脚下和天气。', source: { label: '神社官网', url: 'https://inari.jp/en/' } },
  { id: 'nara-park-theme', category: 'heritage', name: '奈良公园与东大寺周边', city: '奈良', coordinates: [135.843, 34.685], context: '以古都寺社与公园景观为主，适合步行串联东大寺和周边历史遗产。', visitTip: '野生鹿会抢食，按当地指示投喂鹿仙贝，照看好随身物品。', source: { label: '奈良观光', url: 'https://www.visitnara.jp/' } },
  { id: 'tokyo-national-museum', category: 'museum', name: '东京国立博物馆', city: '东京 · 上野', coordinates: [139.776, 35.719], context: '日本与亚洲艺术、考古藏品的主要博物馆；常设展与特展票务分开核对。', visitTip: '先选最想看的馆和展厅；闭馆日与特展预约以官网为准。', source: { label: '博物馆官网', url: 'https://www.tnm.jp/?lang=en' } },
  { id: 'ghibli-museum', category: 'museum', name: '三鹰之森吉卜力美术馆', city: '东京 · 三鹰', coordinates: [139.5704493, 35.6962391], context: '以吉卜力动画创作为主题的美术馆；属于作品相关场馆，不是电影场景的实景取景地。', visitTip: '通常需要提前预约指定日期门票；馆内摄影规定请查官网。', source: { label: '美术馆官网', url: 'https://www.ghibli-museum.jp/en/' } },
  { id: 'kyoto-national-museum', category: 'museum', name: '京都国立博物馆', city: '京都 · 东山', coordinates: [135.772, 34.99], context: '收藏和展示日本历史艺术，靠近三十三间堂；展品会轮换。', visitTip: '查看当天开放的展馆与特展时段，勿按旧展单规划参观。', source: { label: '博物馆官网', url: 'https://www.kyohaku.go.jp/eng/' } },
  { id: 'hiroshima-peace-museum', category: 'museum', name: '广岛和平纪念资料馆', city: '广岛', coordinates: [132.453, 34.392], context: '通过史料了解原子弹轰炸与和平纪念历史，可与和平纪念公园一起参观。', visitTip: '部分内容较沉重；留足参观时间并核对预约、票价及开放时段。', source: { label: '资料馆官网', url: 'https://hpmmuseum.jp/?lang=eng' } },
];
