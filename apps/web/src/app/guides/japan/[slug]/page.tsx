import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, ExternalLink } from 'lucide-react';
import { JapanTopicCards } from '@/components/japan-topic-cards';
import { getJapanTopic, japanTopics, japanTopicSources } from '@/lib/japan-topics';
import { japanTopicHref, japanTopicsUpdatedAt } from '@/lib/japan-topic-index';
import { japanTripDestinationId } from '@/lib/japan-trip';
import '../japan-topics.css';

export const dynamicParams = false;
export function generateStaticParams() { return japanTopics.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const topic = getJapanTopic((await params).slug);
  if (!topic) return {};
  return { title: topic.title, description: topic.description, alternates: { canonical: japanTopicHref(topic.slug) }, openGraph: { title: topic.title, description: topic.description, images: ['/images/tokyo.jpg'], type: 'article', modifiedTime: japanTopicsUpdatedAt } };
}

export default async function JapanTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const topic = getJapanTopic((await params).slug);
  if (!topic) notFound();
  const sources = [...new Set(topic.sections.flatMap((section) => section.sourceIds ?? []))];
  const schema = {
    '@context': 'https://schema.org', '@type': 'Article', headline: topic.title,
    description: topic.description, inLanguage: 'zh-CN', datePublished: japanTopicsUpdatedAt, dateModified: japanTopicsUpdatedAt,
    author: { '@type': 'Organization', name: 'Wayella' },
    mainEntityOfPage: `https://wayella.com${japanTopicHref(topic.slug)}`,
  };
  return <article className="jp-practical" lang="zh-CN">
    <header className="jp-practical-hero"><div className="shell">
      <Link className="jp-back" href="/guides/japan/#practical"><ArrowLeft size={16} />日本自由行专题</Link>
      <p className="jp-eyebrow">WAYELLA / {topic.category}</p><h1>{topic.title}</h1><p className="jp-deck">{topic.description}</p>
      <div className="jp-meta"><span>Wayella 编辑指南</span><span>更新于 {japanTopicsUpdatedAt}</span></div>
    </div></header>
    <div className="shell jp-practical-layout">
      <nav className="jp-practical-toc" aria-label="专题目录"><strong>这篇解决什么</strong>{topic.sections.map((section, index) => <a key={section.id} href={`#${section.id}`}><small>{String(index + 1).padStart(2, '0')}</small>{section.title}</a>)}<a href="#checklist">出发前核对清单</a><a href="#sources">官方核对入口</a></nav>
      <div className="jp-practical-body">
        <section className="jp-answer" aria-labelledby="quick-answer"><p className="jp-eyebrow">先看结论</p><h2 id="quick-answer">{topic.shortTitle}</h2><p>{topic.answer}</p><ul>{topic.takeaways.map((item) => <li key={item}><Check size={16} aria-hidden="true" />{item}</li>)}</ul></section>
        <p className="jp-audience"><strong>适合谁：</strong>{topic.audience}</p>
        {topic.sections.map((section, index) => <section key={section.id} className="jp-practical-section" aria-labelledby={section.id}>
          <p className="jp-eyebrow">{String(index + 1).padStart(2, '0')} / {topic.category}</p><h2 id={section.id}>{section.title}</h2>
          {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.table && <div className="jp-table-wrap"><table><caption>{section.title}</caption><thead><tr>{section.table.columns.map((column) => <th scope="col" key={column}>{column}</th>)}</tr></thead><tbody>{section.table.rows.map((row) => <tr key={row[0]}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th scope="row" key={cellIndex}>{cell}</th> : <td key={cellIndex} data-label={section.table!.columns[cellIndex]}>{cell}</td>)}</tr>)}</tbody></table></div>}
          {section.items && <ol className="jp-action-list">{section.items.map((item) => <li key={item}>{item}</li>)}</ol>}
          {section.sourceIds && <div className="jp-inline-sources"><span>官方入口</span>{section.sourceIds.map((id) => <a href={japanTopicSources[id]!.url} key={id} target="_blank" rel="noopener noreferrer">{japanTopicSources[id]!.label}<ArrowUpRight size={13} aria-hidden="true" /></a>)}</div>}
        </section>)}
        <section className="jp-checklist" aria-labelledby="checklist"><p className="jp-eyebrow">BEFORE YOU GO</p><h2 id="checklist">出发前，逐项确认</h2><ul>{topic.checklist.map((item) => <li key={item}><Check size={18} aria-hidden="true" />{item}</li>)}</ul><p>按自己的航班、日期和同行人核对，保留订单与官方查询结果。</p></section>
        <aside className="jp-plan-action"><CalendarDays size={25} aria-hidden="true" /><div><h2>把准备好的信息放进行程</h2><p>选择天数后，路线会预填到规划器；再按航班、预约和体力调整并保存。</p><div>{['7-day', '10-day', '14-day'].map((route) => <Link key={route} href={`/trips/?destination=${japanTripDestinationId}&route=${route}`}>{route.split('-')[0]} 天路线 <ArrowUpRight size={15} /></Link>)}</div></div></aside>
        <section className="jp-practical-section" aria-labelledby="sources"><p className="jp-eyebrow">SOURCES & UPDATES</p><h2 id="sources">官方核对入口与查阅记录</h2><p>住宿选区、行程节奏与备选方案为 Wayella 编辑建议。注明查阅日期的来源已用于本次核对；未注明日期的入口供出行前继续确认。票价、时刻、余票与开放状态以实际出行日期的官方查询为准。</p><ul className="jp-source-list">{sources.map((id) => {
          const source = japanTopicSources[id]!;
          return <li key={id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<ExternalLink size={14} /></a><p>{source.scope}</p><small>{source.checkedAt ? `本次查阅：${source.checkedAt}` : '出行前复核'}</small></li>;
        })}</ul></section>
        <section aria-labelledby="related"><h2 id="related">接下来，解决下一个问题</h2><JapanTopicCards slugs={topic.related} /><Link className="jp-back" href="/guides/japan/">返回日本总攻略 <ArrowUpRight size={16} /></Link></section>
      </div>
    </div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
  </article>;
}
