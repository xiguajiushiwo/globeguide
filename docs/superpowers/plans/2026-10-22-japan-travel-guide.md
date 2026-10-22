# Japan travel guide implementation plan

## Goal

Publish a Chinese, end-to-end Japan independent-travel guide for first-time travelers departing from mainland China. Cover preparation, visa decision, entry, airports, rail, city travel, daily routes, booking, spending, safety, and return travel in one navigable page.

## Content and evidence

1. Confirm changing rules against primary sources: JNTO, Japan Digital Agency, Customs, airport operators, JR Pass, and official destination/attraction sites.
2. Date the review, link each changing rule to its source, and avoid asserting universal visa documents, train fares, attraction hours, or exchange rates.
3. Present concrete 7-, 10-, and 14-day route variants, with a detailed 10-day baseline and day-by-day transport instructions.
4. Provide budget scenarios, booking order, checklist, etiquette, accessibility, seasonal changes, and emergency actions.

## Files

- `apps/web/src/lib/japan-guide.ts`: source registry, itinerary, route decisions, budget assumptions, checklists.
- `apps/web/src/app/guides/japan/page.tsx`: semantic article, navigation, official citations, FAQ and metadata.
- `apps/web/src/app/guides/japan/japan-guide.css`: responsive article layout and print styling.
- `apps/web/src/components/site-header.tsx`: entry point in global navigation.
- `apps/web/src/app/destinations/[placeId]/page.tsx`: entry from Tokyo destination.
- `apps/web/src/app/sitemap.ts`: include the guide URL.
- focused content tests: source coverage, itinerary shape, and route links.

## Verification

Run web tests, typecheck, production build, inspect desktop/mobile rendering, check links and exported page, push the private repository, and deploy to Cloudflare Pages. Smoke-test the production URL.
