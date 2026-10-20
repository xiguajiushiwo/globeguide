import Link from 'next/link';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { getDestination } from '@globeguide/domain';

import type { Story } from '@/lib/story-api';

export function StoryCard({ story, example = false }: { story: Story; example?: boolean }) {
  const destination = getDestination(story.destinationId);
  const title = story.title || story.body.slice(0, 60);
  return <article className="story-card">
    <div className="story-card__meta">
      <span className={`story-kind story-kind--${story.type}`}>{story.type === 'guide' ? 'Guide' : 'Travel journal'}</span>
      {example && <span className="story-card__editorial">GlobeGuide editorial example</span>}
    </div>
    <h3><Link href={`/stories/post/?id=${encodeURIComponent(story.id)}`}>{title}</Link></h3>
    <p>{story.body}</p>
    <div className="story-card__footer">
      <span><MapPin size={15} aria-hidden="true" />{destination ? `${destination.place.name} · ${destination.nameZh}` : 'Destination'}</span>
      <Link href={`/stories/post/?id=${encodeURIComponent(story.id)}`} aria-label={`Read ${title}`}><ArrowUpRight size={18} aria-hidden="true" /></Link>
    </div>
  </article>;
}
