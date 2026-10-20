import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { SiteHeader } from '@/components/site-header';
import { copy } from '@/lib/copy';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://globeguide.pages.dev'),
  title: { default: 'GlobeGuide | Explore destinations', template: '%s | GlobeGuide' },
  description: 'Explore destinations and save places for your next journey.',
  alternates: { canonical: '/' },
  manifest: '/manifest.webmanifest',
  applicationName: 'GlobeGuide',
  appleWebApp: { capable: true, title: 'GlobeGuide', statusBarStyle: 'default' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <footer className="site-footer"><div className="shell site-footer__inner"><Link href="/" className="site-footer__brand">{copy.brand}</Link><span>{copy.footerLine}</span><span>{copy.photoCredit}</span></div></footer>
      </body>
    </html>
  );
}
