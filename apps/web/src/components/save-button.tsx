'use client';

import { useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import type { PlaceSummary } from '@globeguide/domain';

import { copy } from '@/lib/copy';
import { readSaved, writeSaved } from '@/lib/saved';

export function SaveButton({ place }: { place: PlaceSummary }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const update = () => setSaved(readSaved().some((item) => item.id === place.id));
    update();
    window.addEventListener('globeguide:saved-change', update);
    return () => window.removeEventListener('globeguide:saved-change', update);
  }, [place.id]);

  function toggle() {
    const items = readSaved();
    writeSaved(saved ? items.filter((item) => item.id !== place.id) : [place, ...items.filter((item) => item.id !== place.id)]);
    setSaved(!saved);
  }

  return <button className={`save-button${saved ? ' save-button--active' : ''}`} type="button" onClick={toggle} aria-pressed={saved}>
    <Bookmark size={19} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />{saved ? copy.savedInBrowser : copy.save}
  </button>;
}
