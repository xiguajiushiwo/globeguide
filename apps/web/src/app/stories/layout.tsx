import type { ReactNode } from 'react';

import './stories.css';

export default function StoriesLayout({ children }: { children: ReactNode }) {
  return <div className="stories-area">{children}</div>;
}
