import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, BookOpen, Check, ExternalLink, MapPin, ShieldAlert } from 'lucide-react';
import { iranGuideIndex, iranGuideUpdatedAt, iranDestinationId } from '@/lib/iran-guide-index';
import { iranCities, iranSources, iranTenDayReference, type IranSourceId, type getIranArticle } from '@/lib/iran-guide';
import '@/app/guides/iran/iran-guide.css';

type Article = NonNullable<ReturnType<typeof getIranArticle>>;
function Sources({ ids }: { ids: readonly IranSourceId[] }) {
  return <div className="iran-inline-sources"><span>参考来源</span>{ids.map(id => <a key={id} href={iranSources[id].url} target="_blank" rel="noopener noreferrer">{iranSources[id].label}<ArrowUpRight size={13} aria-hidden="true" /></a>)}</div>;
}

export function IranGuideCards({ current }: { current?: string }) {
  return <div className="iran-guide-cards">{iranGuideIndex.filter(item => item.slug !== current && item.slug !== 'overview').map(item => <Link href={item.href} key={item.slug} className="iran-guide-card"><span>{item.category}</span><h3>{item.shortTitle}</h3><p>{item.description}</p><strong>阅读专题 <ArrowUpRight size={16} aria-hidden="true" /></strong></Link>)}</div>;
}

export function IranGuideArticle({ article }: { article: Article }) {
  const overview = article.slug === 'overview';
  const culture = article.slug === 'culture-and-routes';
  const sourceIds = [...new Set<IranSourceId>([
    'advisory', 'notices', ...article.sections.flatMap(section => section.sources ?? []),
    ...(overview || culture ? iranCities.flatMap(city => city.sources) : []),
  ])];
  const schema = {
    '@context': 'https://schema.org', '@type': 'Article', headline: article.title,
    description: article.description, inLanguage: 'zh-CN', datePublished: iranGuideUpdatedAt, dateModified: iranGuideUpdatedAt,
    author: { '@type': 'Organization', name: 'Wayella' }, mainEntityOfPage: `https://wayella.com${article.href}`,
  };
  return <article className="iran-guide" lang="zh-CN">
    <header className="iran-hero"><div className="shell iran-hero-inner">
      <Link className="iran-back" href={overview ? '/guides/' : '/guides/iran/'}><ArrowLeft size={16} />{overview ? '全部国家攻略' : '伊朗总攻略'}</Link>
      <p className="iran-eyebrow">WAYELLA / IRAN · 伊朗</p><h1>{overview ? <>认识伊朗<br /><span>从波斯文化，到旅行准备</span></> : article.title}</h1>
      <p className="iran-deck">{article.intro}</p><div className="iran-meta"><span>中文编辑指南</span><span>资料查阅：<time dateTime={iranGuideUpdatedAt}>{iranGuideUpdatedAt}</time></span></div>
      {overview && <div className="iran-hero-facts"><span>5 座城市的文化线索</span><span>3 篇实用专题</span><span>附官方来源与查阅记录</span></div>}
    </div><div className="iran-ornament" aria-hidden="true"><span /><span /><span /></div></header>
    <div className="shell">
      <aside className="iran-advisory" aria-labelledby="iran-advisory-title"><ShieldAlert size={25} aria-hidden="true" /><div><p className="iran-eyebrow">出行状态 · 截至本次查阅</p><h2 id="iran-advisory-title">当前建议暂缓非必要旅游</h2><p>中国驻伊朗使馆于 2026-04-23 再次提醒中国公民暂勿前往伊朗。本页保留文化介绍与未来规划参考；航班、景点开放和通行条件需重新核实。</p><a href={iranSources.advisory.url} target="_blank" rel="noopener noreferrer">阅读提醒原文 <ArrowUpRight size={15} /></a><a href={iranSources.notices.url} target="_blank" rel="noopener noreferrer">查看使馆最新通知 <ArrowUpRight size={15} /></a></div></aside>
      {overview && <section className="iran-topics" aria-labelledby="iran-topics-title"><p className="iran-eyebrow">先找你需要的内容</p><h2 id="iran-topics-title">把准备工作分开看</h2><IranGuideCards /></section>}
      <div className="iran-layout"><nav className="iran-toc" aria-label="伊朗攻略目录"><strong>本篇目录</strong>{(overview || culture) && <a href="#cities">五座城市的文化看点</a>}{article.sections.map(section => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}{culture && <a href="#ten-days">10 天逐日参考</a>}<a href="#checklist">核对清单</a><a href="#sources">来源与查阅日期</a></nav>
        <div className="iran-body">
          {(overview || culture) && <section className="iran-section" aria-labelledby="cities"><p className="iran-eyebrow">CITIES & CULTURE</p><h2 id="cities">五座城市，五种阅读方式</h2><p>下面介绍历史与文化特征，景点当前开放和交通可用性不在这些文化资料的证明范围内。</p><div className="iran-city-list">{iranCities.map((city, index) => <article className="iran-city" key={city.english}><div className="iran-city-number" aria-hidden="true">0{index + 1}</div><div><span className="iran-eyebrow">{city.english}</span><h3>{city.name}<small>{city.focus}</small></h3><p>{city.text}</p><p className="iran-city-note">{city.detail}</p><Sources ids={city.sources} /></div></article>)}</div><Link className="iran-text-link" href={`/destinations/${iranDestinationId}/`}><MapPin size={16} />德黑兰城市资料 <ArrowUpRight size={16} /></Link></section>}
          {article.sections.map((section, index) => <section key={section.id} className="iran-section" aria-labelledby={section.id}><p className="iran-eyebrow">{String(index + 1).padStart(2, '0')} / {article.category}</p><h2 id={section.id}>{section.title}</h2>{section.paragraphs?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            {section.table && <div className="iran-table"><table><caption>{section.title}</caption><thead><tr>{section.table.columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{section.table.rows.map(row => <tr key={row[0]}>{row.map((cell, i) => i === 0 ? <th key={i} scope="row">{cell}</th> : <td key={i} data-label={section.table!.columns[i]}>{cell}</td>)}</tr>)}</tbody></table></div>}
            {section.items && <ol className="iran-steps">{section.items.map(item => <li key={item}>{item}</li>)}</ol>}{section.sources && <Sources ids={section.sources} />}
          </section>)}
          {culture && <section className="iran-section" aria-labelledby="ten-days"><p className="iran-eyebrow">FUTURE REFERENCE / 10 DAYS</p><h2 id="ten-days">10 天逐日参考：从德黑兰到设拉子</h2><p>编辑研究方案，当前建议暂缓旅游。共 9 晚，D10 以已确认设拉子离境航班为前提；它不等于当前运营班次或现场通行许可。</p><ol className="iran-days">{iranTenDayReference.map(day => <li key={day.day}><span>D{String(day.day).padStart(2, '0')}</span><div><small>{day.sleep === '返程' ? '离境 / 视实际航班调整' : `住宿：${day.sleep}`}</small><h3>{day.plan}</h3><p>{day.note}</p></div></li>)}</ol></section>}
          <section className="iran-checklist" aria-labelledby="checklist"><h2 id="checklist">读完之后，逐项核对</h2><ul>{article.checklist.map(item => <li key={item}><Check size={17} aria-hidden="true" />{item}</li>)}</ul></section>
          <section className="iran-section" aria-labelledby="sources"><p className="iran-eyebrow">SOURCES & REVIEW</p><h2 id="sources">资料来源与查阅记录</h2><p>发布日期与本次查阅日期分别标注。查阅旧资料不代表其所有规定在今天仍有效；文化介绍不证明景点当前开放。路线、住宿节奏和预算方法为 Wayella 编辑建议，未声称实地体验或提供实时预警。</p><ul className="iran-source-list">{sourceIds.map(id => {
            const source: { label: string; url: string; scope: string; publishedAt?: string; checkedAt?: string } = iranSources[id];
            return <li key={id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<ExternalLink size={14} /></a><p>{source.scope}</p><small>{source.publishedAt && `来源发布／更新：${source.publishedAt} · `}{source.checkedAt ? `本次查阅：${source.checkedAt}` : '资料入口，后续复核'}</small></li>;
          })}</ul></section>
          <section className="iran-related" aria-labelledby="related"><h2 id="related">继续阅读伊朗专题</h2><IranGuideCards current={article.slug} />{!overview && <Link className="iran-text-link" href="/guides/iran/"><BookOpen size={17} />返回伊朗总攻略 <ArrowUpRight size={16} /></Link>}</section>
        </div>
      </div>
    </div><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
  </article>;
}
