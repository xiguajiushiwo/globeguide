import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Check, CircleHelp, ExternalLink, MapPin, Plane, ShieldCheck, TrainFront } from 'lucide-react';

import { bookingTimeline, japanAreaNotes, japanGuideReviewedAt, japanPackingChecklist, japanSources, japanTenDayRoute } from '@/lib/japan-guide';
import { JapanRouteMap } from '@/components/japan-route-map';
import './japan-guide.css';

export const metadata: Metadata = {
  title: '日本自由行全攻略：签证、交通、行程与预算',
  description: '面向中国大陆普通护照旅客的日本自由行指南：签证、入境、机场、交通卡、新干线、东京京都大阪奈良 7/10/14 天路线、预约、预算和安全。',
  alternates: { canonical: '/guides/japan/' },
  openGraph: { title: '日本自由行全攻略 | GlobeGuide', description: '从办签证到返程，把第一次日本自由行走完整。', images: ['/images/tokyo.jpg'] },
};

const sections = [
  ['start', '先决定怎么走'], ['visa', '签证与出发资格'], ['before', '预订时间线'], ['entry', '入境与海关'],
  ['airport', '机场进城'], ['rail', '铁路与市内交通'], ['route', '10 天逐日路线'], ['route-map', '路线地图与现场交通'], ['variants', '7/14 天怎么改'],
  ['cities', '城市怎么玩'], ['tickets', '门票与预约'], ['budget', '真实预算'], ['sleep', '住宿与行李'],
  ['food', '吃饭与礼仪'], ['digital', '支付与联网'], ['season', '季节和人群'], ['safety', '安全与应急'],
  ['departure', '返程清单'], ['faq', '常见问题'], ['sources', '官方资料'],
] as const;

function Source({ id, children }: { id: string; children?: React.ReactNode }) {
  const source = japanSources.find((item) => item.id === id);
  if (!source) return null;
  return <a className="japan-source-link" href={source.url} target="_blank" rel="noopener noreferrer" title={`${source.label}，新窗口打开`}>
    {children ?? source.label}<ArrowUpRight size={14} aria-hidden="true" />
  </a>;
}

function SectionHeading({ id, eyebrow, title, lead }: { id: string; eyebrow: string; title: string; lead?: string }) {
  return <div className="japan-section-heading" id={id}>
    <span>{eyebrow}</span><h2>{title}</h2>{lead && <p>{lead}</p>}
  </div>;
}

function Callout({ title, children }: { title: string; children: React.ReactNode }) {
  return <aside className="japan-callout"><strong>{title}</strong><p>{children}</p></aside>;
}

export default function JapanGuidePage() {
  const articleSchema = {
    '@context': 'https://schema.org', '@type': 'Article', headline: '日本自由行全攻略：签证、交通、行程与预算',
    inLanguage: 'zh-CN', dateModified: japanGuideReviewedAt, author: { '@type': 'Organization', name: 'GlobeGuide' },
    publisher: { '@type': 'Organization', name: 'GlobeGuide' }, image: 'https://globeguide.pages.dev/images/tokyo.jpg',
    mainEntityOfPage: 'https://globeguide.pages.dev/guides/japan/',
  };

  return <article className="japan-guide" lang="zh-CN">
    <header className="japan-hero">
      <Image src="/images/tokyo.jpg" alt="东京城市景观" fill priority sizes="100vw" />
      <div className="japan-hero__shade" />
      <div className="shell japan-hero__content">
        <Link href="/guides/" className="japan-back"><ArrowLeft size={16} />全部旅行攻略</Link>
        <p className="japan-hero__eyebrow">GlobeGuide / 日本专题</p>
        <h1>日本自由行<br />从签证到返程</h1>
        <p className="japan-hero__intro">第一份日本行程，从能不能出发、怎么买票，到每天坐哪段车、住哪里、花多少钱，按真实出行顺序拆开。</p>
        <div className="japan-hero__meta"><span>适用：从中国大陆出发的首次自由行</span><span>资料核验：{japanGuideReviewedAt}</span></div>
      </div>
    </header>

    <div className="japan-scope">
      <div className="shell japan-scope__inner">
        <div><Plane size={20} aria-hidden="true" /><span><strong>出行前</strong>签证、预订、入境</span></div>
        <div><TrainFront size={20} aria-hidden="true" /><span><strong>在日本</strong>交通、城市、消费</span></div>
        <div><ShieldCheck size={20} aria-hidden="true" /><span><strong>应急与返程</strong>保险、海关、退税</span></div>
      </div>
    </div>

    <div className="shell japan-layout">
      <nav className="japan-toc" aria-label="本篇目录"><p>本篇目录</p><ol>{sections.map(([id, title]) => <li key={id}><a href={`#${id}`}>{title}</a></li>)}</ol></nav>
      <div className="japan-article">
        <p className="japan-editor-note">本篇以<strong>中国大陆普通护照、观光目的、个人自由行</strong>为基准。永久居民身份、其他护照、团体旅行或过境条件不同，先查签证资格。运营时间、车次、票价、汇率和签证材料均可能变化；文中预算是 GlobeGuide 的规划估算，官方入口集中在文末。</p>

        <section aria-labelledby="start">
          <SectionHeading id="start" eyebrow="01 / 决策" title="先决定怎么走" lead="第一次去日本，不必把全国塞进一张车票。选择到达与离开的城市，再决定交通和酒店。" />
          <div className="japan-route-options">
            <div><strong>7 天 · 精简</strong><p>东京 3 晚 → 京都 2 晚 → 大阪 1 晚，关西离境。舍弃远途一日游，把城市核心走透。</p></div>
            <div><strong>10 天 · 推荐</strong><p>东京 4 晚 → 京都 3 晚 → 大阪 2 晚。奈良作转场半日；从大阪返程。下面给出逐日安排。</p></div>
            <div><strong>14 天 · 延伸</strong><p>在 10 天基础上补箱根/富士周边 1 晚、广岛与宫岛 2 晚，再留 1 天机动。尽量从西部城市离境。</p></div>
          </div>
          <p>先看机票的<strong>入境机场、出境机场、托运额度和取消规则</strong>，不要只比较票面价格。东京进、大阪出通常少一次新干线折返；如果同城往返更便宜，把折返车费、时间和多一晚酒店一起算。日本与中国有 1 小时时差，日本快 1 小时。境内大段移动尽量放在白天，别把末班车当唯一退路。</p>
          <p className="japan-inline-action"><a href="#route">直接看 10 天路线 <ArrowRight size={16} /></a><a href="#budget">先算旅行预算 <ArrowRight size={16} /></a></p>
        </section>

        <section aria-labelledby="visa">
          <SectionHeading id="visa" eyebrow="02 / 出发资格" title="签证：先确认能否按计划出发" lead="大陆普通护照赴日观光一般需要先取得相应签证。签证类别、受理渠道和材料以申请时所属日本使领馆公布的信息为准。" />
          <ol className="japan-steps">
            <li><strong>确认护照与居住地。</strong>护照应覆盖整个旅行和返程；同时核对签证页、姓名拼音、出生日期和证件状态。居住地或户籍可能决定受理领区，不能直接照搬他人的材料清单。</li>
            <li><strong>确认签证类型与申请渠道。</strong>选择短期观光对应的单次或多次入境类别；不要把过境、商务或其他护照的免签规则套用到自己。日本驻华使领馆签证页应是最终判断入口。</li>
            <li><strong>按本领区清单备件。</strong>常见类别包括申请表、护照、照片、行程/住宿信息及经济能力证明，但材料组合、原件要求、有效期和补件规则随领区及签证类别变化。未确认前优先订可退改产品。</li>
            <li><strong>递交并核对签发结果。</strong>领取后逐字检查姓名、护照号、有效期、入境次数、停留期限；出发日期必须落在允许范围。JNTO 提到一般处理约五个工作日，但这不是保证时限，旺季和补件都应留足缓冲。</li>
          </ol>
          <h3 className="japan-subheading">递交前逐项核对</h3>
          <ul className="japan-check-list">
            <li><strong>受理领区：</strong>用常住地和现行领区规则确认负责的使领馆，再进入其指定的签证申请渠道；跨领区材料要求可能不同。</li>
            <li><strong>材料版本：</strong>在递交当天重新下载该类别清单与申请表，按清单准备照片、身份和经济资料。不要用旅行社旧截图替代使领馆公告。</li>
            <li><strong>订单一致性：</strong>护照拼音、机票与酒店预订人、申请表日期及同行信息逐项对照；保留可退改订单直至签证结果明确。</li>
            <li><strong>获签后复查：</strong>确认入境次数、有效期和停留天数覆盖全部行程，再购买无法退改的跨城车票和门票。</li>
          </ul>
          <Callout title="不要混淆：签证、入境许可与 Visit Japan Web">签证允许你向日本申请入境，最终能否入境由边检决定；Visit Japan Web 用于预填入境与海关信息，<strong>不是签证，也并非强制注册</strong>。护照、签证、返程安排和住宿信息仍要随身可查。</Callout>
          <p className="japan-citations">核对入口：<Source id="visa" /> · <Source id="consulate">日本驻华大使馆签证页</Source> · <Source id="consular">中国领事服务网最新提醒</Source></p>
        </section>

        <section aria-labelledby="before">
          <SectionHeading id="before" eyebrow="03 / 时间安排" title="从订票到登机，按这个顺序做" />
          <div className="japan-timeline">{bookingTimeline.map((phase) => <div key={phase.when}><h3>{phase.when}</h3><ul>{phase.tasks.map((task) => <li key={task}>{task}</li>)}</ul></div>)}</div>
          <p>旺季包括樱花季、红叶季、日本黄金周、盂兰盆节和年末年初；具体花期、活动和公共假期每年变。机票、可退改住宿、签证、预约制门票、新干线的先后顺序可以随风险调整，<strong>不要为追逐低价锁死所有不可退订单</strong>。</p>
        </section>

        <section aria-labelledby="entry">
          <SectionHeading id="entry" eyebrow="04 / 落地" title="入境与海关：下飞机以后做什么" />
          <div className="japan-flow"><span>下机</span><ArrowRight size={16} /><span>入境审查</span><ArrowRight size={16} /><span>取行李</span><ArrowRight size={16} /><span>海关</span><ArrowRight size={16} /><span>出到达层</span></div>
          <p>出发前用 <Source id="visit-japan">Visit Japan Web</Source> 填写本人和同行信息，可办理入境审查及海关电子申报；不会操作也可按机场现场流程办理。二维码保存到手机相册，纸质备份首晚酒店地址；一家人同行时逐人核对姓名和二维码。入境审查可能询问停留目的、天数、酒店和离境安排，回答与资料一致即可。</p>
          <p>日本海关要求入境旅客申报携带物品，电子申报是官方推荐方式。现金/有价证券超过规定门槛、食品、药品、动植物和免税限额都有单独规则；<strong>肉制品和新鲜农产品不要抱侥幸</strong>。药品尤其是含管制成分者，应在出发前向主管机关核对并带处方或说明，不能仅凭“国内可以买到”判断能否带入。<Source id="customs">日本海关旅客指南</Source></p>
          <p>日本机场出关后通常可找到 ATM、交通售票机、游客信息处和 SIM 服务点。先连上网、取适量现金，再根据酒店地址买进城票；凌晨到达优先确认是否还有公共交通，必要时事先安排机场附近过夜。</p>
        </section>

        <section aria-labelledby="airport">
          <SectionHeading id="airport" eyebrow="05 / 机场交通" title="NRT、HND、KIX：别买错进城票" lead="先在机票上确认机场三字码、航站楼和酒店最近的车站。下表是选车逻辑，时刻与车价以运营商当日查询为准。" />
          <div className="japan-table-wrap"><table><thead><tr><th>机场</th><th>选车思路</th><th>实际操作</th></tr></thead><tbody>
            <tr><th>东京羽田 HND</th><td>靠东京市区；京急适合品川、浅草方向；东京单轨电车适合浜松町换乘；也有巴士。</td><td>看航站楼、车站出口、末班时间；有多件行李可比较直达巴士。</td></tr>
            <tr><th>东京成田 NRT</th><td>上野/日暮里看 Skyliner；东京/品川/新宿方向看 N’EX 或巴士。不同车票与线路不能混用。</td><td>先查航站楼再查上车站台；特急票与普通乘车规则不同，别只刷交通卡就上指定席。</td></tr>
            <tr><th>关西机场 KIX</th><td>难波看南海；天王寺/大阪/京都方向比较 JR 与机场巴士。</td><td>关西机场车站与航站楼之间可能需要步行或接驳；早班机前夜规划好首班车。</td></tr>
          </tbody></table></div>
          <h3 className="japan-subheading">拿到行李后，按酒店位置选车</h3>
          <div className="japan-table-wrap"><table><thead><tr><th>从机场到哪里</th><th>先查的线路</th><th>上车前确认</th></tr></thead><tbody>
            <tr><th>NRT → 上野/日暮里</th><td>京成 Skyliner；预算优先时比较京成其他列车。</td><td>Skyliner 有指定席与专用票，确认停靠站、班次和购票凭证。<Source id="keisei">京成官网</Source></td></tr>
            <tr><th>NRT → 东京/品川/新宿</th><td>比较 JR 成田特快、机场巴士与换乘次数。</td><td>先算下车站到酒店的最后一段；晚到时核对末班与巴士落客点。</td></tr>
            <tr><th>HND → 品川/浅草</th><td>从机场京急站查看直通方向与实际终点。</td><td>同一站台列车终点可能不同，按显示屏核对目的地，别只看线路颜色。</td></tr>
            <tr><th>HND → 浜松町/东京站附近</th><td>东京单轨电车到浜松町，再按酒店位置换乘。</td><td>大箱子优先确认换乘电梯；东京站内部步行距离不能忽略。</td></tr>
            <tr><th>KIX → 难波</th><td>南海普通列车或特急，按时间和行李比较。</td><td>特急可能需要乘车券以外的座席票；确认下车是南海难波站。<Source id="kix">机场官网</Source></td></tr>
            <tr><th>KIX → 天王寺/大阪/京都</th><td>比较 JR 直达、转乘与机场巴士。</td><td>确认目标站是“大阪”还是“新大阪”；特急票种与站台按实际班次核对。</td></tr>
          </tbody></table></div>
          <ol className="japan-steps"><li>在地图里输入<strong>酒店名称或准确地址</strong>，记下最近的铁路站和出口；“到东京”并不等于“到酒店”。</li><li>在机场跟随 Railways / Trains 指示到车站，看运营商、列车种别、目的地和末班时间。普通车与指定席特急的购票方式可能不同。</li><li>检票前备好二维码或实体票；不确定时向有人窗口出示酒店站名和车次，问是否还需要特急券。错过末班就改机场巴士或合法出租车，别在站台临时猜路线。</li></ol>
          <p className="japan-citations">核对：<Source id="airport-access" /> · <Source id="narita" /> · <Source id="haneda" /> · <Source id="keisei" /> · <Source id="kix" /></p>
        </section>

        <section aria-labelledby="rail">
          <SectionHeading id="rail" eyebrow="06 / 坐车" title="交通卡、新干线和 JR Pass 一次搞清" />
          <div className="japan-rule-list">
            <div><span>01</span><div><h3>市内：交通卡解决多数普通车</h3><p>Suica、PASMO、ICOCA 等互通交通卡可用于大量普通铁路、地铁、巴士与小额消费，但<strong>不能代替新干线或部分特急的指定席/附加票</strong>。买卡前确认手机系统支持情况、退卡规则和你到达机场的销售现况。离站刷卡失败，去有人窗口处理，不要翻闸机。</p></div></div>
            <div><span>02</span><div><h3>跨城：东京—京都/大阪先单买比较</h3><p>东海道新干线可通过 <Source id="smart-ex">SmartEX</Source> 或运营商正规渠道核对车次、自由席/指定席、变更及特大行李规则。东京—京都约 2–3 小时只是路线规划值；具体班次和票价在购票时查询。上车前再次核对列车名、车厢和座位。</p></div></div>
            <div><span>03</span><div><h3>JR 全国通票：算账后再买</h3><p>官方在线渠道的普通车 7/14/21 日票标价分别为 <strong>50,000 / 80,000 / 100,000 日元</strong>；海外指定代理渠道价格可能不同。只有东京进、大阪出、主要坐一次东海道新干线的旅程，通常先比较单程票，而非自动买全国通票。通票适用线路、Nozomi/Mizuho 额外规则、启用天数与购买资格均看官网。</p></div></div>
            <div><span>04</span><div><h3>导航时盯住“运营商 + 站名 + 出口”</h3><p>同城 JR、地铁和私铁可能共用大站却有不同闸口。手机地图给出的“到达时间”不包括迷路、楼梯和候车；第一次换乘、带箱子、赶飞机时多留 15–30 分钟。京都公交拥堵时优先评估铁路加步行。</p></div></div>
          </div>
          <Callout title="怎么判断一张通票是否回本">列出每段要坐的<strong>适用列车单买价格</strong>，按通票连续有效天数相加，与通票售价比较。把不适用的地铁/私铁、指定席附加要求和绕路时间剔除。路线确定前不买全国通票。</Callout>
          <p className="japan-citations">核对：<Source id="transport" /> · <Source id="jr-pass" /> · <Source id="smart-ex" /></p>
        </section>

        <section aria-labelledby="route">
          <SectionHeading id="route" eyebrow="07 / 每天怎么走" title="10 天 9 晚：东京进、大阪出" lead="这是一条可直接照着订酒店的首次访日主线。上午、下午、晚上留有余量；具体开放日和车次在出发前复核。" />
          <div className="japan-day-list">{japanTenDayRoute.map((day) => <section key={day.day} className="japan-day" aria-labelledby={`japan-day-${day.day}`}>
            <div className="japan-day__rail"><span>DAY {String(day.day).padStart(2, '0')}</span><small>{day.sleep}</small></div>
            <div className="japan-day__main"><h3 id={`japan-day-${day.day}`}>{day.title}</h3><dl>
              <div><dt>上午</dt><dd>{day.morning}</dd></div><div><dt>下午</dt><dd>{day.afternoon}</dd></div><div><dt>晚上</dt><dd>{day.evening}</dd></div>
            </dl><div className="japan-day__steps"><strong>照着走</strong><ol>{day.steps.map((step) => <li key={step}>{step}</li>)}</ol></div><p className="japan-day__transit"><TrainFront size={17} aria-hidden="true" />{day.transit}</p>{day.booking && <p className="japan-day__booking"><CalendarDays size={17} aria-hidden="true" />{day.booking}</p>}</div>
          </section>)}</div>
          <p>出发和返程航班往往占去半天，不把 D1/D10 算成完整游玩日。每天只放一个“必须完成”的预约，余下景点按天气、体力和拥挤程度替换；住宿与机票未定时不要先买不可改的时段票。</p>
        </section>

        <section aria-labelledby="route-map" className="japan-map-section">
          <SectionHeading id="route-map" eyebrow="地点地图" title="按路线走，也按兴趣找" lead="逐日路线可查看交通与打卡顺序；主题地图收录日本各地区的动漫巡礼、人文古迹、博物馆、自然风景、城市街区和乐园体验，可按地区或作品搜索。" />
          <JapanRouteMap />
        </section>

        <section aria-labelledby="variants">
          <SectionHeading id="variants" eyebrow="08 / 改行程" title="只有 7 天，或有 14 天" />
          <div className="japan-variant"><h3>7 天：删掉跨县一日游</h3><p>D1 到东京；D2 浅草/上野；D3 明治神宫/涩谷/新宿；D4 新干线到京都；D5 东山；D6 伏见或岚山后去大阪；D7 大阪返程。主题乐园、箱根与广岛留给下一次。少换酒店比多打卡一个城市更值。</p></div>
          <div className="japan-variant"><h3>14 天：向西延伸，不来回拉扯</h3><p>主线东京 4 晚、箱根/富士周边 1 晚、京都 3 晚、大阪 2 晚、广岛 2 晚，余下 1 晚给出境城市或天气机动。宫岛以渡轮和潮汐为前提；从广岛继续西行或选择合适出境机场，比再折返东京省时。</p></div>
          <p>带小孩、老人、轮椅或第一次跨国自由行，可把城市数减到两个，每次转场至少连续住两晚。季节限定景点是可替换模块，不要让花期或富士山能见度决定整个旅行成败。</p>
        </section>

        <section aria-labelledby="cities">
          <SectionHeading id="cities" eyebrow="09 / 玩法" title="各城市住哪里、打卡什么、避开什么坑" />
          <div className="japan-area-list">{japanAreaNotes.map((item) => <section key={item.city}><div><h3>{item.city}</h3><span>{item.stay}</span></div><p><strong>住：</strong>{item.base}</p><p><strong>玩：</strong>{item.highlights}</p><p><strong>留意：</strong>{item.trap}</p></section>)}</div>
          <p className="japan-citations">城市资料入口：<Source id="tokyo" /> · <Source id="kyoto" /> · <Source id="osaka" /> · <Source id="nara" /> · <Source id="hiroshima" /></p>
        </section>

        <section aria-labelledby="tickets">
          <SectionHeading id="tickets" eyebrow="10 / 预约" title="哪些打卡点必须先抢票" />
          <div className="japan-table-wrap"><table><thead><tr><th>项目</th><th>怎么买才稳妥</th><th>别忽略</th></tr></thead><tbody>
            <tr><th>吉卜力美术馆</th><td>先看 <Source id="ghibli">官网预约页面</Source>，再规划三鹰那天。</td><td>预约制，现场不宜碰运气；开售时间和实名规则以当期页面为准。</td></tr>
            <tr><th>teamLab / 观景台</th><td>先定展馆具体地址与日期，再买对应场次。<Source id="teamlab">teamLab 官网</Source></td><td>不同展馆不是同一个入口；迟到、退改按订单规则。</td></tr>
            <tr><th>USJ</th><td>先查日期门票，再决定是否买快速通关。<Source id="usj">环球影城官网</Source></td><td>门票、快速通关与热门区域的入场规则可能分别管理。</td></tr>
            <tr><th>新干线</th><td>跨城日确定后通过 <Source id="smart-ex">SmartEX</Source> 等正规渠道查询。</td><td>核对东京站/品川站、京都站、新大阪站、行李和变更条件。</td></tr>
            <tr><th>寺院、博物馆、季节活动</th><td>逐个查开放日、特别参观和票务；不要照搬旧游记截图。</td><td>“景区开放”与“馆内/特别展开放”可能不是一回事。</td></tr>
          </tbody></table></div>
          <p>预约邮件里的<strong>日期、时区、入场口、人数、儿童年龄、是否需要兑换纸票</strong>逐项核对；将二维码和订单号离线保存。别从陌生社交账号购买无法验证真伪的转让票。</p>
        </section>

        <section aria-labelledby="budget">
          <SectionHeading id="budget" eyebrow="11 / 花多少钱" title="以 10 天 9 晚为例做预算" lead="以下是每人规划估算，不是官方价格；以日元计，未含国际机票、签证/代办费、购物和高价主题乐园。住宿按双人分摊或经济型房源估算。" />
          <div className="japan-table-wrap"><table><thead><tr><th>项目</th><th>节省型</th><th>标准型</th><th>舒适型</th></tr></thead><tbody>
            <tr><th>住宿，9 晚</th><td>约 5.9 万日元</td><td>约 11.3 万日元</td><td>约 19.8 万日元</td></tr>
            <tr><th>餐饮，10 天</th><td>约 3 万</td><td>约 5.5 万</td><td>约 9 万</td></tr>
            <tr><th>市内交通，10 天</th><td>约 1 万</td><td>约 1.3 万</td><td>约 2 万</td></tr>
            <tr><th>景点与体验</th><td>约 1 万</td><td>约 2.5 万</td><td>约 5 万</td></tr>
            <tr><th>跨城交通</th><td>约 2.5 万</td><td>约 3 万</td><td>约 5 万</td></tr>
            <tr className="japan-table-total"><th>小计</th><td>约 13.4 万</td><td>约 23.6 万</td><td>约 40.8 万</td></tr>
          </tbody></table></div>
          <p>另加机场交通、保险、通信、住宿税或旺季溢价，并留 <strong>10%–15% 机动金</strong>。机票单独按出发地和日期询价；人民币总额按付款当天汇率换算。多人同行时先确认酒店标价是“每间房”还是“每人”，也要核对不含餐和地方住宿税的情况。</p>
          <Callout title="控制预算最有效的三件事">选择开口程避免折返；一日只跨一个片区；主题乐园和高价体验选最想去的一个。为了“回本”而买不合适的通票，经常比正常单买更贵。</Callout>
          <p className="japan-citations">官方费用参考：<Source id="jr-pass" /> · <Source id="tourist-tax">国际观光旅客税</Source>。JNTO 页面目前列出 3,000 日元的出境税，通常会由承运环节处理；买票时再核对票价组成。</p>
        </section>

        <section aria-labelledby="sleep">
          <SectionHeading id="sleep" eyebrow="12 / 住与行李" title="酒店怎么订，箱子怎么处理" />
          <ul className="japan-check-list">
            <li>住宿优先看<strong>离实际乘车站的步行距离与电梯</strong>，不只看地图直线距离。东京近地铁/JR 换乘，京都近京都站或四条，大阪近难波或梅田，分别适合不同路线。</li>
            <li>订房确认入住人数、床型、禁烟、独立卫浴、退改截止时间、儿童政策、寄存规则、入住/退房时间以及是否另收地方住宿税。</li>
            <li>跨城当天先向酒店确认能否寄存。车站储物柜尺寸和空位不可保证；送行李服务要核对送达日、禁运物品及截止时间。证件、药、贵重物和隔日衣物随身带。</li>
            <li>新干线大件行李和航空托运限制不是同一套标准。买票时确认列车的特大行李规定；充电宝按航空公司规定随身携带。</li>
          </ul>
        </section>

        <section aria-labelledby="food">
          <SectionHeading id="food" eyebrow="13 / 吃与礼仪" title="吃得好，也避免常见尴尬" />
          <div className="japan-split"><div><h3>点餐与排队</h3><p>第一次可从定食、拉面、寿司、乌冬、咖喱、便利店熟食开始。看店门口菜单是否含税、是否有最低消费或席位费；居酒屋可能先收座位/小菜费。热门店提前确认是否接受预约，不要在住宅区堵门排队。</p></div><div><h3>饮食限制</h3><p>素食、清真、过敏人群提前写好日文说明；高汤、酱汁、炸物共用油可能含鱼、肉或过敏原。餐厅是否能满足要求要逐店确认，别只根据菜名判断。</p></div></div>
          <p>公共交通放低音量、上下车排队；多数城市街头垃圾桶少，可带小袋暂存垃圾。寺社与私人街巷遵守拍摄、禁入和着装提示；温泉先确认纹身、男女分浴、冲洗和毛巾规则。一般不需要小费，服务费或座位费以店内说明为准。京都祇园等生活街区尤其要尊重当地居民。</p>
        </section>

        <section aria-labelledby="digital">
          <SectionHeading id="digital" eyebrow="14 / 消费与通信" title="现金、刷卡、联网与退税" />
          <div className="japan-rule-list">
            <div><span>¥</span><div><h3>日元现金与银行卡都带</h3><p>大城市很多商家可刷国际卡，但小店、寺社、旧式售票机和部分郊区仍可能只收现金；随身留够一两天的小额现金。便利店 ATM 等可取现，手续费、限额和是否支持卡种以银行与发卡行信息为准。<Source id="currency">JNTO 现金指南</Source> · <Source id="seven-bank">Seven Bank</Source></p></div></div>
            <div><span>4G</span><div><h3>联网先做兼容性检查</h3><p>eSIM 适合支持 eSIM 且不换卡的手机；实体 SIM 要确认解锁和卡槽；国内漫游适合作备用。出发前验证地图、邮箱、车票和支付 app 可以登录，并下载离线地图与翻译包。公共 Wi-Fi 不宜作为唯一联网方式。</p></div></div>
            <div><span>税</span><div><h3>免税不等于到手一定便宜</h3><p>购物先问门店是否参加免税、最低消费、护照/Visit Japan Web 展示要求和退货限制。日本免税制度可能调整，离境时按现行规则保留商品与购物记录；中国入境也有自己的申报和税收要求。不要拆单或借护照违规购物。</p></div></div>
          </div>
          <p>酒店、车票和购物都建议保留一张可境外交易的备用卡；跨境交易汇率、DCC 动态货币转换及取现手续费另算。付款终端若询问以人民币还是日元记账，先看清汇率和费用再选择。</p>
        </section>

        <section aria-labelledby="season">
          <SectionHeading id="season" eyebrow="15 / 什么时候去" title="季节、天气与不同旅伴" />
          <div className="japan-season-grid"><div><h3>春 · 3–5 月</h3><p>花期从南到北变化，温差和雨天都要预留；不要提前数月锁死某一天“必须见满开”。</p></div><div><h3>夏 · 6–8 月</h3><p>梅雨、高温与台风可能影响交通和户外活动；防暑补水、查看气象和列车公告。</p></div><div><h3>秋 · 9–11 月</h3><p>红叶高峰热门城市人多、房价高；山地与城市红叶时点不同。</p></div><div><h3>冬 · 12–2 月</h3><p>东京/关西与北海道温差大，雪地需要防滑装备；年末年初部分设施休业。</p></div></div>
          <p><strong>亲子：</strong>一天只排一个大馆或乐园，确认儿童票和推车、哺乳室。<strong>长者与行动不便者：</strong>预先核对车站电梯、酒店无障碍房和步行坡度，京都东山与箱根尤其要减量。<strong>独行：</strong>共享行程与酒店地址，夜间别以“最后一班”为唯一返回方案。任何季节都看 <Source id="jnto-plan">JNTO 行前信息</Source> 和当日气象、交通运营公告。</p>
        </section>

        <section aria-labelledby="safety">
          <SectionHeading id="safety" eyebrow="16 / 出问题怎么办" title="失物、就医、地震和台风" />
          <ul className="japan-emergency">
            <li><strong>110 警察 / 119 火警和急救。</strong>电话说明地点、发生什么事、是否有人受伤。酒店前台与站务员可协助报案或联络救援。</li>
            <li><strong>JNTO 游客热线：</strong>可提供多语言 24 小时支持，电话和服务范围以 <Source id="hotline">官方页面</Source> 最新信息为准；把网页离线保存。</li>
            <li><strong>生病或受伤：</strong>先联系保险公司确认指定医院与直付方式；急症直接求助。带护照、保险资料、常用药英文名及过敏史。</li>
            <li><strong>地震、台风、列车停运：</strong>先听酒店/车站现场指示，远离海岸等危险区域；查询气象、运营商和 <Source id="emergency">JNTO 应急页面</Source>，不要仅靠社交媒体传言。</li>
            <li><strong>遗失护照：</strong>报警留存记录，联系中国驻日使领馆/领保渠道办理后续，联系航空公司核对登机证件要求。<Source id="consular">中国领事服务网</Source></li>
          </ul>
          <p>旅行保险至少核对海外医疗、急救转运、航班/行李延误、既往病和高风险活动除外责任。保险是否覆盖滑雪、登山或租车，按实际活动逐项查。</p>
        </section>

        <section aria-labelledby="departure">
          <SectionHeading id="departure" eyebrow="17 / 临走前" title="最后 24 小时清单" />
          <ul className="japan-packing">{japanPackingChecklist.map((item) => <li key={item}><Check size={16} aria-hidden="true" />{item}</li>)}</ul>
          <p>退房时检查护照、手机、钱包、充电线和床下物品；机场根据国际航班建议提前到达，不用“地图显示到机场只要 45 分钟”推算出门时间。免税物品、液体与充电宝各按日本出境、航空公司和中国入境规定核对。<Source id="customs">日本海关</Source></p>
        </section>

        <section aria-labelledby="faq">
          <SectionHeading id="faq" eyebrow="18 / 一问一答" title="出发前最常见的疑问" />
          <div className="japan-faq">
            <details><summary><CircleHelp size={18} />去日本一定要买 JR Pass 吗？</summary><p>不一定。东京进、大阪出的一次单向跨城行程，先把单买新干线和其他适用 JR 段相加，再与全国通票价格比较。地铁、私铁和不适用列车不能算进“回本”。</p></details>
            <details><summary><CircleHelp size={18} />Visit Japan Web 是强制的吗？</summary><p>JNTO 说明不是强制注册；它可以让入境和海关手续更方便。按官方流程填写，也保留现场办理所需的信息。它不替代签证。</p></details>
            <details><summary><CircleHelp size={18} />只带银行卡不换现金可以吗？</summary><p>不建议。大城市支付便利，但小店、寺社、郊区和某些机器仍可能需要现金。带小额现金并准备可取现的备用卡。</p></details>
            <details><summary><CircleHelp size={18} />东京和大阪该从哪里进出？</summary><p>第一次走东京都市圈—京都—大阪时，优先比较东京进、大阪出与同城往返的全成本。机票差额、行李和返程新干线费用一起看。</p></details>
            <details><summary><CircleHelp size={18} />一天能把京都所有热门寺院走完吗？</summary><p>不推荐。东山、伏见、岚山方向不同，旺季公交拥挤。每一天聚焦一片区域，天气不好时替换为博物馆或市内散步。</p></details>
            <details><summary><CircleHelp size={18} />签证材料、门票和车价能直接照本文办理吗？</summary><p>本文提供办理顺序与判断方法。最终文件、价格、开放时段和受理规则会变，必须用本文每节的官方入口按出行日期核对。</p></details>
          </div>
        </section>

        <section aria-labelledby="sources">
          <SectionHeading id="sources" eyebrow="19 / 核验记录" title="官方资料与继续核对的入口" lead={`内容人工核验于 ${japanGuideReviewedAt}。部分官方站点会限制自动访问；实际受理、票务和运行状态以你打开的实时页面为准。路线、住区和预算为 GlobeGuide 原创规划建议。`} />
          <ol className="japan-sources">{japanSources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer"><span>{source.label}</span><ExternalLink size={15} aria-hidden="true" /></a><small>{source.scope}</small></li>)}</ol>
        </section>

        <div className="japan-end"><div><MapPin size={19} /><span>下一步：把东京、京都、大阪的酒店和跨城日先确定。</span></div><Link href="/trips/">打开行程规划 <ArrowRight size={17} /></Link></div>
      </div>
    </div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, '\\u003c') }} />
  </article>;
}
