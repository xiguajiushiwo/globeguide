import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Clock3, Compass, MapPin } from 'lucide-react';
import { getDestination } from '@globeguide/domain';

import type { Story } from '@/lib/story-api';
import { SocialActions } from './social-actions';

function readMinutes(body: string): number {
  return Math.max(1, Math.ceil(body.trim().split(/\s+/).filter(Boolean).length / 190));
}

const fallbackCovers = ['/images/paris.jpg', '/images/tokyo.jpg', '/images/new-york.jpg'];

function fallbackCover(id: string): string {
  const score = id.split('').reduce((total, character) => total + character.charCodeAt(0), 0);
  return fallbackCovers[score % fallbackCovers.length] ?? '/images/paris.jpg';
}

export function StoryCard({ story, example = false, featured = false, authenticated = false }: { story: Story; example?: boolean; featured?: boolean; authenticated?: boolean }) {
  const destination = getDestination(story.destinationId);
  const title = story.title || story.body.slice(0, 60);
  const coverImage = story.coverImage ?? destination?.image ?? fallbackCover(story.destinationId);
  const destinationName = destination?.place.name ?? 'Destination';
  const authorName = example ? 'Wayella Editorial' : story.author.displayName;
  const format = story.format ?? 'text';
  const mediaPreview = story.mediaUrls?.[0];
  const formatLabel = format === 'video' ? 'Video' : format === 'gallery' ? 'Photo set' : format === 'live' ? 'Live' : story.type === 'guide' ? 'Guide' : 'Moment';
  return <article className={`story-card${featured ? ' story-card--featured' : ''}${example ? ' story-card--editorial' : ''}`}>
    <Link className="story-card__media" href={`/stories/post/?id=${encodeURIComponent(story.id)}`} aria-label={`Read ${title}`}>
      {format === 'video' && mediaPreview ? <video src={mediaPreview} muted playsInline preload="metadata" aria-label={`${destinationName} travel video`} />
        : format === 'gallery' && mediaPreview ? <img src={mediaPreview} alt={`${destinationName} travel photo`} />
        : <Image src={coverImage} alt={`${destinationName} travel note`} fill sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw" />}
      <span className={`story-kind story-kind--${story.type}`}>{formatLabel}</span>
      <span className="story-card__open" aria-hidden="true"><ArrowUpRight size={17} /></span>
    </Link>
    <div className="story-card__body">
      <div className="story-card__location"><MapPin size={14} aria-hidden="true" />{destinationName}</div>
      <h3><Link href={`/stories/post/?id=${encodeURIComponent(story.id)}`}>{title}</Link></h3>
      <p>{story.body}</p>
      <div className="story-card__footer">
        <span className="story-card__author"><span className={`story-card__avatar${example ? ' story-card__avatar--editorial' : ''}`} aria-hidden="true">{example ? <Compass size={15} strokeWidth={2.2} /> : authorName.slice(0, 1)}</span><Link href={example ? `/stories/post/?id=${encodeURIComponent(story.id)}` : `/profiles/?id=${encodeURIComponent(story.author.id)}`}>{authorName}</Link></span>
        <span className="story-card__read"><Clock3 size={13} aria-hidden="true" />{readMinutes(story.body)} min</span>
      </div>
      {!example && <SocialActions postId={story.id} authenticated={authenticated} initial={{ liked: false, bookmarked: false, counts: { likes: 0, bookmarks: 0, shares: 0, comments: 0 } }} />}
    </div>
    {example && story.sourceUrl && <a className="story-card__source" href={story.sourceUrl} target="_blank" rel="noreferrer">{story.sourceLabel ?? 'Reference source'} <ArrowUpRight size={13} aria-hidden="true" /></a>}
  </article>;
}
