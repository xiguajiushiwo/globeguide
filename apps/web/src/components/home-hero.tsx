'use client';

import { useEffect, useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

import { SearchForm } from '@/components/search-form';
import { copy } from '@/lib/copy';

type HeroSlide = { id: string; name: string; country: string; image: string };

export function HomeHero({ slides }: { slides: HeroSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (!isPlaying || slides.length < 2) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        setActiveIndex((index) => (index + 1) % slides.length);
      }
    }, 6500);
    return () => window.clearInterval(timer);
  }, [isPlaying, slides.length]);

  function move(direction: number) {
    setActiveIndex((index) => (index + direction + slides.length) % slides.length);
  }

  function togglePlayback() {
    setIsPlaying((value) => !value);
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    if ((event.target as Element).closest('a, button, form')) return;
    const touch = event.touches[0];
    if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    const start = touchStart.current;
    const touch = event.changedTouches[0];
    touchStart.current = null;
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) move(dx < 0 ? 1 : -1);
  }

  const activeSlide = slides[activeIndex];
  if (!activeSlide) return null;

  return (
    <section
      className="home-hero"
      aria-labelledby="home-title"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="home-hero__slides" aria-hidden="true">
        <div className="home-hero__track" style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}>
          {slides.map((slide, index) => (
            <div className="home-hero__slide" key={slide.id}>
              <Image src={slide.image} alt="" fill priority={index === 0} sizes="100vw" />
            </div>
          ))}
        </div>
      </div>
      <div className="home-hero__shade" />
      <div className="shell home-hero__content">
        <h1 id="home-title">{copy.heroTitle}</h1>
        <p>{copy.heroSubtitle}</p>
        <SearchForm prominent />
      </div>
      <div className="shell home-hero__footer">
        <Link className="home-hero__destination" href={`/destinations/${activeSlide.id}`}>
          <span>{activeSlide.name}, {activeSlide.country}</span>
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
        <div className="home-hero__controls" role="group" aria-label={copy.featuredLabel}>
          <button type="button" onClick={() => move(-1)} aria-label={copy.previousDestination} title={copy.previousDestination}>
            <ChevronLeft size={19} aria-hidden="true" />
          </button>
          <div className="home-hero__indicators">
            {slides.map((slide, index) => (
              <button
                className={index === activeIndex ? 'home-hero__indicator--active' : ''}
                type="button"
                key={slide.id}
                onClick={() => setActiveIndex(index)}
                aria-label={`${copy.showDestination} ${slide.name}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                title={slide.name}
              />
            ))}
          </div>
          <button type="button" onClick={() => move(1)} aria-label={copy.nextDestination} title={copy.nextDestination}>
            <ChevronRight size={19} aria-hidden="true" />
          </button>
          <button type="button" onClick={togglePlayback} aria-label={isPlaying ? copy.pauseSlideshow : copy.playSlideshow} title={isPlaying ? copy.pauseSlideshow : copy.playSlideshow}>
            {isPlaying ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </section>
  );
}
