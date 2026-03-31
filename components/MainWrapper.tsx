'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, memo } from 'react';

function MainWrapperComponent({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard');

  if (isDashboard) {
    // Dashboard: no scroll, no footer
    return <main className="flex-grow">{children}</main>;
  }

  // General pages: scrollable with footer inside
  return (
    <main className="flex-grow overflow-y-auto scroll-smooth">
      {children}
      {footer}
    </main>
  );
}

// Memoize to prevent unnecessary re-renders
export const MainWrapper = memo(MainWrapperComponent);
