'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const page = document.querySelector<HTMLElement>('.page-transition');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;

    function updateHomeScene() {
      if (!page || pathname !== '/' || prefersReducedMotion) return;
      const viewportHeight = window.innerHeight || 1;
      const progressFor = (element: Element | null) => {
        if (!element) return 0;
        const rect = element.getBoundingClientRect();
        return Math.min(1, Math.max(0, (viewportHeight - rect.top) / (viewportHeight + rect.height)));
      };
      const hero = page.querySelector<HTMLElement>('.home-hero');
      const heroProgress = hero ? Math.min(1, Math.max(0, window.scrollY / Math.max(hero.offsetHeight, 1))) : 0;
      const destinationProgress = progressFor(page.querySelector('.destinations-section'));
      const exploreProgress = progressFor(page.querySelector('.home-explore'));
      const storiesProgress = progressFor(page.querySelector('.home-stories'));
      page.style.setProperty('--hero-shift', `${Math.round(heroProgress * -42)}px`);
      page.style.setProperty('--destination-progress', destinationProgress.toFixed(3));
      page.style.setProperty('--destination-drift', `${Math.round((0.5 - destinationProgress) * 14)}px`);
      page.style.setProperty('--explore-progress', exploreProgress.toFixed(3));
      page.style.setProperty('--explore-opacity', (0.12 + exploreProgress * 0.22).toFixed(3));
      page.style.setProperty('--explore-dot-opacity', (0.25 + exploreProgress * 0.75).toFixed(3));
      page.style.setProperty('--stories-progress', storiesProgress.toFixed(3));
      frame = 0;
    }

    function handleScroll() {
      if (frame || pathname !== '/' || prefersReducedMotion) return;
      frame = window.requestAnimationFrame(updateHomeScene);
    }

    if (pathname === '/' && !prefersReducedMotion) {
      updateHomeScene();
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleScroll, { passive: true });
    }

    const cleanupHomeScene = () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      page?.style.removeProperty('--hero-shift');
      page?.style.removeProperty('--destination-progress');
      page?.style.removeProperty('--destination-drift');
      page?.style.removeProperty('--explore-progress');
      page?.style.removeProperty('--explore-opacity');
      page?.style.removeProperty('--explore-dot-opacity');
      page?.style.removeProperty('--stories-progress');
    };

    const selector = [
      '.section-heading', '.destination-card', '.home-explore__inner',
      '.home-explore__intro', '.home-explore__cities', '.home-explore__cities a',
      '.home-stories', '.home-stories .destination-stories__heading',
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

    if (prefersReducedMotion) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return () => {
        elements.forEach((element) => {
          element.classList.remove('scroll-reveal', 'is-visible');
          element.style.removeProperty('--reveal-delay');
        });
        cleanupHomeScene();
      };
    }

    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return () => {
        elements.forEach((element) => {
          element.classList.remove('scroll-reveal', 'is-visible');
          element.style.removeProperty('--reveal-delay');
        });
        cleanupHomeScene();
      };
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
      cleanupHomeScene();
    };
  }, [pathname]);

  return <div className="page-transition" key={pathname}>{children}</div>;
}
