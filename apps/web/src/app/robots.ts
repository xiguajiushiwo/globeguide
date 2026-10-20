import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/saved/', '/trips/', '/search/'] }],
    sitemap: 'https://globeguide.pages.dev/sitemap.xml',
  };
}
