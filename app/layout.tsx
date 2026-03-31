import './globals.css';
import { ReactNode, Suspense } from 'react';
import { ALL_FONTS } from '@/lib/fonts';

export const metadata = {
  title: 'Novel Writer Assistant',
  description: 'A writing assistant for novel authors with knowledge archive and story context tools.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // Build className string with all font CSS variables
  const fontClasses = ALL_FONTS
    .filter((f) => f.fontObject)
    .map((f) => f.fontObject!.variable)
    .join(' ');

  return (
    <html lang="en" className={fontClasses}>
      <body className="h-screen bg-base-100 text-neutral flex flex-col overflow-hidden">
        {children}
      </body>
    </html>
  );
}
