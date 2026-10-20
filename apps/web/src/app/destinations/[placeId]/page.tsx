import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Clock3, Coins, MapPin, ShieldCheck } from 'lucide-react';

import { SaveButton } from '@/components/save-button';
import { copy } from '@/lib/copy';
import { cityPresentation, countryName, getPlace } from '@/lib/places';

type Props = { params: Promise<{ placeId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const place = await getPlace((await params).placeId);
    return { title: place ? `${place.name}, ${countryName(place.countryCode)}` : copy.destination };
  } catch { return { title: copy.destination }; }
}

export default async function DestinationPage({ params }: Props) {
  let place: Awaited<ReturnType<typeof getPlace>>;
  try { place = await getPlace((await params).placeId); } catch {
    return <div className="shell content-page"><p className="notice" role="alert">{copy.placeUnavailable}</p><Link className="text-link" href="/"><ArrowLeft size={18} aria-hidden="true" />{copy.explore}</Link></div>;
  }
  if (!place) notFound();

  const presentation = cityPresentation(place.id);
  const mapUrl = `https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=11/${place.latitude}/${place.longitude}`;
  const updated = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(place.updatedAt));

  return <>
    <section className={`place-hero${presentation ? '' : ' place-hero--plain'}`}>
      {presentation && <Image src={presentation.image} alt={`${place.name}, ${countryName(place.countryCode)}`} fill priority sizes="100vw" />}
      <div className="place-hero__shade" />
      <div className="shell place-hero__inner">
        <Link className="back-link" href="/#destinations"><ArrowLeft size={17} aria-hidden="true" />{copy.explore}</Link>
        <div><p className="place-hero__country">{countryName(place.countryCode)}</p><h1>{place.name}</h1></div>
      </div>
    </section>
    <div className="shell place-content">
      <div className="place-content__heading"><div><p className="place-content__label">{copy.destination}</p><h2>{place.name}</h2></div><SaveButton place={place} /></div>
      <div className="fact-grid">
        <div className="fact"><Clock3 size={22} aria-hidden="true" /><span>{copy.localTime}</span><strong>{place.timeZone.replaceAll('_', ' ')}</strong></div>
        <div className="fact"><Coins size={22} aria-hidden="true" /><span>{copy.currency}</span><strong>{place.currency}</strong></div>
        <div className="fact"><MapPin size={22} aria-hidden="true" /><span>{copy.coordinates}</span><strong>{place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}</strong></div>
      </div>
      <div className="source-strip"><ShieldCheck size={21} aria-hidden="true" /><div><span>{copy.source}</span><strong>{place.sourceLabel}</strong></div><div><span>{copy.updated}</span><strong>{updated}</strong></div><a href={mapUrl} target="_blank" rel="noopener noreferrer">{copy.map}<ArrowUpRight size={17} aria-hidden="true" /></a></div>
    </div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'TouristDestination', name: place.name, geo: { '@type': 'GeoCoordinates', latitude: place.latitude, longitude: place.longitude }, address: { '@type': 'PostalAddress', addressCountry: place.countryCode } }).replace(/</g, '\\u003c') }} />
  </>;
}
