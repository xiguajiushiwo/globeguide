'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Globe2, List, Map as MapIcon, MapPin, RotateCcw, Search, X } from 'lucide-react';
import { destinationCatalog, getDestination, searchDestinations, type Destination } from '@globeguide/domain';

const WorldMapCanvas = dynamic(() => import('./world-map-canvas').then((module) => module.WorldMapCanvas), {
  ssr: false,
  loading: () => <div className="map-canvas-loading" role="status">Loading map…</div>,
});

type RegionFilter = 'all' | 'mainland' | 'hong-kong' | 'macau' | 'taiwan' | 'rest-of-world';

function matchesRegion(destination: Destination, region: RegionFilter): boolean {
  return region === 'all' || destination.regionGroup === region;
}

export function MapExplorer() {
  const params = useSearchParams();
  const initialRegion = params.get('region');
  const initialCity = params.get('city') ?? '';
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<RegionFilter>(initialRegion === 'mainland' ? 'mainland' : 'all');
  const [selectedId, setSelectedId] = useState<string | null>(getDestination(initialCity)?.place.id ?? null);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const [mapFailed, setMapFailed] = useState(false);
  const filtered = useMemo(() => searchDestinations(query).filter((destination) => matchesRegion(destination, region)), [query, region]);
  const selected = filtered.find((destination) => destination.place.id === selectedId) ?? null;

  function selectDestination(id: string) {
    setSelectedId(id);
    const url = new URL(window.location.href);
    url.searchParams.set('city', id);
    window.history.replaceState(window.history.state, '', url.pathname + url.search);
  }

  function resetView() {
    setQuery('');
    setRegion('all');
    setSelectedId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('city');
    url.searchParams.delete('region');
    window.history.replaceState(window.history.state, '', url.pathname + url.search);
  }

  function changeRegion(value: RegionFilter) {
    setRegion(value);
    setSelectedId(null);
    const url = new URL(window.location.href);
    if (value === 'all') url.searchParams.delete('region');
    else url.searchParams.set('region', value);
    url.searchParams.delete('city');
    window.history.replaceState(window.history.state, '', url.pathname + url.search);
  }

  return <div className="shell map-page">
    <div className="map-page__heading">
      <div><span className="map-page__eyebrow"><Globe2 size={17} aria-hidden="true" /> GlobeGuide atlas</span><h1>Explore the world</h1><p>Choose a city on the map or browse the destination list.</p></div>
      <span className="map-page__count">{destinationCatalog.length} destinations</span>
    </div>
    <div className="map-toolbar">
      <label className="map-toolbar__search"><Search size={18} aria-hidden="true" /><span className="sr-only">Search cities</span><input value={query} onChange={(event) => { setQuery(event.target.value); setSelectedId(null); }} placeholder="Search cities or regions" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search" title="Clear search"><X size={17} /></button>}</label>
      <label className="map-toolbar__region"><span className="sr-only">Region</span><select value={region} onChange={(event) => changeRegion(event.target.value as RegionFilter)}><option value="all">All regions</option><option value="mainland">Mainland China</option><option value="hong-kong">Hong Kong</option><option value="macau">Macau</option><option value="taiwan">Taiwan</option><option value="rest-of-world">Other destinations</option></select></label>
      <button className="map-toolbar__reset" type="button" onClick={resetView} title="Reset map and filters"><RotateCcw size={17} aria-hidden="true" /><span>Reset</span></button>
    </div>
    <div className="map-mobile-tabs" role="group" aria-label="Map view">
      <button type="button" className={mobileView === 'map' && !mapFailed ? 'is-active' : ''} onClick={() => setMobileView('map')} disabled={mapFailed} aria-pressed={mobileView === 'map' && !mapFailed}><MapIcon size={17} aria-hidden="true" />Map</button>
      <button type="button" className={mobileView === 'list' || mapFailed ? 'is-active' : ''} onClick={() => setMobileView('list')} aria-pressed={mobileView === 'list' || mapFailed}><List size={17} aria-hidden="true" />List</button>
    </div>
    <div className={`map-layout${mobileView === 'list' || mapFailed ? ' map-layout--list-mobile' : ''}`}>
      <section className="map-stage" aria-label="Interactive destination map">
        <div className="map-stage__canvas">
          {mapFailed ? <div className="map-stage__error" role="status"><MapIcon size={27} aria-hidden="true" /><strong>Map unavailable</strong><p>The city list is still available. Try the map again later.</p></div> : <WorldMapCanvas destinations={filtered} selectedId={selected?.place.id ?? null} onSelect={selectDestination} onError={() => { setMapFailed(true); setMobileView('list'); }} active={mobileView === 'map'} />}
        </div>
        <div className="map-stage__footer">
          {selected ? <div className="map-selection"><div><span>{selected.region}</span><h2>{selected.place.name} <small lang="zh">{selected.nameZh}</small></h2><p>{selected.summary}</p></div><Link href={`/destinations/${selected.place.id}/`} aria-label={`Explore ${selected.place.name}`}><ArrowRight size={20} aria-hidden="true" /></Link></div> : <p><MapPin size={17} aria-hidden="true" />Select a destination to preview it here.</p>}
        </div>
      </section>
      <aside className="map-results" aria-label="Destination list">
        <div className="map-results__heading"><strong>{filtered.length} {filtered.length === 1 ? 'city' : 'cities'}</strong><span>Open a city or locate it on the map</span></div>
        {filtered.length === 0 ? <p className="map-results__empty">No cities match your search. Try another name or region.</p> : <ul>{filtered.map((destination) => <li key={destination.place.id} className={selected?.place.id === destination.place.id ? 'is-selected' : ''}>
          <button type="button" className="map-results__locate" onClick={() => { selectDestination(destination.place.id); setMobileView('map'); }} aria-label={`Show ${destination.place.name} on map`} title={`Show ${destination.place.name} on map`}><MapPin size={18} aria-hidden="true" /></button>
          <Link href={`/destinations/${destination.place.id}/`}><span>{destination.region}</span><strong>{destination.place.name} <small lang="zh">{destination.nameZh}</small></strong></Link>
          <ArrowRight className="map-results__arrow" size={17} aria-hidden="true" />
        </li>)}</ul>}
      </aside>
    </div>
  </div>;
}
