import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { DestinationCard } from '@/components/destination-card';
import { HomeHero } from '@/components/home-hero';
import { copy } from '@/lib/copy';
import { featured } from '@/lib/places';

export default function HomePage() {
  const heroSlides = [...featured.slice(1), featured[0]];

  return (
    <>
      <HomeHero slides={heroSlides} />
      <section className="destinations-section shell" id="destinations" aria-labelledby="destinations-title">
        <div className="section-heading">
          <div><h2 id="destinations-title">{copy.featuredTitle}</h2><p>{copy.featuredIntro}</p></div>
          <Link className="text-link" href="/search?q=">{copy.allDestinations}<ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
        <div className="destination-grid">{featured.map((city) => <DestinationCard key={city.id} {...city} />)}</div>
      </section>
    </>
  );
}
