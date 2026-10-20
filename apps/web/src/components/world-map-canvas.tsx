'use client';

import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import type { Destination } from '@globeguide/domain';
import 'maplibre-gl/dist/maplibre-gl.css';

type Props = {
  destinations: Destination[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onError: () => void;
  active: boolean;
};

const styleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';

function points(destinations: Destination[]) {
  return {
    type: 'FeatureCollection' as const,
    features: destinations.map((destination) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [destination.place.longitude, destination.place.latitude] },
      properties: { id: destination.place.id, name: destination.place.name },
    })),
  };
}

export function WorldMapCanvas({ destinations, selectedId, onSelect, onError, active }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const callbacks = useRef({ onSelect, onError });
  callbacks.current = { onSelect, onError };

  useEffect(() => {
    if (!container.current) return;
    let map: MapLibreMap;
    try {
      map = new maplibregl.Map({
        container: container.current,
        style: styleUrl,
        center: [38, 25],
        zoom: 1.45,
        minZoom: 1,
        maxZoom: 16,
        attributionControl: {},
      });
    } catch {
      callbacks.current.onError();
      return;
    }
    mapRef.current = map;
    let styleLoaded = false;
    const styleTimeout = window.setTimeout(() => {
      if (!styleLoaded) callbacks.current.onError();
    }, 12000);
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', () => {
      styleLoaded = true;
      window.clearTimeout(styleTimeout);
      map.addSource('destinations', { type: 'geojson', data: points(destinations), cluster: true, clusterRadius: 52, clusterMaxZoom: 6 });
      map.addLayer({ id: 'clusters', type: 'circle', source: 'destinations', filter: ['has', 'point_count'], paint: { 'circle-color': '#126f72', 'circle-radius': ['step', ['get', 'point_count'], 20, 10, 25, 25, 30], 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' } });
      map.addLayer({ id: 'cluster-count', type: 'symbol', source: 'destinations', filter: ['has', 'point_count'], layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 13, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'] }, paint: { 'text-color': '#ffffff' } });
      map.addLayer({ id: 'cities', type: 'circle', source: 'destinations', filter: ['!', ['has', 'point_count']], paint: { 'circle-color': '#cf6952', 'circle-radius': 8, 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' } });
      map.addLayer({ id: 'selected-city', type: 'circle', source: 'destinations', filter: ['==', ['get', 'id'], ''], paint: { 'circle-color': '#cf6952', 'circle-radius': 13, 'circle-stroke-width': 3, 'circle-stroke-color': '#17343a' } });
      map.on('click', 'clusters', (event) => {
        const feature = event.features?.[0];
        if (feature?.geometry.type !== 'Point') return;
        map.easeTo({ center: feature.geometry.coordinates as [number, number], zoom: Math.min(map.getZoom() + 2, 10), duration: 550 });
      });
      map.on('click', 'cities', (event) => {
        const id = event.features?.[0]?.properties?.id;
        if (typeof id === 'string') callbacks.current.onSelect(id);
      });
      for (const layer of ['clusters', 'cities']) {
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
      }
    });
    // Keep the list usable when an individual tile or glyph request fails.
    let styleFailed = false;
    map.on('error', (event) => {
      const message = String(event.error?.message ?? '').toLowerCase();
      if (!styleFailed && (message.includes('style') || message.includes('source'))) {
        styleFailed = true;
        callbacks.current.onError();
      }
    });
    return () => { window.clearTimeout(styleTimeout); mapRef.current = null; map.remove(); };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => (map.getSource('destinations') as GeoJSONSource | undefined)?.setData(points(destinations));
    if (map.isStyleLoaded()) update();
    else map.once('load', update);
  }, [destinations]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const destination = destinations.find((item) => item.place.id === selectedId);
    const focus = () => {
      if (map.getLayer('selected-city')) map.setFilter('selected-city', ['==', ['get', 'id'], selectedId ?? '']);
      if (destination) map.flyTo({ center: [destination.place.longitude, destination.place.latitude], zoom: Math.max(map.getZoom(), 5), speed: 1.2 });
    };
    if (map.isStyleLoaded()) focus();
    else map.once('load', focus);
  }, [selectedId, destinations]);

  useEffect(() => {
    if (active) window.setTimeout(() => mapRef.current?.resize(), 50);
  }, [active]);

  return <div className="map-canvas" ref={container} role="img" aria-label="Map of GlobeGuide destinations; use the adjacent list for keyboard access" />;
}
