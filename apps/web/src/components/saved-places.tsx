'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Bookmark, Trash2 } from 'lucide-react';
import type { PlaceSummary } from '@globeguide/domain';

import { copy } from '@/lib/copy';
import { readSaved, writeSaved } from '@/lib/saved';

export function SavedPlaces() {
  const [items, setItems] = useState<PlaceSummary[] | null>(null);
  useEffect(() => {
    const update = () => setItems(readSaved());
    update();
    window.addEventListener('globeguide:saved-change', update);
    return () => window.removeEventListener('globeguide:saved-change', update);
  }, []);

  if (items === null) return null;
  if (items.length === 0) return <div className="empty-state"><Bookmark size={32} aria-hidden="true" /><p>{copy.savedEmpty}</p><Link className="text-link" href="/#destinations">{copy.savedEmptyAction}<ArrowUpRight size={18} aria-hidden="true" /></Link></div>;
  return <div className="saved-list">{items.map((place) => <div className="saved-item" key={place.id}>
    <Link href={`/destinations/${place.id}`}><span>{place.countryCode}</span><strong>{place.name}</strong><ArrowUpRight size={20} aria-hidden="true" /></Link>
    <button type="button" aria-label={`${copy.remove}: ${place.name}`} title={copy.remove} onClick={() => writeSaved(items.filter((item) => item.id !== place.id))}><Trash2 size={19} aria-hidden="true" /></button>
  </div>)}</div>;
}
