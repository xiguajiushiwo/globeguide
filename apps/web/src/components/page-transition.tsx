'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const selector = [
      '.section-heading', '.destination-card', '.home-explore__inner',
      '.content-page', '.auth-page', '.map-page', '.place-content__heading', '.fact', '.guide-section',
      '.guide-entry', '.source-strip', '.saved-item', '.stories-heading',
      '.notes-featured', '.notes-latest', '.story-detail', '.story-compose',
      '.story-dashboard-row', '.story-review-item',
      '.trip-planner',
    ].join(', ');
    const elements = Array.from(document.querySelectorAll<HTMLElement>(`.page-transition ${selector}`));
    elements.forEach((element, index) => {
      element.classList.add('scroll-reveal');
      element.style.setProperty('--reveal-delay', `${Math.min(index, 7) * 45}ms`);
    });

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return () => elements.forEach((element) => {
        element.classList.remove('scroll-reveal', 'is-visible');
        element.style.removeProperty('--reveal-delay');
      });
    }

    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return () => elements.forEach((element) => {
        element.classList.remove('scroll-reveal', 'is-visible');
        element.style.removeProperty('--reveal-delay');
      });
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    elements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      elements.forEach((element) => {
        element.classList.remove('scroll-reveal', 'is-visible');
        element.style.removeProperty('--reveal-delay');
      });
    };
  }, [pathname]);

  return <div className="page-transition" key={pathname}>{children}</div>;
}
