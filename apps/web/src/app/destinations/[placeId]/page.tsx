import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3, Coins, MapPin } from 'lucide-react';

import { SaveButton } from '@/components/save-button';
import { copy } from '@/lib/copy';
import { getGuide, guides } from '@/lib/guides';
import type { CityGuide, GuideItem } from '@/lib/guides';

type Props = { params: Promise<{ placeId: string }> };

export function generateStaticParams() {
  return guides.map((guide) => ({ placeId: guide.place.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = getGuide((await params).placeId);
  return {
    title: guide ? `${guide.place.name}, ${guide.country}` : copy.destination,
    description: guide?.intro,
    alternates: guide ? { canonical: `/destinations/${guide.place.id}/` } : undefined,
  };
}

function GuideEntry({ item, guide }: { item: GuideItem; guide: CityGuide }) {
  const source = guide.sources.find((record) => record.id === item.sourceId);
  return <article className="guide-entry">
    <div className="guide-entry__header">
      <h3>{item.title}</h3>
      <span className={`guide-entry__kind guide-entry__kind--${item.kind}`}>
        {item.kind === 'editorial' ? copy.editorialSuggestion : copy.officialSource}
      </span>
    </div>
    <p>{item.description}</p>
    {source && <a className="guide-entry__source" href={source.url} target="_blank" rel="noopener noreferrer">
      {source.label}<ArrowUpRight size={15} aria-hidden="true" /><span>{copy.sourceChecked} {source.checkedAt}</span>
    </a>}
  </article>;
}

export default async function DestinationPage({ params }: Props) {
  const guide = getGuide((await params).placeId);
  if (!guide) notFound();

  const place = guide.place;
  const mapUrl = `https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=11/${place.latitude}/${place.longitude}`;

  return <>
    <section className="place-hero">
      <Image src={guide.image} alt={`${place.name}, ${guide.country}`} fill priority sizes="100vw" />
      <div className="place-hero__shade" />
      <div className="shell place-hero__inner">
        <Link className="back-link" href="/#destinations"><ArrowLeft size={17} aria-hidden="true" />{copy.explore}</Link>
        <div><p className="place-hero__country">{guide.country}</p><h1>{place.name}</h1></div>
      </div>
    </section>
    <div className="shell place-content">
      <div className="place-content__heading">
        <div><p className="place-content__label">{copy.cityGuide}</p><h2>{copy.planVisit} {place.name}</h2></div>
        <div className="place-content__actions"><SaveButton place={place} /><Link className="trip-link" href={`/trips?destination=${place.id}`}><CalendarDays size={18} aria-hidden="true" />{copy.planTrip}</Link></div>
      </div>
      <p className="guide-intro">{guide.intro}</p>
      <div className="fact-grid" aria-label={copy.destinationBasics}>
        <div className="fact"><Clock3 size={22} aria-hidden="true" /><span>{copy.localTime}</span><strong>{place.timeZone.replaceAll('_', ' ')}</strong></div>
        <div className="fact"><Coins size={22} aria-hidden="true" /><span>{copy.currency}</span><strong>{place.currency}</strong></div>
        <div className="fact"><MapPin size={22} aria-hidden="true" /><span>{copy.map}</span><a href={mapUrl} target="_blank" rel="noopener noreferrer">{copy.openCityMap}<ArrowUpRight size={16} aria-hidden="true" /></a></div>
      </div>
      <section className="guide-section" aria-labelledby="guide-essentials">
        <div className="guide-section__heading"><h2 id="guide-essentials">{copy.planDays}</h2><p>{copy.planDaysIntro}</p></div>
        <div className="guide-list">{guide.sections.map((item) => <GuideEntry key={item.id} item={item} guide={guide} />)}</div>
      </section>
      <section className="guide-section" aria-labelledby="guide-highlights">
        <div className="guide-section__heading"><h2 id="guide-highlights">{copy.placesToExplore}</h2><p>{copy.placesToExploreIntro}</p></div>
        <div className="guide-list guide-list--highlights">{guide.highlights.map((item) => <GuideEntry key={item.id} item={item} guide={guide} />)}</div>
      </section>
      <p className="guide-disclaimer">{copy.guideDisclaimer}</p>
    </div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      '@context': 'https://schema.org', '@type': 'TouristDestination', name: place.name,
      description: guide.intro,
      geo: { '@type': 'GeoCoordinates', latitude: place.latitude, longitude: place.longitude },
      address: { '@type': 'PostalAddress', addressCountry: place.countryCode },
    }).replace(/</g, '\\u003c') }} />
  </>;
}
