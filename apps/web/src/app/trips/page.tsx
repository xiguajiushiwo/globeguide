import type { Metadata } from 'next';

import { TripPlanner } from '@/components/trip-planner';
import { copy } from '@/lib/copy';

import './trips.css';

export const metadata: Metadata = { title: copy.tripsTitle, robots: { index: false, follow: false } };

export default function TripsPage() {
  return <div className="shell content-page trips-page">
    <div className="trips-page__heading">
      <div><h1>{copy.tripsTitle}</h1><p className="page-intro">{copy.tripsIntro}</p></div>
    </div>
    <TripPlanner />
  </div>;
}
