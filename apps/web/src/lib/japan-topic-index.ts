export const japanTopicsUpdatedAt = '2026-10-29';

export const japanTopicIndex = [
  { slug: 'airport-arrival', category: '落地与交通', title: '日本机场进城：成田、羽田、关西怎么选车，晚到怎么办', shortTitle: '机场进城与深夜抵达', description: '从航站楼到酒店门口，按目的地选车；晚班航班的末班判断、备用住宿和首晚安排。', tags: ['日本', '东京', '大阪', '京都', '机场', '深夜', '晚到', '末班车', '成田', '羽田', '关西', 'NRT', 'HND', 'KIX', 'Japan', 'airport'] },
  { slug: 'where-to-stay', category: '住宿选区', title: '第一次去日本住哪里：东京、京都、大阪 8 个住宿区域怎么选', shortTitle: '三座城市，住哪一站', description: '比较上野、品川、新宿、京都站、四条乌丸、难波、梅田与新大阪，按交通、体力和行李选区。', tags: ['日本', '东京', '京都', '大阪', '住宿', '酒店', '住哪里', '选区', '上野', '品川', '新宿', '难波', '梅田', 'Japan', 'hotel'] },
  { slug: 'transport-tickets', category: '车票与行李', title: '日本交通怎么买票：IC 卡、特急、新干线和 JR Pass', shortTitle: '交通票券别买重', description: '先分清车费、特急费与座位，再判断通票；附东京到京都的乘车步骤和大件行李检查。', tags: ['日本', '东京', '京都', '大阪', '交通', '车票', '地铁', 'IC', 'Suica', 'ICOCA', 'PASMO', 'JR Pass', '新干线', '行李', 'Japan', 'train'] },
  { slug: 'reservations', category: '预约与门票', title: '日本热门景点怎么预约：吉卜力、teamLab、迪士尼与 USJ', shortTitle: '热门预约与没票备选', description: '区分场馆、日期、时区和票种，先固定最想去的体验，再安排城市路线；没抢到也有替代方案。', tags: ['日本', '东京', '大阪', '预约', '门票', '吉卜力', '三鹰', 'teamLab', 'Borderless', 'Planets', '迪士尼', 'USJ', '环球影城', 'Japan', 'ticket'] },
  { slug: 'easy-days', category: '同行人与天气', title: '带父母去日本怎么安排：东京、京都、大阪减量玩法与雨天替换', shortTitle: '带父母与雨天怎么玩', description: '一天一个重点，按可步行但不宜久走的旅伴设计三座城市的减量日程，附雨天替换和酒店核对清单。', tags: ['日本', '东京', '京都', '大阪', '父母', '老人', '长者', '亲子', '雨天', '下雨', '轻松', '无障碍', 'Japan', 'rain'] },
] as const;

export type JapanTopicSlug = typeof japanTopicIndex[number]['slug'];
export const japanTopicHref = (slug: string) => `/guides/japan/${slug}/`;
export function searchJapanTopics(query: string) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return japanTopicIndex.filter((topic) => {
    const text = [topic.title, topic.description, ...topic.tags].join(' ').toLocaleLowerCase();
    return terms.every((term) => text.includes(term));
  });
}
