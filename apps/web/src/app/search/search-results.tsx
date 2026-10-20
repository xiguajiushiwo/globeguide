'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { getDestination } from '@globeguide/domain';

import { SearchForm } from '@/components/search-form';
import { copy } from '@/lib/copy';
import { cityPresentation, countryName, searchPlaces } from '@/lib/places';
import './search.css';

export function SearchResults() {
  const query = useSearchParams().get('q')?.trim() ?? '';
  const results = searchPlaces(query);

  return <div className="shell content-page search-page">
    <h1>{query ? `${copy.resultsFor} “${query}”` : copy.allDestinations}</h1>
    <SearchForm key={query} defaultValue={query} />
    {results.length === 0 ? (
      <p className="empty-state">{copy.noResults}</p>
    ) : <div className="search-list">{results.map((place) => {
      const presentation = cityPresentation(place.id);
      const destination = getDestination(place.id);
      return <Link className="search-result" href={`/destinations/${place.id}`} key={place.id}>
        <div className="search-result__image">{presentation ? <Image src={presentation.image} alt="" fill sizes="96px" /> : <MapPin size={27} aria-hidden="true" />}</div>
        <div className="search-result__text"><span>{destination?.region ?? countryName(place.countryCode)}</span><h2>{place.name}{destination?.nameZh && <small lang="zh">{destination.nameZh}</small>}</h2></div>
        <ArrowUpRight className="search-result__arrow" size={22} aria-hidden="true" />
      </Link>;
    })}</div>}
  </div>;
}
