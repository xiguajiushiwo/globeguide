import { placeSummarySchema, type PlaceSummary } from './place.js';
import { worldCapitals } from './world-capitals.js';

export type Destination = {
  place: PlaceSummary;
  nameZh: string;
  region: string;
  regionCode: string;
  regionGroup: 'mainland' | 'hong-kong' | 'macau' | 'taiwan' | 'rest-of-world';
  aliases: string[];
  summary: string;
  guideId?: string;
  image?: string;
  isCapital?: boolean;
  capitalOf?: string;
};

type ChinaSeed = {
  code: string;
  name: string;
  nameZh: string;
  region: string;
  regionCode: string;
  latitude: number;
  longitude: number;
  summary: string;
  aliases?: string[];
};

const updatedAt = '2026-10-20T00:00:00.000Z';

// City-center points are from the GeoNames cities15000 gazetteer (CC BY 4.0).
const mainlandCenters: ChinaSeed[] = [
  { code: '11', name: 'Beijing', nameZh: '北京', region: 'Beijing Municipality', regionCode: 'CN-BJ', latitude: 39.9075, longitude: 116.39723, summary: 'Explore historic neighborhoods, major museums, and the cultural heart of northern China.', aliases: ['Peking', 'China', '中国'] },
  { code: '12', name: 'Tianjin', nameZh: '天津', region: 'Tianjin Municipality', regionCode: 'CN-TJ', latitude: 39.14222, longitude: 117.17667, summary: 'A northern port city with riverfront streets and layers of architectural history.' },
  { code: '13', name: 'Shijiazhuang', nameZh: '石家庄', region: 'Hebei', regionCode: 'CN-HE', latitude: 38.04139, longitude: 114.47861, summary: 'A practical starting point for exploring Hebei and the landscapes around its capital.' },
  { code: '14', name: 'Taiyuan', nameZh: '太原', region: 'Shanxi', regionCode: 'CN-SX', latitude: 37.86944, longitude: 112.56028, summary: 'Begin a Shanxi journey with the city’s museums, old streets, and regional food.' },
  { code: '15', name: 'Hohhot', nameZh: '呼和浩特', region: 'Inner Mongolia', regionCode: 'CN-NM', latitude: 40.81056, longitude: 111.65222, summary: 'A gateway to Inner Mongolia’s urban culture and wider grassland journeys.', aliases: ['Huhhot', 'Huhehaote'] },
  { code: '21', name: 'Shenyang', nameZh: '沈阳', region: 'Liaoning', regionCode: 'CN-LN', latitude: 41.79222, longitude: 123.43278, summary: 'Discover a northeastern city with imperial history and a lively contemporary center.' },
  { code: '22', name: 'Changchun', nameZh: '长春', region: 'Jilin', regionCode: 'CN-JL', latitude: 43.88, longitude: 125.32278, summary: 'Use Jilin’s capital as a base for museums, parks, and Northeast China travel.' },
  { code: '23', name: 'Harbin', nameZh: '哈尔滨', region: 'Heilongjiang', regionCode: 'CN-HL', latitude: 45.75, longitude: 126.65, summary: 'A northern city known for winter culture, historic streets, and riverfront walks.' },
  { code: '31', name: 'Shanghai', nameZh: '上海', region: 'Shanghai Municipality', regionCode: 'CN-SH', latitude: 31.22222, longitude: 121.45806, summary: 'Explore neighborhoods, waterfronts, galleries, and a constantly changing food scene.' },
  { code: '32', name: 'Nanjing', nameZh: '南京', region: 'Jiangsu', regionCode: 'CN-JS', latitude: 32.06167, longitude: 118.77778, summary: 'A historic capital with city walls, lakeside spaces, and important museums.' },
  { code: '33', name: 'Hangzhou', nameZh: '杭州', region: 'Zhejiang', regionCode: 'CN-ZJ', latitude: 30.29365, longitude: 120.16142, summary: 'Plan time around West Lake, tea culture, and Zhejiang’s creative capital.' },
  { code: '34', name: 'Hefei', nameZh: '合肥', region: 'Anhui', regionCode: 'CN-AH', latitude: 31.86389, longitude: 117.28083, summary: 'An Anhui base for lakeside walks, local food, and trips across the province.' },
  { code: '35', name: 'Fuzhou', nameZh: '福州', region: 'Fujian', regionCode: 'CN-FJ', latitude: 26.06139, longitude: 119.30611, summary: 'Explore historic lanes, coastal flavors, and the capital of Fujian.' },
  { code: '36', name: 'Nanchang', nameZh: '南昌', region: 'Jiangxi', regionCode: 'CN-JX', latitude: 28.68396, longitude: 115.85306, summary: 'A riverside starting point for Jiangxi’s culture, cuisine, and regional journeys.' },
  { code: '37', name: 'Jinan', nameZh: '济南', region: 'Shandong', regionCode: 'CN-SD', latitude: 36.66833, longitude: 116.99722, summary: 'Discover Shandong’s spring-filled capital and its walkable historic center.' },
  { code: '41', name: 'Zhengzhou', nameZh: '郑州', region: 'Henan', regionCode: 'CN-HA', latitude: 34.75778, longitude: 113.64861, summary: 'A central Henan hub for museums and onward journeys through the region.' },
  { code: '42', name: 'Wuhan', nameZh: '武汉', region: 'Hubei', regionCode: 'CN-HB', latitude: 30.58333, longitude: 114.26667, summary: 'Three historic town areas meet across the rivers in Hubei’s capital.' },
  { code: '43', name: 'Changsha', nameZh: '长沙', region: 'Hunan', regionCode: 'CN-HN', latitude: 28.19874, longitude: 112.97087, summary: 'Find Hunan flavors, riverside activity, and the city’s energetic cultural scene.' },
  { code: '44', name: 'Guangzhou', nameZh: '广州', region: 'Guangdong', regionCode: 'CN-GD', latitude: 23.11667, longitude: 113.25, summary: 'A Pearl River city with Cantonese food traditions and varied neighborhoods.', aliases: ['Canton'] },
  { code: '45', name: 'Nanning', nameZh: '南宁', region: 'Guangxi', regionCode: 'CN-GX', latitude: 22.81667, longitude: 108.31667, summary: 'A green southern capital and gateway to Guangxi’s wider landscapes.' },
  { code: '46', name: 'Haikou', nameZh: '海口', region: 'Hainan', regionCode: 'CN-HI', latitude: 20.03421, longitude: 110.34651, summary: 'Start a Hainan trip with coastal streets, tropical markets, and island food.' },
  { code: '50', name: 'Chongqing', nameZh: '重庆', region: 'Chongqing Municipality', regionCode: 'CN-CQ', latitude: 29.56026, longitude: 106.55771, summary: 'A hill city of river crossings, steep streets, and distinctive local cuisine.' },
  { code: '51', name: 'Chengdu', nameZh: '成都', region: 'Sichuan', regionCode: 'CN-SC', latitude: 30.66667, longitude: 104.06667, summary: 'Explore teahouse culture, Sichuan food, and the city’s relaxed public spaces.' },
  { code: '52', name: 'Guiyang', nameZh: '贵阳', region: 'Guizhou', regionCode: 'CN-GZ', latitude: 26.58333, longitude: 106.71667, summary: 'A base for Guizhou’s food, mountain scenery, and diverse regional culture.' },
  { code: '53', name: 'Kunming', nameZh: '昆明', region: 'Yunnan', regionCode: 'CN-YN', latitude: 25.03889, longitude: 102.71833, summary: 'Begin exploring Yunnan from a city of markets, gardens, and mild weather.' },
  { code: '54', name: 'Lhasa', nameZh: '拉萨', region: 'Tibet', regionCode: 'CN-XZ', latitude: 29.65, longitude: 91.1, summary: 'Explore Tibetan cultural landmarks while planning carefully for the high altitude.' },
  { code: '61', name: "Xi'an", nameZh: '西安', region: 'Shaanxi', regionCode: 'CN-SN', latitude: 34.25833, longitude: 108.92861, summary: 'A historic capital whose walls, museums, and food streets reward several days.', aliases: ['Xian'] },
  { code: '62', name: 'Lanzhou', nameZh: '兰州', region: 'Gansu', regionCode: 'CN-GS', latitude: 36.05701, longitude: 103.83987, summary: 'Follow the Yellow River through Gansu’s capital and explore its regional cuisine.' },
  { code: '63', name: 'Xining', nameZh: '西宁', region: 'Qinghai', regionCode: 'CN-QH', latitude: 36.62554, longitude: 101.75739, summary: 'A gateway to Qinghai’s highland landscapes, with a distinct city food culture.' },
  { code: '64', name: 'Yinchuan', nameZh: '银川', region: 'Ningxia', regionCode: 'CN-NX', latitude: 38.46806, longitude: 106.27306, summary: 'Explore Ningxia’s capital, its food traditions, and nearby desert landscapes.' },
  { code: '65', name: 'Urumqi', nameZh: '乌鲁木齐', region: 'Xinjiang', regionCode: 'CN-XJ', latitude: 43.80096, longitude: 87.60046, summary: 'A Xinjiang starting point for museums, bazaars, and journeys across the region.', aliases: ['Ürümqi', 'Wulumuqi'] },
];

function mainlandDestination(seed: ChinaSeed): Destination {
  return {
    place: placeSummarySchema.parse({
      id: `10000000-0000-4000-8000-0000000000${seed.code}`,
      name: seed.name,
      countryCode: 'CN',
      latitude: seed.latitude,
      longitude: seed.longitude,
      locale: 'en',
      timeZone: 'Asia/Shanghai',
      currency: 'CNY',
      updatedAt,
      sourceLabel: 'GeoNames cities15000 gazetteer (CC BY 4.0)',
    }),
    nameZh: seed.nameZh,
    region: seed.region,
    regionCode: seed.regionCode,
    regionGroup: 'mainland',
    aliases: seed.aliases ?? [],
    summary: seed.summary,
    ...(seed.code === '11' ? { isCapital: true, capitalOf: 'China' } : {}),
  };
}

const worldDestinations: Destination[] = [
  {
    place: placeSummarySchema.parse({ id: '11111111-1111-4111-8111-111111111111', name: 'Tokyo', countryCode: 'JP', latitude: 35.6762, longitude: 139.6503, locale: 'en', timeZone: 'Asia/Tokyo', currency: 'JPY', updatedAt, sourceLabel: 'GlobeGuide editorial guide' }),
    nameZh: '东京', region: 'Tokyo', regionCode: 'JP-13', regionGroup: 'rest-of-world', aliases: ['Tokio', '東京', 'Japan', '日本'],
    summary: 'Explore a city of distinct neighborhoods, temples, gardens, and contemporary streets.', guideId: '11111111-1111-4111-8111-111111111111', image: '/images/tokyo.jpg', isCapital: true, capitalOf: 'Japan',
  },
  {
    place: placeSummarySchema.parse({ id: '22222222-2222-4222-8222-222222222222', name: 'Paris', countryCode: 'FR', latitude: 48.8566, longitude: 2.3522, locale: 'en', timeZone: 'Europe/Paris', currency: 'EUR', updatedAt, sourceLabel: 'GlobeGuide editorial guide' }),
    nameZh: '巴黎', region: 'Île-de-France', regionCode: 'FR-IDF', regionGroup: 'rest-of-world', aliases: ['París', 'France', '法国'],
    summary: 'Pair a major museum or monument with an unhurried neighborhood walk.', guideId: '22222222-2222-4222-8222-222222222222', image: '/images/paris.jpg', isCapital: true, capitalOf: 'France',
  },
  {
    place: placeSummarySchema.parse({ id: '33333333-3333-4333-8333-333333333333', name: 'New York', countryCode: 'US', latitude: 40.7128, longitude: -74.006, locale: 'en', timeZone: 'America/New_York', currency: 'USD', updatedAt, sourceLabel: 'GlobeGuide editorial guide' }),
    nameZh: '纽约', region: 'New York State', regionCode: 'US-NY', regionGroup: 'rest-of-world', aliases: ['NYC', 'New York City', 'United States', '美国'],
    summary: 'Discover the city one neighborhood, park, and waterfront at a time.', guideId: '33333333-3333-4333-8333-333333333333', image: '/images/new-york.jpg',
  },
];

const otherChinaDestinations: Destination[] = [
  { code: '81', name: 'Hong Kong', nameZh: '香港', region: 'Hong Kong SAR', regionCode: 'CN-HK', regionGroup: 'hong-kong' as const, countryCode: 'HK', latitude: 22.27832, longitude: 114.17469, timeZone: 'Asia/Hong_Kong', currency: 'HKD', summary: 'Explore compact neighborhoods, hills, markets, and the harbor.', aliases: ['Hongkong'] },
  { code: '82', name: 'Macau', nameZh: '澳门', region: 'Macau SAR', regionCode: 'CN-MO', regionGroup: 'macau' as const, countryCode: 'MO', latitude: 22.20056, longitude: 113.54611, timeZone: 'Asia/Macau', currency: 'MOP', summary: 'Walk between historic streets, waterfront spaces, and local food traditions.', aliases: ['Macao'] },
  { code: '71', name: 'Taipei', nameZh: '台北', region: 'Taiwan', regionCode: 'TW-TPE', regionGroup: 'taiwan' as const, countryCode: 'TW', latitude: 25.05306, longitude: 121.52639, timeZone: 'Asia/Taipei', currency: 'TWD', summary: 'Explore night markets, museums, mountain views, and neighborhood cafes.', aliases: ['臺北', 'Taiwan', '台湾'] },
].map(({ code, name, nameZh, region, regionCode, regionGroup, countryCode, latitude, longitude, timeZone, currency, summary, aliases }) => ({
  place: placeSummarySchema.parse({ id: `10000000-0000-4000-8000-0000000000${code}`, name, countryCode, latitude, longitude, locale: 'en', timeZone, currency, updatedAt, sourceLabel: 'GeoNames cities15000 gazetteer (CC BY 4.0)' }),
  nameZh, region, regionCode, regionGroup, aliases, summary,
  ...(code === '71' ? { isCapital: true, capitalOf: 'Taiwan' } : {}),
}));

export const destinationCatalog: Destination[] = [
  ...worldDestinations,
  ...mainlandCenters.map(mainlandDestination),
  ...otherChinaDestinations,
  ...worldCapitals.filter((destination) => !['CN', 'FR', 'JP'].includes(destination.place.countryCode)),
];

const byId = new Map<string, Destination>(destinationCatalog.map((destination) => [destination.place.id, destination]));

export function getDestination(id: string): Destination | undefined {
  return byId.get(id);
}

export function isDestinationId(value: string): boolean {
  return byId.has(value);
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
}

export function searchDestinations(query: string): Destination[] {
  const needle = normalize(query);
  if (!needle) return destinationCatalog;
  return destinationCatalog.filter((destination) => [
    destination.place.name,
    destination.nameZh,
    destination.region,
    destination.regionCode,
    ...destination.aliases,
  ].some((term) => normalize(term).includes(needle)));
}
