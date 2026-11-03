'use client';

import Image from 'next/image';
import { Building2, Camera, Clapperboard, ExternalLink, Landmark, MapPin, Mountain, Navigation2, Search, Store, Ticket, TrainFront } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';
import { japanFieldDays, type JapanStop } from '@/lib/japan-field-guide';
import { filterJapanThemePlaces, japanRegions, japanThemeCategories, japanThemePlaces, type JapanRegion, type JapanThemeCategory, type JapanThemePlace } from '@/lib/japan-theme-places';
import 'maplibre-gl/dist/maplibre-gl.css';

const mapStyle = process.env.NEXT_PUBLIC_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';
const categoryIcons = { anime: Clapperboard, heritage: Landmark, museum: Building2, nature: Mountain, city: Store, experience: Ticket };
const pinLabels = { anime: '漫', heritage: '古', museum: '馆', nature: '景', city: '街', experience: '游' };
const relationLabels = { scene: '画面参考', setting: '故事舞台', related: '作品相关' };

function placeUrl(stop: JapanStop) {
  return `https://www.google.com/maps/search/?api=1&query=${stop.coordinates[1]},${stop.coordinates[0]}`;
}

function directionsUrl(from: JapanStop, to: JapanStop, mode: 'transit' | 'walking') {
  return `https://www.google.com/maps/dir/?api=1&origin=${from.coordinates[1]},${from.coordinates[0]}&destination=${to.coordinates[1]},${to.coordinates[0]}&travelmode=${mode}`;
}

export function JapanRouteMap() {
  const [mode, setMode] = useState<'route' | 'themes'>('route');
  const [category, setCategory] = useState<JapanThemeCategory>('anime');
  const [region, setRegion] = useState<JapanRegion | 'all'>('all');
  const [query, setQuery] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState(japanThemePlaces[0]!.id);
  const [dayNumber, setDayNumber] = useState(3);
  const [selectedId, setSelectedId] = useState('shibuya');
  const [variantId, setVariantId] = useState('');
  const [mapError, setMapError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const fittedViewRef = useRef<string | null>(null);
  const day = japanFieldDays.find((item) => item.day === dayNumber) ?? japanFieldDays[0];
  const activeVariant = day.options?.find((option) => option.id === variantId) ?? day.options?.[0];
  const visibleStops = useMemo(() => activeVariant ? day.stops.filter((stop) => activeVariant.stopIds.includes(stop.id)) : day.stops, [day, activeVariant]);
  const selectedStop = visibleStops.find((stop) => stop.id === selectedId) ?? visibleStops[0]!;
  const routeKey = `${dayNumber}-${activeVariant?.id ?? 'default'}`;
  const visiblePlaces = useMemo(() => filterJapanThemePlaces(japanThemePlaces, category, region, query), [category, region, query]);
  const selectedPlace = visiblePlaces.find((place) => place.id === selectedPlaceId) ?? visiblePlaces[0];

  useEffect(() => {
    if (!containerRef.current) return;
    try {
      maplibregl.setWorkerUrl('/maplibre-gl-worker.js');
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: mapStyle,
        center: [139.7005723, 35.6594821],
        zoom: 11,
        minZoom: 3,
        maxZoom: 17,
        attributionControl: {},
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      map.on('error', (event) => {
        if (event.error?.message?.includes('Failed to fetch')) setMapError(true);
      });
      return () => {
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];
        map.remove();
        mapRef.current = null;
        fittedViewRef.current = null;
      };
    } catch {
      setMapError(true);
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    const points = mode === 'route' ? visibleStops : visiblePlaces;
    markersRef.current = points.map((stop, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      const active = mode === 'route' ? stop.id === selectedStop.id : stop.id === selectedPlace?.id;
      button.className = `japan-route-pin${mode === 'themes' ? ` japan-route-pin--${category}` : ''}${active ? ' is-selected' : ''}`;
      button.textContent = mode === 'route' ? String(index + 1) : pinLabels[category];
      button.setAttribute('aria-label', mode === 'route' ? `${index + 1}. ${stop.name}` : `${stop.name}，${japanThemeCategories.find((item) => item.id === category)?.label}`);
      button.title = stop.name;
      button.addEventListener('click', () => mode === 'route' ? setSelectedId(stop.id) : setSelectedPlaceId(stop.id));
      return new maplibregl.Marker({ element: button, anchor: 'bottom' }).setLngLat(stop.coordinates).addTo(map);
    });
    const viewKey = mode === 'route' ? `day-${routeKey}` : `theme-${category}-${region}-${query.trim()}`;
    if (fittedViewRef.current === viewKey) return;
    fittedViewRef.current = viewKey;
    if (points.length === 0) return;
    if (points.length === 1) {
      map.easeTo({ center: points[0]!.coordinates, zoom: mode === 'route' && dayNumber === 10 ? 9 : 12, duration: 550 });
    } else {
      const bounds = new maplibregl.LngLatBounds();
      points.forEach((stop) => bounds.extend(stop.coordinates));
      map.fitBounds(bounds, { padding: 55, maxZoom: mode === 'route' ? dayNumber === 7 ? 10 : 13 : 9, duration: 550 });
    }
  }, [day, dayNumber, routeKey, visibleStops, selectedStop.id, mode, category, region, query, visiblePlaces, selectedPlace?.id]);

  useEffect(() => {
    const container = containerRef.current;
    const map = mapRef.current;
    if (!container || !map) return;
    let width = container.clientWidth;
    let height = container.clientHeight;
    const observer = new ResizeObserver(() => {
      if (container.clientWidth === width && container.clientHeight === height) return;
      width = container.clientWidth;
      height = container.clientHeight;
      if (!width || !height) return;
      map.resize();
      const points = mode === 'route' ? visibleStops : visiblePlaces;
      if (points.length === 1) {
        map.easeTo({ center: points[0]!.coordinates, zoom: mode === 'route' && dayNumber === 10 ? 9 : 12, duration: 300 });
      } else if (points.length > 1) {
        const bounds = new maplibregl.LngLatBounds();
        points.forEach((point) => bounds.extend(point.coordinates));
        map.fitBounds(bounds, { padding: 55, maxZoom: mode === 'route' ? dayNumber === 7 ? 10 : 13 : 9, duration: 300 });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [mode, day, dayNumber, visibleStops, visiblePlaces]);

  const selectedIndex = useMemo(() => visibleStops.findIndex((stop) => stop.id === selectedStop.id), [selectedStop, visibleStops]);
  const activeLegs = activeVariant?.legs ?? day.legs;
  const activeNotes = activeVariant?.fieldNotes ?? day.fieldNotes;

  return <div className="japan-route-explorer">
    <div className="japan-route-explorer__head">
      <div><span>日本地点地图</span><h3>{mode === 'route' ? '按天查看车程与打卡点' : '按兴趣探索日本'}</h3></div>
      <p>{mode === 'route' ? '编号是地点顺序。底图显示位置，步行转角与实时公交请打开导航核对。' : '主题地点分布在不同城市，不代表 10 天游程中的连续行程。'}</p>
    </div>
    <div className="japan-route-modes" role="group" aria-label="地图浏览方式">
      <button type="button" aria-pressed={mode === 'route'} className={mode === 'route' ? 'is-active' : ''} onClick={() => setMode('route')}><TrainFront size={16} aria-hidden="true" />逐日路线</button>
      <button type="button" aria-pressed={mode === 'themes'} className={mode === 'themes' ? 'is-active' : ''} onClick={() => setMode('themes')}><MapPin size={16} aria-hidden="true" />主题地点</button>
    </div>
    {mode === 'route' ? <div className="japan-route-days" role="group" aria-label="选择行程日期">
      {japanFieldDays.map((item) => <button key={item.day} type="button" className={item.day === dayNumber ? 'is-active' : ''} aria-pressed={item.day === dayNumber} onClick={() => { setDayNumber(item.day); setVariantId(item.options?.[0]?.id ?? ''); setSelectedId(item.options ? item.options[0]!.stopIds[0]! : item.stops[0].id); }}>D{item.day}<span>{item.title}</span></button>)}
    </div> : <>
      <div className="japan-theme-categories" role="group" aria-label="筛选地点类别">
        {japanThemeCategories.map((item) => { const Icon = categoryIcons[item.id]; return <button key={item.id} type="button" className={category === item.id ? 'is-active' : ''} aria-pressed={category === item.id} onClick={() => { setCategory(item.id); setRegion('all'); setQuery(''); }}><Icon size={16} aria-hidden="true" />{item.label}<span>{japanThemePlaces.filter((place) => place.category === item.id).length}</span></button>; })}
      </div>
      <div className="japan-theme-filters">
        <label>地区<select value={region} onChange={(event) => setRegion(event.target.value as JapanRegion | 'all')}><option value="all">日本全域</option>{japanRegions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label className="japan-theme-search"><Search size={16} aria-hidden="true" /><span className="sr-only">搜索地点或作品</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索地点或作品" /></label>
      </div>
    </>}
    <div className="japan-route-explorer__body">
      <div className="japan-route-map-wrap">
        <div ref={containerRef} className="japan-route-map" aria-label={mode === 'route' ? `第 ${day.day} 天地点地图` : `${japanThemeCategories.find((item) => item.id === category)?.label}地点地图`} />
        {mapError && <div className="japan-route-map-fallback">地图底图暂时不可用。右侧地点和导航链接仍可使用。</div>}
      </div>
      <div className={`japan-route-panel${mode === 'themes' ? ' japan-route-panel--themes' : ''}`}>
        {mode === 'route' ? <>
        <div className="japan-route-panel__base"><strong>第 {day.day} 天 · {day.title}</strong><p>{day.base}</p></div>
        {day.options && <div className="japan-route-variants" role="group" aria-label="选择当天路线"><span>当天选一套</span>{day.options.map((option) => <button key={option.id} type="button" className={activeVariant?.id === option.id ? 'is-active' : ''} aria-pressed={activeVariant?.id === option.id} onClick={() => { setVariantId(option.id); setSelectedId(option.stopIds[0] ?? ''); }}>{option.label}</button>)}</div>}
        <ol className="japan-route-stops">{visibleStops.map((stop, index) => <li key={stop.id}><button type="button" className={stop.id === selectedStop.id ? 'is-active' : ''} onClick={() => { setSelectedId(stop.id); mapRef.current?.easeTo({ center: stop.coordinates, zoom: 14, duration: 500 }); }} aria-current={stop.id === selectedStop.id ? 'location' : undefined}><span>{index + 1}</span><span>{stop.name}<small>{stop.city}</small></span>{stop.photo && <Camera size={15} aria-label="有实景照片" />}</button></li>)}</ol>
        <div className="japan-route-focus">
          {selectedStop.photo && <figure><Image src={selectedStop.photo.src} alt={selectedStop.photo.alt} width={700} height={460} sizes="(max-width: 900px) 100vw, 380px" /><figcaption>实景参考 · <a href={selectedStop.photo.url} target="_blank" rel="noopener noreferrer">{selectedStop.photo.credit}</a></figcaption></figure>}
          <div className="japan-route-focus__content"><h4>{selectedStop.name}</h4><p>{selectedStop.arrival}</p><p><Camera size={15} aria-hidden="true" />{selectedStop.photoTip}</p><div className="japan-route-focus__actions"><a href={placeUrl(selectedStop)} target="_blank" rel="noopener noreferrer"><MapPin size={15} aria-hidden="true" />查看地图 <ExternalLink size={13} aria-hidden="true" /></a>{selectedIndex > 0 && <a href={directionsUrl(visibleStops[selectedIndex - 1]!, selectedStop, selectedStop.navigationMode ?? 'transit')} target="_blank" rel="noopener noreferrer"><Navigation2 size={15} aria-hidden="true" />{selectedStop.navigationMode === 'walking' ? '从上一站步行' : '从上一站乘车'} <ExternalLink size={13} aria-hidden="true" /></a>}</div></div>
        </div>
        </> : <>
          <div className="japan-route-panel__base" aria-live="polite"><strong>{japanThemeCategories.find((item) => item.id === category)?.label} · {visiblePlaces.length} 个地点</strong><p>选择地点可聚焦地图；跨城市移动请另查交通。</p></div>
          {visiblePlaces.length ? <ul className="japan-theme-list">{visiblePlaces.map((place) => <li key={place.id}><button type="button" className={place.id === selectedPlace?.id ? 'is-active' : ''} aria-current={place.id === selectedPlace?.id ? 'location' : undefined} onClick={() => { setSelectedPlaceId(place.id); mapRef.current?.easeTo({ center: place.coordinates, zoom: 13, duration: 500 }); }}><span>{place.name}<small>{place.city}{place.work ? ` · ${place.work}` : ''}</small></span><MapPin size={15} aria-hidden="true" /></button></li>)}</ul> : <div className="japan-theme-empty"><strong>没有找到地点</strong><p>试试其他地区或搜索词。</p><button type="button" onClick={() => { setRegion('all'); setQuery(''); }}>清除筛选</button></div>}
          {selectedPlace && <div className="japan-route-focus japan-theme-focus"><div className="japan-route-focus__content"><span className={`japan-theme-tag japan-theme-tag--${category}`}>{japanThemeCategories.find((item) => item.id === category)?.label}</span><h4>{selectedPlace.name}</h4>{selectedPlace.work && <p className="japan-theme-work">《{selectedPlace.work}》 · {selectedPlace.relation ? relationLabels[selectedPlace.relation] : '作品相关'}</p>}<p>{selectedPlace.context}</p><p><Camera size={15} aria-hidden="true" />{selectedPlace.visitTip}</p><div className="japan-route-focus__actions"><a href={themePlaceUrl(selectedPlace)} target="_blank" rel="noopener noreferrer"><MapPin size={15} aria-hidden="true" />查看地图 <ExternalLink size={13} aria-hidden="true" /></a>{selectedPlace.source && <a href={selectedPlace.source.url} target="_blank" rel="noopener noreferrer">{selectedPlace.source.label} <ExternalLink size={13} aria-hidden="true" /></a>}</div></div></div>}
        </>}
      </div>
    </div>
    {mode === 'route' ? <div className="japan-route-details">
      <div><TrainFront size={18} aria-hidden="true" /><h4>这一日怎么坐</h4></div>
      <ol>{activeLegs.map((leg) => <li key={`${leg.from}-${leg.to}`}><strong>{leg.from} → {leg.to}</strong><p>{leg.instruction}</p><small>{leg.fare} {leg.evidence && <a href={leg.evidence} target="_blank" rel="noopener noreferrer">{leg.evidenceLabel ?? '查实时信息'} <ExternalLink size={12} aria-hidden="true" /></a>}</small></li>)}</ol>
      <ul>{activeNotes.map((note) => <li key={note}>{note}</li>)}</ul>
    </div> : null}
    <p className="japan-route-explorer__source">{mode === 'route' ? '票价为成人单程参考，铁路搜索核验于 2026-10-22；新干线引用 SmartEX 标注的 2025-04-01 价格表。实际发车、停靠、票价、入口和施工绕行以运营商与当天导航为准。照片只用于对应景点展示，不代表实时现场。' : '地点标记用于定位场所周边，不代表精确拍摄机位或私人区域。动漫关联分为画面参考、故事舞台和作品相关，不代表版权方认证；部分画面经过艺术加工。出行前请核对场所开放、交通和现场摄影规则。'}地图底图由 OpenFreeMap 提供。 <a href="https://www.pexels.com/license/" target="_blank" rel="noopener noreferrer">查看照片许可</a></p>
  </div>;
}

function themePlaceUrl(place: JapanThemePlace) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.city}`)}`;
}
