import type { Metadata } from 'next';
import { IranGuideArticle } from '@/components/iran-guide-article';
import { getIranArticle } from '@/lib/iran-guide';

const article = getIranArticle('overview')!;
export const metadata: Metadata = {
  title: article.title, description: article.description,
  alternates: { canonical: article.href },
  openGraph: { title: article.title, description: article.description, type: 'article' },
};
export default function IranGuidePage() { return <IranGuideArticle article={article} />; }
