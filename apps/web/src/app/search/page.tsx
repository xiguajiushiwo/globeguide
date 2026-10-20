import type { Metadata } from 'next';
import { Suspense } from 'react';

import { SearchForm } from '@/components/search-form';
import { copy } from '@/lib/copy';
import { SearchResults } from './search-results';

export const metadata: Metadata = { title: copy.searchResults, robots: { index: false, follow: false } };

export default function SearchPage() {
  return <Suspense fallback={<div className="shell content-page search-page"><h1>{copy.allDestinations}</h1><SearchForm /><p className="empty-state" role="status">{copy.loadingDestinations}</p></div>}><SearchResults /></Suspense>;
}
