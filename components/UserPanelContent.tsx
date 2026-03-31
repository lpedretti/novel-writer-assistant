'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

export function UserPanelContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isBookEditor = pathname.includes('/edit');

  return (
    <div className={`flex-1 ${isBookEditor ? 'overflow-hidden' : 'overflow-y-auto p-6'}`}>
      {children}
    </div>
  );
}
