import { Search } from 'lucide-react';

import { copy } from '@/lib/copy';

export function SearchForm({ defaultValue = '', prominent = false }: { defaultValue?: string; prominent?: boolean }) {
  return (
    <form action="/search" className={`search-form${prominent ? ' search-form--prominent' : ''}`} role="search">
      <Search aria-hidden="true" size={21} strokeWidth={2} />
      <label className="sr-only" htmlFor={prominent ? 'hero-search' : 'page-search'}>{copy.searchPlaceholder}</label>
      <input id={prominent ? 'hero-search' : 'page-search'} name="q" type="search" placeholder={copy.searchPlaceholder} defaultValue={defaultValue} required />
      <button type="submit">{copy.search}</button>
    </form>
  );
}
