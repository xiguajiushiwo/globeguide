import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, MapPin } from 'lucide-react';

import { SearchForm } from '@/components/search-form';
import { copy } from '@/lib/copy';
import { cityPresentation, countryName, searchPlaces } from '@/lib/places';

export const metadata: Metadata = { title: copy.searchResults };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q?.trim() ?? '';
  let results: Awaited<ReturnType<typeof searchPlaces>> = [];
  let failed = false;
  try { results = await searchPlaces(query); } catch { failed = true; }

  return (
    <div className="shell content-page search-page">
      <h1>{query ? `${copy.resultsFor} “${query}”` : copy.allDestinations}</h1>
      <SearchForm defaultValue={query} />
      {failed ? <p className="notice" role="alert">{copy.searchUnavailable}</p> : results.length === 0 ? <p className="empty-state">{copy.noResults}</p> : (
        <div className="search-list">{results.map((place) => {
          const presentation = cityPresentation(place.id);
          return <Link className="search-result" href={`/destinations/${place.id}`} key={place.id}>
            <div className="search-result__image">{presentation ? <Image src={presentation.image} alt="" fill sizes="96px" /> : <MapPin size={27} aria-hidden="true" />}</div>
            <div className="search-result__text"><span>{countryName(place.countryCode)}</span><h2>{place.name}</h2></div>
            <ArrowUpRight className="search-result__arrow" size={22} aria-hidden="true" />
          </Link>;
        })}</div>
      )}
    </div>
  );
}
