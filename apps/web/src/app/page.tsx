import Link from 'next/link';
import { ArrowRight, MapPinned } from 'lucide-react';

import { DestinationCard } from '@/components/destination-card';
import { HomeHero } from '@/components/home-hero';
import { HomeStories } from '@/components/home-stories';
import { JourneyPlanner } from '@/components/journey-planner';
import { copy } from '@/lib/copy';
import { featured } from '@/lib/places';
import { destinationCatalog } from '@globeguide/domain';

const chinaHighlights = ['Beijing', "Xi'an", 'Chengdu', 'Shanghai', 'Guangzhou', 'Hong Kong']
  .map((name) => destinationCatalog.find((destination) => destination.place.name === name))
  .filter((destination): destination is (typeof destinationCatalog)[number] => Boolean(destination));

export default function HomePage() {
  const heroSlides = [...featured.slice(1), featured[0]].filter((slide): slide is (typeof featured)[number] => Boolean(slide));

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
      <JourneyPlanner />
      <section className="home-explore" aria-labelledby="home-explore-title">
        <div className="shell home-explore__inner">
          <div className="home-explore__intro">
            <span className="home-explore__eyebrow">Explore by place</span>
            <h2 id="home-explore-title">Across China, city by city</h2>
            <p>Find all 31 mainland provincial centers, plus Hong Kong, Macau and Taipei. Start with the city, then explore nearby stories and ideas.</p>
            <Link className="home-explore__map-link" href="/map/?region=mainland"><MapPinned size={19} aria-hidden="true" /> Explore the map <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
          <div className="home-explore__cities" aria-label="Selected cities in China">
            {chinaHighlights.map((destination) => <Link key={destination.place.id} href={`/destinations/${destination.place.id}/`}>
              <span>{destination.place.name}<small>{destination.nameZh}</small></span><ArrowRight size={18} aria-hidden="true" />
            </Link>)}
            <Link className="home-explore__all" href="/map/?region=mainland">Browse every city <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>
      <HomeStories />
    </>
  );
}
