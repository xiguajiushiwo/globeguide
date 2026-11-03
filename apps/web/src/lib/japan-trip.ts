import { japanFieldDays, type JapanStop } from './japan-field-guide';
import { japanTenDayRoute } from './japan-guide';

export const japanTripDestinationId = '11111111-1111-4111-8111-111111111111';

export type JapanRouteTemplateId = '7-day' | '10-day' | '14-day';

export type JapanRouteDay = {
  day: number;
  city: string;
  title: string;
  summary: string;
  stopIds: string[];
};

export type JapanRouteTemplate = {
  id: JapanRouteTemplateId;
  label: string;
  nights: number;
  description: string;
  days: JapanRouteDay[];
};

export type JapanTripStop = Pick<JapanStop, 'id' | 'name' | 'city'>;

const fieldDay = (day: number) => japanFieldDays.find((item) => item.day === day)!;
const fieldStops = (day: number, ids?: string[]): string[] => {
  const available = fieldDay(day).stops.map((stop) => stop.id);
  return ids ? ids.filter((id) => available.includes(id)) : available;
};

const routeDay = (day: number, city: string, title: string, summary: string, stopIds: string[]): JapanRouteDay => ({
  day, city, title, summary, stopIds,
});

// Day 7 has two valid Kyoto branches. The default planner keeps the Fushimi
// branch so a generated trip always has one coherent route; the map still
// exposes Arashiyama as the alternative for travellers who prefer it.
const tenDayStops = (day: number) => day === 7
  ? fieldStops(7, ['fushimi'])
  : fieldStops(day);

export const japanRouteTemplates: JapanRouteTemplate[] = [
  {
    id: '7-day',
    label: '7 天精简',
    nights: 6,
    description: '东京 3 晚、京都 2 晚、大阪 1 晚；删掉远途一日游，把经典片区走透。',
    days: [
      routeDay(1, '东京', '抵达东京，先安顿', '进城、寄存行李、在酒店附近补给。', fieldStops(1)),
      routeDay(2, '东京', '上野、浅草、晴空塔', '东京东部一日，博物馆和展望台按体力取舍。', fieldStops(2)),
      routeDay(3, '东京', '原宿、涩谷、新宿', '从原宿向西走，晚上有余力再去新宿。', fieldStops(3)),
      routeDay(4, '京都', '东京到京都，抵达后轻装散步', '跨城后先放行李，再安排锦市场或鸭川。', fieldStops(5)),
      routeDay(5, '京都', '清水寺、三年坂、八坂', '东山片区慢慢走，给坡道和休息留出时间。', fieldStops(6)),
      routeDay(6, '大阪', '伏见稻荷后，转场大阪', '退房后寄存行李，伏见稻荷按体力折返；取回行李再去大阪入住，不追加奈良。', fieldStops(7, ['fushimi'])),
      routeDay(7, '返程', '从关西机场返程', '按航班和航站楼倒推出发时间；早班机先核对首班交通。', fieldStops(10)),
    ],
  },
  {
    id: '10-day',
    label: '10 天推荐',
    nights: 9,
    description: '东京 4 晚、京都 3 晚、大阪 2 晚；奈良安排在转场日。',
    days: japanTenDayRoute.map((day) => routeDay(
      day.day,
      day.sleep === '东京' ? '东京' : day.sleep === '京都' ? '京都' : day.sleep === '大阪' ? '大阪' : '返程',
      day.title,
      day.transit,
      tenDayStops(day.day),
    )),
  },
  {
    id: '14-day',
    label: '14 天延伸',
    nights: 13,
    description: '东京 4 晚、箱根 1 晚、京都 3 晚、大阪 2 晚、广岛 2 晚，再回大阪住 1 晚从 KIX 返程。',
    days: [
      ...japanTenDayRoute.slice(0, 3).map((day) => routeDay(
        day.day,
        '东京',
        day.title,
        day.transit,
        tenDayStops(day.day),
      )),
      routeDay(4, '东京', '东京兴趣日，准备箱根行李', '市内展馆或主题乐园选一个主项目；晚上确认箱根酒店、到达时间及次日交通。', fieldStops(4)),
      routeDay(5, '箱根', '东京到箱根，住一晚温泉旅馆', '按酒店位置选择进山交通，先寄存行李；不强求一日走完整个环线，核对晚餐入住时限。', ['hakone-yumoto']),
      routeDay(6, '京都', '箱根经小田原到京都', '先从酒店到小田原，查询停靠小田原的新干线及必要换乘；到京都放好行李再轻装散步。', fieldStops(5)),
      routeDay(7, '京都', '清水寺、三年坂与八坂', '东山片区按体力取舍；雨天减少坡道，不再叠加远处寺院。', fieldStops(6)),
      routeDay(8, '京都', '伏见稻荷，下午留作机动', '鸟居山路走到适合体力的位置折返；若改岚山就整日替换，晚间处理次日行李。', fieldStops(7, ['fushimi'])),
      routeDay(9, '大阪', '京都经奈良到大阪', '先处理行李再逛奈良；疲惫时直接去大阪，奈良可以取消。', fieldStops(8)),
      routeDay(10, '大阪', '大阪城市日或整日 USJ', '默认大阪城与难波；若预约 USJ，则整日替换，不与市区景点硬拼。', fieldStops(9)),
      routeDay(11, '广岛', '大阪到广岛，和平纪念公园', '从新大阪到广岛，入住后参观公园；资料馆另核门票与开放时间，留出认真参观的时间。', ['hiroshima-peace-park']),
      routeDay(12, '广岛', '宫岛一日，回广岛住宿', '核对宫岛口铁路、渡轮和潮汐；岛上按体力取舍，不把弥山登山作为必选。', ['miyajima']),
      routeDay(13, '大阪', '返回大阪，留出返程缓冲', '广岛到新大阪的交通另计预算；下午少排项目，核对次日机场交通并整理行李。', []),
      routeDay(14, '返程', '前往机场', '按实际航班、航站楼和机场交通倒推离开酒店时间。', fieldStops(10)),
    ],
  },
];

const stopMap = new Map<string, JapanTripStop>();
for (const day of japanFieldDays) {
  for (const stop of day.stops) stopMap.set(stop.id, { id: stop.id, name: stop.name, city: stop.city });
}
for (const stop of [
  { id: 'hakone-yumoto', name: '箱根汤本站', city: '箱根' },
  { id: 'hiroshima-peace-park', name: '广岛和平纪念公园', city: '广岛' },
  { id: 'miyajima', name: '宫岛', city: '廿日市' },
]) stopMap.set(stop.id, stop);

export const japanTripStops = [...stopMap.values()];

export function getJapanRouteTemplate(id: string | null | undefined): JapanRouteTemplate | undefined {
  return japanRouteTemplates.find((template) => template.id === id);
}

export function flattenJapanRoute(templateId: JapanRouteTemplateId): string[] {
  const template = getJapanRouteTemplate(templateId);
  if (!template) return [];
  return [...new Set(template.days.flatMap((day) => day.stopIds))];
}
