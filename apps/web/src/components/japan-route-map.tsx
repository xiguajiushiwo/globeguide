'use client';

import Image from 'next/image';
import { Camera, ExternalLink, MapPin, Navigation2, TrainFront } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';
import { japanFieldDays, type JapanStop } from '@/lib/japan-field-guide';
import 'maplibre-gl/dist/maplibre-gl.css';

const mapStyle = process.env.NEXT_PUBLIC_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';

function placeUrl(stop: JapanStop) {
  return `https://www.google.com/maps/search/?api=1&query=${stop.coordinates[1]},${stop.coordinates[0]}`;
}

function directionsUrl(from: JapanStop, to: JapanStop) {
  return `https://www.google.com/maps/dir/?api=1&origin=${from.coordinates[1]},${from.coordinates[0]}&destination=${to.coordinates[1]},${to.coordinates[0]}&travelmode=walking`;
}

export function JapanRouteMap() {
  const [dayNumber, setDayNumber] = useState(3);
  const [selectedId, setSelectedId] = useState('shibuya');
  const [mapError, setMapError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const fittedDayRef = useRef<number | null>(null);
  const day = japanFieldDays.find((item) => item.day === dayNumber) ?? japanFieldDays[0];
  const selectedStop = day.stops.find((stop) => stop.id === selectedId) ?? day.stops[0];

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
        fittedDayRef.current = null;
      };
    } catch {
      setMapError(true);
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = day.stops.map((stop, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `japan-route-pin${stop.id === selectedId ? ' is-selected' : ''}`;
      button.textContent = String(index + 1);
      button.setAttribute('aria-label', `${index + 1}. ${stop.name}`);
      button.title = stop.name;
      button.addEventListener('click', () => setSelectedId(stop.id));
      return new maplibregl.Marker({ element: button, anchor: 'bottom' }).setLngLat(stop.coordinates).addTo(map);
    });
    if (fittedDayRef.current === dayNumber) return;
    fittedDayRef.current = dayNumber;
    if (day.stops.length === 1) {
      map.easeTo({ center: day.stops[0].coordinates, zoom: dayNumber === 10 ? 9 : 12, duration: 550 });
    } else {
      const bounds = new maplibregl.LngLatBounds();
      day.stops.forEach((stop) => bounds.extend(stop.coordinates));
      map.fitBounds(bounds, { padding: 64, maxZoom: dayNumber === 7 ? 10 : 13, duration: 550 });
    }
  }, [day, dayNumber, selectedId]);

  const selectedIndex = useMemo(() => day.stops.findIndex((stop) => stop.id === selectedStop.id), [day, selectedStop]);

  return <div className="japan-route-explorer">
    <div className="japan-route-explorer__head">
      <div><span>可操作路线图</span><h3>按天查看车程与打卡点</h3></div>
      <p>编号是地点顺序。底图显示位置，步行转角与实时公交请打开导航核对。</p>
    </div>
    <div className="japan-route-days" role="group" aria-label="选择行程日期">
      {japanFieldDays.map((item) => <button key={item.day} type="button" className={item.day === dayNumber ? 'is-active' : ''} aria-pressed={item.day === dayNumber} onClick={() => { setDayNumber(item.day); setSelectedId(item.stops[0].id); }}>D{item.day}<span>{item.title}</span></button>)}
    </div>
    <div className="japan-route-explorer__body">
      <div className="japan-route-map-wrap">
        <div ref={containerRef} className="japan-route-map" aria-label={`第 ${day.day} 天地点地图`} />
        {mapError && <div className="japan-route-map-fallback">地图底图暂时不可用。右侧地点和导航链接仍可使用。</div>}
      </div>
      <div className="japan-route-panel">
        <div className="japan-route-panel__base"><strong>第 {day.day} 天 · {day.title}</strong><p>{day.base}</p></div>
        <ol className="japan-route-stops">{day.stops.map((stop, index) => <li key={stop.id}><button type="button" className={stop.id === selectedStop.id ? 'is-active' : ''} onClick={() => { setSelectedId(stop.id); mapRef.current?.easeTo({ center: stop.coordinates, zoom: 14, duration: 500 }); }} aria-current={stop.id === selectedStop.id ? 'location' : undefined}><span>{index + 1}</span><span>{stop.name}<small>{stop.city}</small></span>{stop.photo && <Camera size={15} aria-label="有实景照片" />}</button></li>)}</ol>
        <div className="japan-route-focus">
          {selectedStop.photo && <figure><Image src={selectedStop.photo.src} alt={selectedStop.photo.alt} width={700} height={460} sizes="(max-width: 900px) 100vw, 380px" /><figcaption>实景参考 · <a href={selectedStop.photo.url} target="_blank" rel="noopener noreferrer">{selectedStop.photo.credit}</a></figcaption></figure>}
          <div className="japan-route-focus__content"><h4>{selectedStop.name}</h4><p>{selectedStop.arrival}</p><p><Camera size={15} aria-hidden="true" />{selectedStop.photoTip}</p><div className="japan-route-focus__actions"><a href={placeUrl(selectedStop)} target="_blank" rel="noopener noreferrer"><MapPin size={15} aria-hidden="true" />查看地图 <ExternalLink size={13} aria-hidden="true" /></a>{selectedIndex > 0 && <a href={directionsUrl(day.stops[selectedIndex - 1]!, selectedStop)} target="_blank" rel="noopener noreferrer"><Navigation2 size={15} aria-hidden="true" />从上一站导航 <ExternalLink size={13} aria-hidden="true" /></a>}</div></div>
        </div>
      </div>
    </div>
    <div className="japan-route-details">
      <div><TrainFront size={18} aria-hidden="true" /><h4>这一日怎么坐</h4></div>
      <ol>{day.legs.map((leg) => <li key={`${leg.from}-${leg.to}`}><strong>{leg.from} → {leg.to}</strong><p>{leg.instruction}</p><small>{leg.fare} {leg.evidence && <a href={leg.evidence} target="_blank" rel="noopener noreferrer">{leg.evidenceLabel ?? '查实时信息'} <ExternalLink size={12} aria-hidden="true" /></a>}</small></li>)}</ol>
      <ul>{day.fieldNotes.map((note) => <li key={note}>{note}</li>)}</ul>
    </div>
    <p className="japan-route-explorer__source">票价为成人单程参考，铁路搜索核验于 2026-10-22；新干线引用 SmartEX 标注的 2025-04-01 价格表。实际发车、停靠、票价、入口和施工绕行以运营商与当天导航为准。地图点位使用 Photon / OpenStreetMap 地理编码核对；底图由 OpenFreeMap 提供。照片只用于对应景点展示，不代表实时现场。<a href="https://www.pexels.com/license/" target="_blank" rel="noopener noreferrer">查看照片许可</a></p>
  </div>;
}
