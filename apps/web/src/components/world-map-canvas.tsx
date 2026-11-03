'use client';

import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import type { Destination } from '@globeguide/domain';
import 'maplibre-gl/dist/maplibre-gl.css';

type Props = {
  destinations: Destination[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onError: () => void;
  locateRequest: number;
  onLocationState: (state: 'idle' | 'loading' | 'located' | 'denied' | 'error') => void;
  active: boolean;
};

const styleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';

function points(destinations: Destination[]) {
  return {
    type: 'FeatureCollection' as const,
    features: destinations.map((destination) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [destination.place.longitude, destination.place.latitude] },
      properties: { id: destination.place.id, name: destination.place.name, nameZh: destination.nameZh },
    })),
  };
}

function userPoint(coordinates: [number, number]) {
  return {
    type: 'FeatureCollection' as const,
    features: [{ type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates }, properties: {} }],
  };
}

export function WorldMapCanvas({ destinations, selectedId, onSelect, onError, locateRequest, onLocationState, active }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const callbacks = useRef({ onSelect, onError });
  callbacks.current = { onSelect, onError };
  const locationCallbacks = useRef({ onLocationState });
  locationCallbacks.current = { onLocationState };
  const userLocationRef = useRef<[number, number] | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!locateRequest) return;
    if (!navigator.geolocation) {
      locationCallbacks.current.onLocationState('error');
      return;
    }
    locationCallbacks.current.onLocationState('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates: [number, number] = [position.coords.longitude, position.coords.latitude];
        userLocationRef.current = coordinates;
        setUserLocation(coordinates);
        locationCallbacks.current.onLocationState('located');
      },
      (error) => locationCallbacks.current.onLocationState(error.code === error.PERMISSION_DENIED ? 'denied' : 'error'),
      { enableHighAccuracy: false, maximumAge: 120000, timeout: 10000 },
    );
  }, [locateRequest]);

  useEffect(() => {
    if (!container.current) return;
    let map: MapLibreMap;
    try {
      // Next's static export does not expose MapLibre's bundled worker URL.
      // Serve the versioned worker from /public so the map can initialize on Pages.
      maplibregl.setWorkerUrl('/maplibre-gl-worker.js');
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
      map.addLayer({ id: 'cluster-count', type: 'symbol', source: 'destinations', filter: ['has', 'point_count'], layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 13, 'text-font': ['Noto Sans Bold'] }, paint: { 'text-color': '#ffffff' } });
      map.addLayer({ id: 'cities', type: 'circle', source: 'destinations', filter: ['!', ['has', 'point_count']], paint: { 'circle-color': '#cf6952', 'circle-radius': 8, 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' } });
      map.addLayer({
        id: 'city-labels',
        type: 'symbol',
        source: 'destinations',
        minzoom: 1,
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Bold'],
          'text-size': 12,
          'text-offset': [0, 1.7],
          'text-anchor': 'top',
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-color': '#17343a',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
        },
      });
      map.addLayer({ id: 'selected-city', type: 'circle', source: 'destinations', filter: ['==', ['get', 'id'], ''], paint: { 'circle-color': '#cf6952', 'circle-radius': 13, 'circle-stroke-width': 3, 'circle-stroke-color': '#17343a' } });
      map.addSource('user-location', { type: 'geojson', data: userPoint([0, 0]) });
      map.addLayer({ id: 'user-location-halo', type: 'circle', source: 'user-location', paint: { 'circle-color': '#3b82f6', 'circle-radius': 16, 'circle-opacity': .16, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2 } });
      map.addLayer({ id: 'user-location-dot', type: 'circle', source: 'user-location', paint: { 'circle-color': '#2563eb', 'circle-radius': 7, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2 } });
      map.setLayoutProperty('user-location-halo', 'visibility', 'none');
      map.setLayoutProperty('user-location-dot', 'visibility', 'none');
      if (userLocationRef.current) {
        map.setLayoutProperty('user-location-halo', 'visibility', 'visible');
        map.setLayoutProperty('user-location-dot', 'visibility', 'visible');
        (map.getSource('user-location') as GeoJSONSource).setData(userPoint(userLocationRef.current));
        map.flyTo({ center: userLocationRef.current, zoom: Math.max(map.getZoom(), 5), speed: 1.2 });
      }
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
    const map = mapRef.current;
    if (!map || !userLocation) return;
    const update = () => {
      const source = map.getSource('user-location') as GeoJSONSource | undefined;
      source?.setData(userPoint(userLocation));
      if (map.getLayer('user-location-halo')) map.setLayoutProperty('user-location-halo', 'visibility', 'visible');
      if (map.getLayer('user-location-dot')) map.setLayoutProperty('user-location-dot', 'visibility', 'visible');
      map.flyTo({ center: userLocation, zoom: Math.max(map.getZoom(), 5), speed: 1.2 });
    };
    if (map.isStyleLoaded()) update();
    else map.once('load', update);
  }, [userLocation]);

  useEffect(() => {
    if (active) window.setTimeout(() => mapRef.current?.resize(), 50);
  }, [active]);

  return <div className="map-canvas" ref={container} role="img" aria-label="Map of Wayella destinations; use the adjacent list for keyboard access" />;
}
