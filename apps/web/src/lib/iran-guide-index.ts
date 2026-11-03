export const iranGuideUpdatedAt = '2026-10-29';
export const iranDestinationId = '20000000-0000-4000-8000-00000000004d';

export const iranGuideIndex = [
  { slug: 'overview', href: '/guides/iran/', category: '伊朗 · 国家攻略', title: '伊朗旅行指南：波斯文化、城市看点与出发前判断', shortTitle: '认识伊朗，从文化到现实准备', description: '认识德黑兰、卡尚、伊斯法罕、亚兹德与设拉子，结合官方安全提醒理解入境、交通和旅行准备。', tags: ['伊朗', '伊朗攻略', 'Iran', 'Persia', '波斯', '德黑兰', 'Tehran', '签证', '安全', '旅行'] },
  { slug: 'entry-and-arrival', href: '/guides/iran/entry-and-arrival/', category: '伊朗 · 入境与交通', title: '伊朗入境与抵达：证件、航班、接机和酒店怎么核对', shortTitle: '证件、航班与第一晚', description: '面向中国大陆普通护照旅客，把安全提醒、入境资格、转机条件、机场和住宿放在同一张核对清单。', tags: ['伊朗', 'Iran', '德黑兰', 'Tehran', '签证', '免签', '入境', '机场', 'IKA', 'THR', '航班', '酒店', '安全'] },
  { slug: 'money-and-etiquette', href: '/guides/iran/money-and-etiquette/', category: '伊朗 · 在地准备', title: '伊朗现金、联网与礼仪：里亚尔、托曼、手机和拍摄须知', shortTitle: '钱、网络和当地生活', description: '境外银行卡、报价单位、换汇防骗、离线准备、穿着与拍摄规则，以及常见波斯菜的点餐提示。', tags: ['伊朗', 'Iran', '现金', '货币', '汇率', '里亚尔', '托曼', 'rial', 'toman', '银行卡', '网络', 'SIM', '头巾', '女性', '拍照', '美食', '预算'] },
  { slug: 'culture-and-routes', href: '/guides/iran/culture-and-routes/', category: '伊朗 · 城市与文化', title: '伊朗五城看什么：波斯建筑与 7／10／14 天未来路线参考', shortTitle: '五座城市，读懂波斯文化', description: '从宫殿、花园到沙漠古城，拆解城市看点与停留节奏。路线仅供未来条件允许时研究，当前建议暂缓旅游。', tags: ['伊朗', 'Iran', '波斯', '德黑兰', 'Tehran', '卡尚', 'Kashan', '伊斯法罕', 'Isfahan', '亚兹德', 'Yazd', '设拉子', 'Shiraz', '波斯波利斯', 'Persepolis', '路线', '7天', '10天', '14天', '历史', '文化', '摄影'] },
] as const;

export type IranGuideSlug = typeof iranGuideIndex[number]['slug'];
