import { iranGuideIndex } from './iran-guide-index';
import { japanTopicHref, japanTopicIndex } from './japan-topic-index';

const articles = [
  ...iranGuideIndex,
  ...japanTopicIndex.map(topic => ({ ...topic, href: japanTopicHref(topic.slug) })),
];

export function searchGuideArticles(query: string) {
  const terms = query.normalize('NFKC').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return articles.filter(article => {
    const text = [article.title, article.description, ...article.tags].join(' ').normalize('NFKC').toLocaleLowerCase();
    return terms.every(term => text.includes(term));
  });
}
