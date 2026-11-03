import type { Metadata } from 'next';

import { MarketPage } from '@/components/market-page';
import './market.css';

export const metadata: Metadata = { title: '旅行商城', description: 'Buy and sell travel gear, experiences, and route services on Wayella.' };

export default function MarketRoute() { return <MarketPage />; }
