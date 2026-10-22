export const japanGuideReviewedAt = '2026-10-22';

export type JapanSource = {
  id: string;
  label: string;
  url: string;
  scope: string;
};

export const japanSources: JapanSource[] = [
  { id: 'visa', label: '日本国家旅游局：签证与免签说明', url: 'https://www.japan.travel/en/plan/visa-info/', scope: '护照、签证和材料的总入口' },
  { id: 'consulate', label: '日本驻华大使馆：签证', url: 'https://www.cn.emb-japan.go.jp/itpr_zh/visa.html', scope: '具体领区、申请路径和现行材料' },
  { id: 'visit-japan', label: '日本数字厅：Visit Japan Web', url: 'https://www.digital.go.jp/en/policies/visit_japan_web', scope: '入境审查和海关申报线上填写' },
  { id: 'customs', label: '日本海关：旅客携带物品', url: 'https://www.customs.go.jp/english/summary/passenger.htm', scope: '申报、禁止和限制携带物品' },
  { id: 'jnto-plan', label: '日本国家旅游局：行前规划', url: 'https://www.japan-travel.cn/plan/', scope: '中文旅行基础信息' },
  { id: 'airport-access', label: '日本国家旅游局：机场交通', url: 'https://www.japan.travel/en/plan/airport-access/', scope: '主要机场进城方式' },
  { id: 'narita', label: '成田国际机场：交通', url: 'https://www.narita-airport.jp/en/access/', scope: 'NRT 航站楼和机场交通' },
  { id: 'haneda', label: '羽田机场：交通', url: 'https://tokyo-haneda.com/en/access/index.html', scope: 'HND 航站楼和机场交通' },
  { id: 'transport', label: '日本国家旅游局：日本交通', url: 'https://www.japan.travel/en/plan/getting-around/', scope: '铁路、地铁、巴士和交通卡' },
  { id: 'jr-pass', label: 'JAPAN RAIL PASS：官方价格', url: 'https://japanrailpass.net/en/purchase/price/', scope: '全国 JR Pass 价格和购买方式' },
  { id: 'smart-ex', label: 'SmartEX：东海道/山阳/九州新干线预约', url: 'https://smart-ex.jp/en/', scope: '适用路线、车次与现价' },
  { id: 'currency', label: '日本国家旅游局：现金与换汇', url: 'https://www.japan.travel/en/plan/currency/', scope: '现金、ATM 与支付' },
  { id: 'seven-bank', label: 'Seven Bank：海外银行卡取现', url: 'https://www.sevenbank.co.jp/intlcard/index2.html', scope: '卡组织、手续费和限额' },
  { id: 'tourist-tax', label: '日本国家旅游局：国际观光旅客税', url: 'https://www.japan.travel/en/plan/international-tourist-tax/', scope: '出境税及其变动' },
  { id: 'tokyo', label: '日本国家旅游局：东京', url: 'https://www.japan.travel/en/destinations/kanto/tokyo/', scope: '东京街区和旅行信息' },
  { id: 'kyoto', label: '日本国家旅游局：京都', url: 'https://www.japan.travel/en/destinations/kansai/kyoto/', scope: '京都景点和旅行信息' },
  { id: 'osaka', label: 'Osaka Info：大阪官方旅游', url: 'https://osaka-info.jp/en/', scope: '大阪景点和活动' },
  { id: 'nara', label: 'Visit Nara：奈良官方旅游', url: 'https://www.visitnara.jp/', scope: '奈良景点与鹿相关提示' },
  { id: 'hiroshima', label: 'Dive! Hiroshima：广岛官方旅游', url: 'https://dive-hiroshima.com/en/', scope: '广岛与宫岛旅行' },
  { id: 'fushimi', label: '伏见稻荷大社：官方信息', url: 'https://inari.jp/en/', scope: '参拜和交通' },
  { id: 'ghibli', label: '三鹰之森吉卜力美术馆：购票', url: 'https://www.ghibli-museum.jp/en/', scope: '预约制门票' },
  { id: 'teamlab', label: 'teamLab：东京展览', url: 'https://www.teamlab.art/e/tokyo/', scope: '展馆位置、日期和票务' },
  { id: 'usj', label: '日本环球影城：官方票务', url: 'https://www.usj.co.jp/web/en/us', scope: '日期票价、入场和快速通关' },
  { id: 'emergency', label: '日本国家旅游局：紧急情况', url: 'https://www.japan.travel/en/plan/emergencies/', scope: '灾害、失物、警察和医疗' },
  { id: 'hotline', label: '日本国家旅游局：游客热线', url: 'https://www.japan.travel/en/plan/hotline/', scope: '多语言 24 小时游客支持' },
  { id: 'consular', label: '中国领事服务网', url: 'https://cs.mfa.gov.cn/', scope: '中国公民海外领保和出行提醒' },
];

export const bookingTimeline = [
  { when: '出发前 8–12 周', tasks: ['确认护照、适用签证及受理领区；先看官方要求，再找该领区认可的申请渠道。', '定出入境机场和城市顺序；尽量东京进、大阪出，避免无意义折返。', '比较可退改机票与住宿；樱花、红叶、黄金周等旺季更早下手。'] },
  { when: '出发前 4–8 周', tasks: ['按领区要求递交签证；获签前优先保留可退改订单。', '抢预约制景点和演出；分别核对门票开售日、实名规则及儿童票。', '预订东京—京都/大阪等跨城车票；比较单买与通票。'] },
  { when: '出发前 1–2 周', tasks: ['订机场进城方案、eSIM/漫游和保险；确认手机能收到验证码。', '检查酒店入住时间、末班交通、行李规则及是否收住宿税。', '核对药物和食品携带限制，保存处方/英文药名。'] },
  { when: '出发前 72 小时至当天', tasks: ['核对航班航站楼、护照签证有效性、首晚酒店地址和返程/续程凭证。', '通过 Visit Japan Web 预填可用信息，或准备现场办理；保存二维码截图。', '下载离线地图、车票/酒店凭证，开启国际漫游备用通道。'] },
];

export type JapanDay = {
  day: number;
  sleep: string;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
  transit: string;
  booking?: string;
};

export const japanTenDayRoute: JapanDay[] = [
  { day: 1, sleep: '东京', title: '抵达东京，先安顿', morning: '按航班抵达 HND 或 NRT；过入境审查、取行李、完成海关申报。', afternoon: '根据酒店地址选铁路/巴士，先到酒店寄存行李。入住站建议上野、东京站、品川或新宿，选能少换乘的。', evening: '便利店补水、取少量日元，步行熟悉酒店附近车站；晚到不排景点。', transit: 'NRT 看 Skyliner / N’EX / 机场巴士；HND 看京急 / 东京单轨 / 巴士。按终点站决定，不只看进城速度。' },
  { day: 2, sleep: '东京', title: '浅草、上野与晴空塔', morning: '浅草寺—仲见世—隅田川步行；神社寺院遵守参拜动线，不边走边吃。', afternoon: '上野公园与东京国立博物馆二选一；博物馆很大，留 2–3 小时。', evening: '天气好再去晴空塔或河岸夜景；按预订时段到场。', transit: '浅草—上野可乘银座线；浅草—晴空塔可步行或乘东武线，具体站台用当天地图核验。' },
  { day: 3, sleep: '东京', title: '明治神宫、涩谷与新宿', morning: '明治神宫与代代木公园；把原宿/表参道放在同一片区。', afternoon: '步行转涩谷；想上观景台就在上午或傍晚预约固定时段。', evening: '新宿晚餐与夜景；回酒店前确认最后一班车和车站出口。', transit: '山手线连接原宿、涩谷、新宿；避免在同一天再横穿到东京东部。' },
  { day: 4, sleep: '东京', title: '留给兴趣的一天', morning: '二选一：镰仓寺社与海岸，或东京市内美术馆/主题乐园。箱根需要更早出发且全天投入。', afternoon: '遇雨改为室内馆、书店与百货；不把富士山可见度当成必然。', evening: '整理行李，只留跨城当天所需物品；核对新干线车站、站台和行李尺寸。', transit: '跨县一日游选一处即可；从东京的出发站可能不同，先在官方路线工具确认。', booking: '主题乐园、teamLab、吉卜力美术馆等需查日期及预约规则。' },
  { day: 5, sleep: '京都', title: '东京到京都，下午进城', morning: '从东京/品川站乘东海道新干线去京都；预留车站找月台和买餐时间。', afternoon: '入住或寄存行李；先走锦市场、鸭川、祇园周边，不在刚到的半天塞满寺院。', evening: '在花见小路等居住街区保持安静，不拍摄禁止摄影区域和未经同意的人。', transit: '东京—京都乘新干线约 2–3 小时，具体班次、票价、停车站以 SmartEX/JR 查询为准。', booking: '旺季或大件行李提前确认车次及特大行李预约规则。' },
  { day: 6, sleep: '京都', title: '东山步行日', morning: '早点到清水寺周边；沿二年坂、三年坂往祇园方向走。', afternoon: '八坂神社—圆山公园—哲学之道按体力择其一，不把分散景点都塞入一天。', evening: '鸭川附近晚餐；留出回酒店的步行时间。', transit: '东山多坡道与石板路，公交易堵；适合步行加短程地铁/出租车，鞋子要防滑。' },
  { day: 7, sleep: '京都', title: '伏见稻荷或岚山', morning: '伏见稻荷从千本鸟居往上走，走到适合体力的位置折返；若更偏自然景观可整天给岚山。', afternoon: '伏见路线可接京都站周边；岚山路线专心竹林、渡月桥与一处寺院。', evening: '准备隔天奈良转场；大件行李留酒店或寄送大阪酒店。', transit: '京都站到稻荷站搭 JR 奈良线；岚山有 JR/阪急/岚电不同站，按具体景点选。', booking: '热门寺院特别参观、季节限定活动逐项核对开放日。' },
  { day: 8, sleep: '大阪', title: '奈良半日，再到大阪', morning: '从京都往奈良；东大寺—奈良公园一带步行，给鹿饼只在允许区域，别逗弄或强行靠近鹿。', afternoon: '取行李转大阪；入住难波适合吃逛，梅田适合 JR/机场换乘。', evening: '道顿堀、法善寺横丁一带散步与晚餐。', transit: 'JR 奈良站与近铁奈良站位置不同；近铁站步行到奈良公园更近。带箱子先找正规寄存点。' },
  { day: 9, sleep: '大阪', title: '大阪城与城市夜景', morning: '大阪城公园；想进天守阁再查当天展览和门票。', afternoon: '中之岛/梅田或黑门市场/难波二选一；USJ 要单独留完整一天，不与大阪城同排。', evening: '道顿堀再吃一餐或去梅田看夜景；控制返程购物重量。', transit: '大阪市内地铁/JR/私铁分属不同体系；交通卡多用于普通乘车，但不能代替所有特急指定席。', booking: 'USJ 先核日期门票，再决定是否需要快速通关。' },
  { day: 10, sleep: '返程', title: '从关西机场返程', morning: '核对 KIX 航站楼和航空公司柜台；国际航班留足值机、安检和出境时间。', afternoon: '从难波可考虑南海，从大阪/天王寺/京都方向看 JR 或机场巴士；按酒店起点比较。', evening: '检查购物免税物品及托运规定，保留必要单据；返程入境遵守中国海关要求。', transit: '早班机尽量前夜住在直达机场的车站或机场附近；机场快线/巴士班次以当天运营商为准。' },
];

export const japanAreaNotes = [
  { city: '东京', stay: '3–5 晚', base: '上野/浅草偏传统和成田方向；东京站/品川方便新干线；新宿/涩谷适合夜间活动但站大、人多。', highlights: '浅草寺、上野博物馆、明治神宫、涩谷、新宿、台场/丰洲按兴趣拆日；迪士尼、USJ 类主题乐园一日只安排一个。', trap: '东京站、新宿站、涩谷站出口多；给首次换乘留 15–20 分钟机动。' },
  { city: '京都', stay: '2–4 晚', base: '京都站方便跨城和行李；四条河原町适合吃逛；祇园有氛围但晚间注意安静。', highlights: '东山、伏见稻荷、岚山分片区；不建议同日把清水寺、伏见、岚山和金阁寺全部串完。', trap: '京都公交在旺季拥挤；短距离多走路，远距离先看地铁和铁路。' },
  { city: '大阪', stay: '2–3 晚', base: '难波适合关西机场与道顿堀；梅田/大阪站方便 JR；USJ 周边只适合把乐园作为主目的。', highlights: '大阪城、中之岛、黑门/难波、美食街；USJ 独占一天；环球影城票种和入场规则随日期变化。', trap: '“大阪站”“梅田站”相邻但属于不同线路，跟着准确运营商和站名走。' },
  { city: '奈良', stay: '半日–1 晚', base: '多数首次旅行可由京都或大阪当天往返，不必频繁换酒店。', highlights: '东大寺、奈良公园、春日大社按步行体力选择。', trap: '鹿是野生动物，别让孩子单独喂食，也别携带明显食物追逐。' },
  { city: '箱根/富士山周边', stay: '1–2 晚', base: '从东京往返可行，但温泉和山景更适合住一晚。', highlights: '箱根适合温泉、湖景和美术馆；富士山观景取决于天气，登山季与装备另行核对。', trap: '山区交通受天气影响；不要把富士山天气或缆车开放写死在行程。' },
  { city: '广岛/宫岛', stay: '1–2 晚', base: '适合 12–14 天以上行程加入；从大阪/京都继续西行更顺路。', highlights: '和平纪念公园与资料馆留出认真参观时间；宫岛看潮汐与渡轮。', trap: '广岛市区到宫岛仍需铁路/渡轮衔接，不要当成街区内步行点。' },
];

export const japanPackingChecklist = [
  '护照、签证/电子签证展示方式和保险单；纸质与离线电子备份分开放。',
  '往返/续程机票、前两晚住宿地址、跨城车票和预约制景点确认邮件。',
  '可用于海外的银行卡与少量日元现金；出发前开通境外支付与取现。',
  'eSIM/实体 SIM/漫游及备用联网方式；离线地图和翻译包。',
  '适合季节的衣物、舒适鞋、雨具、常用处方药和药品说明。',
  '转换插头：日本常见 A/B 型插座、100V；核对设备电压与三脚插头。',
  '托运行李额度、特大行李新干线规则、充电宝随身携带及航空公司限制。',
  '中国领保、保险救援、酒店电话和同行人联系方式。',
];
