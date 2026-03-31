import { ReactNode, Suspense } from 'react';
import DashboardNav from './DashboardNav';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      <Suspense fallback={
        <aside className="w-64 bg-gradient-to-b from-base-200 to-base-300 border-r border-base-300 flex flex-col h-screen">
          {/* Header Skeleton */}
          <div className="p-6 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="skeleton w-10 h-10 rounded-xl"></div>
              <div className="flex-1">
                <div className="skeleton h-5 w-24 mb-1"></div>
                <div className="skeleton h-3 w-32"></div>
              </div>
            </div>
          </div>

          {/* User Info Skeleton */}
          <div className="p-4 border-b border-base-300 bg-base-100/50">
            <div className="flex items-center gap-3">
              <div className="skeleton w-10 h-10 rounded-full"></div>
              <div className="flex-1">
                <div className="skeleton h-4 w-24 mb-1"></div>
                <div className="skeleton h-3 w-32"></div>
              </div>
            </div>
            <div className="skeleton h-5 w-20 mt-2"></div>
          </div>

          {/* Menu Skeleton */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              <div className="skeleton h-12 w-full rounded-lg"></div>
              <div className="skeleton h-12 w-full rounded-lg"></div>
            </div>
          </nav>

          {/* Footer Skeleton */}
          <div className="p-4 border-t border-base-300">
            <div className="skeleton h-10 w-full rounded-lg"></div>
          </div>
        </aside>
      }>
        <DashboardNav />
      </Suspense>
      <div className="flex-1 overflow-y-auto p-6">
        {children}
      </div>
    </div>
  );
}
