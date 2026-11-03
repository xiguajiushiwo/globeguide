import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { SiteHeader } from '@/components/site-header';
import { PageTransition } from '@/components/page-transition';
import { copy } from '@/lib/copy';

import './globals.css';
import './auth.css';
import './stories/stories.css';
import './account/account.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://wayella.com'),
  title: { default: 'Wayella | See the world. Share yours.', template: '%s | Wayella' },
  description: 'See the world. Share yours. Discover travel guides, plan your journey, and share your stories on Wayella.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Wayella',
  appleWebApp: { capable: true, title: 'Wayella', statusBarStyle: 'default' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main><PageTransition>{children}</PageTransition></main>
        <footer className="site-footer"><div className="shell site-footer__inner"><Link href="/" className="site-footer__brand">{copy.brand}</Link><span>{copy.footerLine}</span><span>{copy.photoCredit}</span></div></footer>
      </body>
    </html>
  );
}
