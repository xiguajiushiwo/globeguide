import type { Metadata } from 'next';

import { SavedPlaces } from '@/components/saved-places';
import { copy } from '@/lib/copy';

export const metadata: Metadata = { title: copy.savedTitle };

export default function SavedPage() {
  return <div className="shell content-page saved-page"><h1>{copy.savedTitle}</h1><p className="page-intro">{copy.browserOnly}</p><SavedPlaces /></div>;
}
