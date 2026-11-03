import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { japanTopicHref, japanTopicIndex, type JapanTopicSlug } from '@/lib/japan-topic-index';
import './japan-topic-cards.css';

export function JapanTopicCards({ slugs }: { slugs?: readonly JapanTopicSlug[] }) {
  const topics = slugs ? slugs.map((slug) => japanTopicIndex.find((topic) => topic.slug === slug)!).filter(Boolean) : japanTopicIndex;
  return <div className="jp-topic-cards">{topics.map((topic) => <Link href={japanTopicHref(topic.slug)} className="jp-topic-card" key={topic.slug}>
    <span>{topic.category}</span><h3>{topic.shortTitle}</h3><p>{topic.description}</p><strong>查看实用攻略 <ArrowUpRight size={16} aria-hidden="true" /></strong>
  </Link>)}</div>;
}
