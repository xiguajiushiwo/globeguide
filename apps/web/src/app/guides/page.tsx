import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, Globe2 } from 'lucide-react';

import './guides.css';

export const metadata: Metadata = {
  title: '旅行攻略',
  description: '按国家查找 GlobeGuide 旅行攻略。从出发手续到在地交通、行程和预算，按真实出行顺序规划。',
  alternates: { canonical: '/guides/' },
};

export default function GuidesPage() {
  return <main className="guides-index shell">
    <div className="guides-index__heading">
      <div className="guides-index__symbol"><Globe2 size={25} aria-hidden="true" /></div>
      <h1>旅行攻略</h1>
      <p>选择目的地，按出发前、抵达后、旅途中和返程的顺序查找实用信息。</p>
    </div>
    <section className="guides-index__section" aria-labelledby="guides-asia">
      <div className="guides-index__section-heading"><h2 id="guides-asia">亚洲</h2><span>已发布 1 篇</span></div>
      <Link className="guides-index__entry" href="/guides/japan/">
        <div className="guides-index__image"><Image src="/images/tokyo.jpg" alt="东京城市景观" fill sizes="(max-width: 640px) 100vw, 280px" /></div>
        <div className="guides-index__entry-content">
          <div className="guides-index__entry-label"><BookOpen size={16} aria-hidden="true" />国家攻略</div>
          <h3>日本自由行</h3>
          <p>适合从中国大陆出发的首次自由行：签证、入境、交通、东京至关西的逐日路线、预算与应急。</p>
          <span>查看攻略 <ArrowRight size={17} aria-hidden="true" /></span>
        </div>
      </Link>
    </section>
  </main>;
}
