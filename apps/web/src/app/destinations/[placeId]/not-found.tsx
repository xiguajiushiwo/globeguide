import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { copy } from '@/lib/copy';

export default function NotFound() {
  return <div className="shell content-page"><h1>Destination not found</h1><Link className="text-link" href="/"><ArrowLeft size={18} aria-hidden="true" />{copy.explore}</Link></div>;
}
