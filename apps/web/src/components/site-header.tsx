import Link from 'next/link';
import { Compass, Bookmark, Route } from 'lucide-react';

import { copy } from '@/lib/copy';

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link className="brand" href="/" aria-label={`${copy.brand} home`}>
          <span className="brand__mark"><Compass size={21} strokeWidth={2.4} aria-hidden="true" /></span>
          <span>{copy.brand}</span>
        </Link>
        <nav aria-label="Main navigation" className="main-nav">
          <Link href="/#destinations">{copy.explore}</Link>
          <Link href="/saved" aria-label={copy.saved}><Bookmark size={17} strokeWidth={2} aria-hidden="true" /><span>{copy.saved}</span></Link>
          <Link href="/trips" aria-label={copy.trips}><Route size={17} strokeWidth={2} aria-hidden="true" /><span>{copy.trips}</span></Link>
        </nav>
      </div>
    </header>
  );
}
