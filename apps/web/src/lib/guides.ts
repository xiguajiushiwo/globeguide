import { placeSummarySchema } from '@globeguide/domain';
import type { PlaceSummary } from '@globeguide/domain';

export type GuideSource = {
  id: string;
  label: string;
  url: string;
  checkedAt: string;
};

export type GuideItem = {
  id: string;
  title: string;
  description: string;
  kind: 'fact' | 'editorial';
  sourceId?: string;
};

export type CityGuide = {
  place: PlaceSummary;
  country: string;
  image: string;
  aliases: string[];
  intro: string;
  sections: GuideItem[];
  highlights: GuideItem[];
  sources: GuideSource[];
};

const checkedAt = '2026-10-20';
const updatedAt = `${checkedAt}T00:00:00.000Z`;

export const guides: CityGuide[] = [
  {
    place: placeSummarySchema.parse({
      id: '11111111-1111-4111-8111-111111111111', name: 'Tokyo', countryCode: 'JP',
      latitude: 35.6762, longitude: 139.6503, locale: 'en', timeZone: 'Asia/Tokyo',
      currency: 'JPY', updatedAt, sourceLabel: 'GlobeGuide editorial guide',
    }),
    country: 'Japan', image: '/images/tokyo.jpg', aliases: ['Tokio', '東京', '東京市'],
    intro: 'A city of distinct neighborhoods: temple lanes, busy station districts, gardens, and contemporary towers. Build each day around one area so your time goes into the city rather than crossing it.',
    sections: [
      { id: 'tokyo-orientation', title: 'Find your starting point', description: 'Asakusa suits a traditional streets-and-temples day; Shinjuku and Shibuya suit an urban evening. Group nearby stops into the same day.', kind: 'editorial' },
      { id: 'tokyo-transit', title: 'Getting around', description: 'Tokyo Metro publishes its route map, station information, fares, and current service notices. Check the route and last connection before setting out.', kind: 'fact', sourceId: 'tokyo-metro' },
      { id: 'tokyo-arrival', title: 'Arriving at Narita', description: 'Narita Airport publishes current ground transport details. Check the airport on your ticket before choosing a transfer.', kind: 'fact', sourceId: 'narita-airport' },
      { id: 'tokyo-haneda', title: 'Arriving at Haneda', description: 'Haneda Airport publishes terminal and ground transport information on its own site. Check your arrival terminal before travel.', kind: 'fact', sourceId: 'haneda-airport' },
      { id: 'tokyo-access', title: 'Access needs', description: 'Tokyo Metro publishes station accessibility information. Check the stations on your route for lifts and other facilities before travel.', kind: 'fact', sourceId: 'tokyo-metro' },
      { id: 'tokyo-practical', title: 'Before you go', description: 'The Japan National Tourism Organization maintains practical visitor information, including transport and travel basics. Review its current guidance close to departure.', kind: 'fact', sourceId: 'jnto' },
    ],
    highlights: [
      { id: 'tokyo-sensoji', title: 'Sensō-ji', description: 'Explore the temple grounds and the surrounding Asakusa streets. Check the temple’s own visitor information before your visit.', kind: 'fact', sourceId: 'sensoji' },
      { id: 'tokyo-skytree', title: 'Tokyo Skytree', description: 'An observation stop with a broad view across the city. Check the official site for current admission and opening information.', kind: 'fact', sourceId: 'skytree' },
      { id: 'tokyo-national-museum', title: 'Tokyo National Museum', description: 'Use the museum’s official site to choose exhibitions and check access before visiting Ueno.', kind: 'fact', sourceId: 'tokyo-national-museum' },
      { id: 'tokyo-shibuya', title: 'Shibuya on foot', description: 'Leave time to wander the side streets beyond the crossing instead of making it a quick photo stop.', kind: 'editorial' },
      { id: 'tokyo-ueno', title: 'Ueno afternoon', description: 'Pair a museum visit with time outdoors around Ueno rather than scheduling several distant stops.', kind: 'editorial' },
    ],
    sources: [
      { id: 'tokyo-metro', label: 'Tokyo Metro', url: 'https://www.tokyometro.jp/en/index.html', checkedAt },
      { id: 'jnto', label: 'Japan National Tourism Organization', url: 'https://www.japan.travel/en/plan/', checkedAt },
      { id: 'narita-airport', label: 'Narita International Airport', url: 'https://www.narita-airport.jp/en/', checkedAt },
      { id: 'haneda-airport', label: 'Haneda Airport', url: 'https://tokyo-haneda.com/en/', checkedAt },
      { id: 'sensoji', label: 'Sensō-ji', url: 'https://www.senso-ji.jp/english/', checkedAt },
      { id: 'skytree', label: 'Tokyo Skytree', url: 'https://www.tokyoskytree.jp/en/', checkedAt },
      { id: 'tokyo-national-museum', label: 'Tokyo National Museum', url: 'https://www.tnm.jp/?lang=en', checkedAt },
    ],
  },
  {
    place: placeSummarySchema.parse({
      id: '22222222-2222-4222-8222-222222222222', name: 'Paris', countryCode: 'FR',
      latitude: 48.8566, longitude: 2.3522, locale: 'en', timeZone: 'Europe/Paris',
      currency: 'EUR', updatedAt, sourceLabel: 'GlobeGuide editorial guide',
    }),
    country: 'France', image: '/images/paris.jpg', aliases: ['París', '巴黎', 'City of Light'],
    intro: 'Paris rewards unhurried days. Pair one major museum or monument with a neighborhood walk, then leave room for the streets, gardens, and riverbanks between them.',
    sections: [
      { id: 'paris-orientation', title: 'Plan by neighborhood', description: 'The Louvre, the Seine, and the Marais can make a walkable central day. Save a separate half-day for a larger museum visit.', kind: 'editorial' },
      { id: 'paris-transit', title: 'Getting around', description: 'RATP publishes route planning, network maps, fares, and service updates for its transport network. Confirm the current route before travel.', kind: 'fact', sourceId: 'ratp' },
      { id: 'paris-arrival', title: 'Arriving by air', description: 'Paris Aéroport publishes terminal and ground transport details for the airports it operates. Confirm your airport and terminal before choosing a transfer.', kind: 'fact', sourceId: 'paris-airport' },
      { id: 'paris-access', title: 'Access needs', description: 'The Louvre publishes detailed accessibility information for its galleries and entrances. Check facilities for the site you plan to visit.', kind: 'fact', sourceId: 'louvre-access' },
      { id: 'paris-practical', title: 'Before you go', description: 'The Paris Tourist Office provides current visitor guidance and event information. Check it for changes near your travel dates.', kind: 'fact', sourceId: 'paris-tourism' },
    ],
    highlights: [
      { id: 'paris-louvre', title: 'Musée du Louvre', description: 'Choose a few collections in advance; the museum’s own site has current exhibitions, access information, and tickets.', kind: 'fact', sourceId: 'louvre' },
      { id: 'paris-eiffel', title: 'Eiffel Tower', description: 'Check the monument’s official site for visitor access and current ticket availability before building a day around it.', kind: 'fact', sourceId: 'eiffel' },
      { id: 'paris-versailles', title: 'Versailles day trip', description: 'A substantial trip beyond central Paris. Check the palace’s official site for current visiting information before committing a day.', kind: 'fact', sourceId: 'versailles' },
      { id: 'paris-seine', title: 'Walk by the Seine', description: 'Follow a stretch of the river at your own pace and connect it to the neighborhood you want to explore next.', kind: 'editorial' },
      { id: 'paris-marais', title: 'Le Marais streets', description: 'Set aside an unhurried walk through smaller streets and public squares between major sights.', kind: 'editorial' },
    ],
    sources: [
      { id: 'ratp', label: 'RATP', url: 'https://www.ratp.fr/en', checkedAt },
      { id: 'paris-tourism', label: 'Paris Tourist Office', url: 'https://parisjetaime.com/eng/', checkedAt },
      { id: 'paris-airport', label: 'Paris Aéroport', url: 'https://www.parisaeroport.fr/en/', checkedAt },
      { id: 'louvre', label: 'Musée du Louvre', url: 'https://www.louvre.fr/en', checkedAt },
      { id: 'louvre-access', label: 'Musée du Louvre accessibility', url: 'https://www.louvre.fr/en/visit/accessibility', checkedAt },
      { id: 'eiffel', label: 'Eiffel Tower', url: 'https://www.toureiffel.paris/en', checkedAt },
      { id: 'versailles', label: 'Palace of Versailles', url: 'https://www.chateauversailles.fr/', checkedAt },
    ],
  },
  {
    place: placeSummarySchema.parse({
      id: '33333333-3333-4333-8333-333333333333', name: 'New York', countryCode: 'US',
      latitude: 40.7128, longitude: -74.006, locale: 'en', timeZone: 'America/New_York',
      currency: 'USD', updatedAt, sourceLabel: 'GlobeGuide editorial guide',
    }),
    country: 'United States', image: '/images/new-york.jpg', aliases: ['NYC', 'New York City', 'Big Apple', '纽约'],
    intro: 'New York is best understood one neighborhood at a time. Mix a major landmark with smaller streets and a park or waterfront, and allow for the scale of getting between boroughs.',
    sections: [
      { id: 'new-york-orientation', title: 'Choose a daily area', description: 'Pair nearby places instead of hopping across the city: a Midtown day feels different from a Lower Manhattan or Brooklyn day.', kind: 'editorial' },
      { id: 'new-york-transit', title: 'Getting around', description: 'The MTA publishes subway and bus maps, fare information, and live service changes. Check the route before you travel.', kind: 'fact', sourceId: 'mta' },
      { id: 'new-york-arrival', title: 'Arriving by air', description: 'JFK Airport publishes current ground transport and terminal information. Check your arrival airport before planning the trip into the city.', kind: 'fact', sourceId: 'jfk-airport' },
      { id: 'new-york-access', title: 'Access needs', description: 'The MTA publishes accessibility information for its stations and vehicles. Check each part of the route, especially during service changes.', kind: 'fact', sourceId: 'mta-access' },
      { id: 'new-york-practical', title: 'Before you go', description: 'New York City Tourism maintains planning information for visitors. Use its current guidance for neighborhoods and events.', kind: 'fact', sourceId: 'nyc-tourism' },
    ],
    highlights: [
      { id: 'new-york-central-park', title: 'Central Park', description: 'Pick a route through the park rather than trying to cover it all. The Conservancy has maps and current visitor information.', kind: 'fact', sourceId: 'central-park' },
      { id: 'new-york-liberty', title: 'Statue of Liberty', description: 'The National Park Service explains access and planning for the monument; consult it before choosing a ferry visit.', kind: 'fact', sourceId: 'nps-liberty' },
      { id: 'new-york-brooklyn-bridge-park', title: 'Brooklyn Bridge Park', description: 'The park’s official site has maps, activities, and current visitor information for a waterfront stop.', kind: 'fact', sourceId: 'brooklyn-bridge-park' },
      { id: 'new-york-memorial', title: '9/11 Memorial & Museum', description: 'Check the institution’s site for visiting information and decide whether to include the museum or the outdoor memorial.', kind: 'fact', sourceId: 'memorial' },
      { id: 'new-york-lower-manhattan', title: 'Lower Manhattan walk', description: 'Link the waterfront, historic streets, and nearby public spaces into a relaxed walk.', kind: 'editorial' },
    ],
    sources: [
      { id: 'mta', label: 'Metropolitan Transportation Authority', url: 'https://new.mta.info/', checkedAt },
      { id: 'mta-access', label: 'MTA accessibility', url: 'https://new.mta.info/accessibility', checkedAt },
      { id: 'nyc-tourism', label: 'New York City Tourism', url: 'https://www.nyctourism.com/', checkedAt },
      { id: 'jfk-airport', label: 'John F. Kennedy International Airport', url: 'https://www.jfkairport.com/', checkedAt },
      { id: 'central-park', label: 'Central Park Conservancy', url: 'https://www.centralparknyc.org/', checkedAt },
      { id: 'nps-liberty', label: 'National Park Service', url: 'https://www.nps.gov/stli/index.htm', checkedAt },
      { id: 'brooklyn-bridge-park', label: 'Brooklyn Bridge Park', url: 'https://www.brooklynbridgepark.org/', checkedAt },
      { id: 'memorial', label: '9/11 Memorial & Museum', url: 'https://www.911memorial.org/', checkedAt },
    ],
  },
];

export function getGuide(placeId: string): CityGuide | undefined {
  return guides.find((guide) => guide.place.id === placeId);
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
}

export function searchGuides(query: string): CityGuide[] {
  const needle = normalize(query);
  if (!needle) return guides;
  return guides.filter((guide) => {
    const terms = [guide.place.name, guide.country, ...guide.aliases,
      ...guide.sections.flatMap((item) => [item.title, item.description]),
      ...guide.highlights.flatMap((item) => [item.title, item.description])];
    return terms.some((term) => normalize(term).includes(needle));
  });
}
