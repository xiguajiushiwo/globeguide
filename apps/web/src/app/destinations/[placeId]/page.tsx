import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3, Coins, MapPin } from 'lucide-react';
import { destinationCatalog, getDestination } from '@globeguide/domain';

import { SaveButton } from '@/components/save-button';
import { DestinationStories } from '@/components/destination-stories';
import { copy } from '@/lib/copy';
import { getGuide } from '@/lib/guides';
import type { CityGuide, GuideItem } from '@/lib/guides';
import './destination-overview.css';

type Props = { params: Promise<{ placeId: string }> };

export function generateStaticParams() {
  return destinationCatalog.map((destination) => ({ placeId: destination.place.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const destination = getDestination((await params).placeId);
  const guide = destination && getGuide(destination.place.id);
  return {
    title: destination ? `${destination.place.name} | ${destination.region}` : copy.destination,
    description: guide?.intro ?? destination?.summary,
    alternates: destination ? { canonical: `/destinations/${destination.place.id}/` } : undefined,
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
  const destination = getDestination((await params).placeId);
  if (!destination) notFound();
  const guide = getGuide(destination.place.id);

  const place = destination.place;
  const mapUrl = `/map/?city=${place.id}`;

  if (!guide) return <>
    <section className="place-hero place-hero--plain">
      <div className="shell place-hero__inner">
        <Link className="back-link" href="/map/"><ArrowLeft size={17} aria-hidden="true" />World map</Link>
        <div><p className="place-hero__country">{destination.region}</p><h1>{place.name}</h1><p className="place-hero__local-name" lang="zh">{destination.nameZh}</p></div>
      </div>
    </section>
    <div className="shell place-content">
      <div className="place-content__heading">
        <div><p className="place-content__label">City overview</p><h2>Explore {place.name}</h2></div>
        <div className="place-content__actions"><SaveButton place={place} /><Link className="trip-link" href={`/trips?destination=${place.id}`}><CalendarDays size={18} aria-hidden="true" />{copy.planTrip}</Link></div>
      </div>
      <p className="guide-intro">{destination.summary}</p>
      <div className="fact-grid" aria-label={copy.destinationBasics}>
        <div className="fact"><MapPin size={22} aria-hidden="true" /><span>Region</span><strong>{destination.region}</strong></div>
        <div className="fact"><Clock3 size={22} aria-hidden="true" /><span>{copy.localTime}</span><strong>{place.timeZone.replaceAll('_', ' ')}</strong></div>
        <div className="fact"><Coins size={22} aria-hidden="true" /><span>{copy.currency}</span><strong>{place.currency}</strong></div>
      </div>
      <div className="destination-overview__map-action"><Link className="text-link" href={mapUrl}><MapPin size={18} aria-hidden="true" />View {place.name} on the map<ArrowUpRight size={16} aria-hidden="true" /></Link></div>
      <section className="destination-overview__guide-note" aria-labelledby="guide-status-title">
        <h2 id="guide-status-title">City guide in progress</h2>
        <p>Explore the map and traveler stories while we research a sourced city guide. Times, tickets, and routes are not yet verified for this destination.</p>
      </section>
      <DestinationStories destinationId={place.id} />
      <p className="destination-overview__source">City-center coordinates: GeoNames cities15000 gazetteer, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. Map data attribution appears on the map.</p>
    </div>
  </>;

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
        <div className="fact"><MapPin size={22} aria-hidden="true" /><span>{copy.map}</span><Link href={mapUrl}>{copy.openCityMap}<ArrowUpRight size={16} aria-hidden="true" /></Link></div>
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
      <DestinationStories destinationId={place.id} />
    </div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      '@context': 'https://schema.org', '@type': 'TouristDestination', name: place.name,
      description: guide.intro,
      geo: { '@type': 'GeoCoordinates', latitude: place.latitude, longitude: place.longitude },
      address: { '@type': 'PostalAddress', addressCountry: place.countryCode },
    }).replace(/</g, '\\u003c') }} />
  </>;
}
