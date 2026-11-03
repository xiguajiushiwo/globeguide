import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { IranGuideArticle } from '@/components/iran-guide-article';
import { getIranArticle } from '@/lib/iran-guide';
import { iranGuideIndex } from '@/lib/iran-guide-index';

export const dynamicParams = false;
export function generateStaticParams() { return iranGuideIndex.filter(item => item.slug !== 'overview').map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const article = getIranArticle((await params).slug);
  return article ? { title: article.title, description: article.description, alternates: { canonical: article.href }, openGraph: { title: article.title, description: article.description, type: 'article' } } : {};
}
export default async function IranTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const article = getIranArticle((await params).slug);
  if (!article || article.slug === 'overview') notFound();
  return <IranGuideArticle article={article} />;
}
