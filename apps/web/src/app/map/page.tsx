import type { Metadata } from 'next';
import { Suspense } from 'react';

import { MapExplorer } from '@/components/map-explorer';
import './map.css';

export const metadata: Metadata = {
  title: 'World map',
  description: 'Explore Wayella destinations on an interactive world map.',
};

export default function MapPage() {
  return <Suspense fallback={<div className="shell map-page"><h1>Explore the world</h1><p>Loading destinations…</p></div>}><MapExplorer /></Suspense>;
}
