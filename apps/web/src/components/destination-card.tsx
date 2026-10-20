import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { copy } from '@/lib/copy';

export function DestinationCard({ id, name, country, image }: { id: string; name: string; country: string; image: string }) {
  return (
    <Link className="destination-card" href={`/destinations/${id}`} aria-label={`${copy.viewDestination}: ${name}`}>
      <div className="destination-card__image"><Image src={image} alt={`${name}, ${country}`} fill sizes="(max-width: 700px) 90vw, (max-width: 1000px) 45vw, 33vw" /></div>
      <div className="destination-card__body">
        <div><span className="destination-card__country">{country}</span><h3>{name}</h3></div>
        <span className="destination-card__arrow"><ArrowUpRight size={22} aria-hidden="true" /></span>
      </div>
    </Link>
  );
}
