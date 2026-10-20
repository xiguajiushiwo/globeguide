'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { StoryCard } from './story-card';
import { editorialExamples } from '@/lib/story-examples';
import { listStories } from '@/lib/story-api';
import type { Story } from '@/lib/story-api';


export function HomeStories() {
  const [items, setItems] = useState<Story[]>([]);
  useEffect(() => {
    let active = true;
    listStories().then((data) => { if (active) setItems(data.items.slice(0, 3)); }).catch(() => {});
    return () => { active = false; };
  }, []);
  const visible = [...items, ...editorialExamples].slice(0, 3);
  return <section className="home-stories shell" aria-labelledby="home-stories-title">
    <div className="destination-stories__heading"><div><p className="stories-eyebrow">Travel Notes</p>
      <h2 id="home-stories-title">Notes worth taking along</h2></div>
      <Link href="/stories/">All notes <ArrowRight size={16} aria-hidden="true" /></Link></div>
    <div className="stories-grid">{visible.map((story) => <StoryCard key={story.id} story={story} example={story.id.startsWith('editorial-')} />)}</div>
  </section>;
}
