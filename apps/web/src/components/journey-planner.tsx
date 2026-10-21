'use client';

import { useEffect, useRef, useState } from 'react';
import { BookOpen, CalendarDays, Compass, MapPin, Route } from 'lucide-react';

const steps = [
  {
    icon: MapPin,
    eyebrow: 'Discover',
    title: 'Start with a place that feels like you.',
    description: 'Browse a living map of cities, neighborhoods and local notes before you commit to a route.',
    detail: '37 city entries ready to explore',
  },
  {
    icon: CalendarDays,
    eyebrow: 'Shape',
    title: 'Turn good finds into a day-by-day plan.',
    description: 'Save the places that catch your eye and arrange them into a route that leaves room for the unexpected.',
    detail: 'Drag less. See the whole day.',
  },
  {
    icon: Compass,
    eyebrow: 'Go',
    title: 'Keep the next good decision close.',
    description: 'Use practical context, opening hours and nearby ideas while you are already out in the city.',
    detail: 'Guidance for the moment you need it',
  },
  {
    icon: BookOpen,
    eyebrow: 'Share',
    title: 'Leave a better trail for the next traveler.',
    description: 'Publish a route, a small daily moment or the detail you wish someone had told you sooner.',
    detail: 'Travel notes from people who went',
  },
];

export function JourneyPlanner() {
  const sectionRef = useRef<HTMLElement>(null);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;

    const updateActiveStep = () => {
      frame = 0;
      const sectionRect = section.getBoundingClientRect();
      if (sectionRect.bottom < 0 || sectionRect.top > window.innerHeight) return;
      const target = window.innerHeight * 0.44;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;
      stepRefs.current.forEach((step, index) => {
        if (!step) return;
        const rect = step.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - target);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      setActiveStep((current) => current === closestIndex ? current : closestIndex);
    };

    const onScroll = () => {
      if (reducedMotion || frame) return;
      frame = window.requestAnimationFrame(updateActiveStep);
    };
    updateActiveStep();
    if (!reducedMotion) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
    }
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry && !entry.isIntersecting) setActiveStep(0);
    }, { threshold: 0 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const initialStep = steps[0]!;
  const active = steps[activeStep] ?? initialStep;

  return (
    <section className="journey-section" ref={sectionRef} aria-labelledby="journey-title">
      <div className="shell journey-section__inner">
        <div className="journey-section__visual-column">
          <div className="journey-section__visual-sticky">
            <div className={`journey-visual journey-visual--step-${activeStep}`} aria-live="polite">
              <div className="journey-visual__topline">
                <span><Route size={14} aria-hidden="true" /> GlobeGuide route</span>
                <span className="journey-visual__signal"><i /> Live canvas</span>
              </div>
              <div className="journey-visual__canvas">
                <div className="journey-visual__terrain journey-visual__terrain--one" />
                <div className="journey-visual__terrain journey-visual__terrain--two" />
                <div className="journey-visual__route-line" />
                <div className="journey-visual__pin journey-visual__pin--one"><MapPin size={17} aria-hidden="true" /></div>
                <div className="journey-visual__pin journey-visual__pin--two"><MapPin size={17} aria-hidden="true" /></div>
                <div className="journey-visual__pin journey-visual__pin--three"><MapPin size={17} aria-hidden="true" /></div>
                <div className="journey-visual__place-card journey-visual__place-card--main">
                  <span>Today</span><strong>{activeStep === 0 ? 'Tokyo, Japan' : activeStep === 1 ? 'Kyoto, Japan' : activeStep === 2 ? 'Shibuya walk' : 'A note from Kyoto'}</strong>
                </div>
                <div className="journey-visual__place-card journey-visual__place-card--small">
                  <span>{activeStep === 3 ? 'Shared by' : 'Next stop'}</span><strong>{activeStep === 3 ? 'Mina · 4 min read' : '09:40 · 2.4 km'}</strong>
                </div>
                <div className="journey-visual__compass"><Compass size={18} aria-hidden="true" /></div>
              </div>
              <div className="journey-visual__footer">
                <div><span className="journey-visual__footer-label">{active.eyebrow}</span><strong>{active.detail}</strong></div>
                <div className="journey-visual__progress" aria-label={`Step ${activeStep + 1} of ${steps.length}`}>
                  {steps.map((step, index) => <i className={index <= activeStep ? 'is-active' : ''} key={step.eyebrow} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="journey-section__steps">
          <p className="journey-section__eyebrow">A better way to travel</p>
          <h2 id="journey-title">The trip takes shape as you move.</h2>
          <p className="journey-section__intro">GlobeGuide keeps discovery, planning and real-world notes in one calm flow, so a trip can stay open until you are ready to go.</p>
          <div className="journey-steps">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return <article
                className={`journey-step${index === activeStep ? ' is-active' : ''}`}
                key={step.eyebrow}
                ref={(element) => { stepRefs.current[index] = element; }}
                onMouseEnter={() => setActiveStep(index)}
              >
                <button type="button" onClick={() => setActiveStep(index)} aria-pressed={index === activeStep}>
                  <span className="journey-step__icon"><Icon size={19} aria-hidden="true" /></span>
                  <span className="journey-step__copy"><span className="journey-step__eyebrow">{step.eyebrow}</span><strong>{step.title}</strong><span>{step.description}</span></span>
                  <span className="journey-step__mark" aria-hidden="true" />
                </button>
              </article>;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
