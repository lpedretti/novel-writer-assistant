import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import Link from 'next/link';

async function DashboardContent() {
  const user = await requireAuth();

  const [totalBooks, recentBooks] = await Promise.all([
    prisma.book.count({ where: { userId: user.userId } }),
    prisma.book.findMany({
      where: { userId: user.userId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        _count: { select: { chapters: true } },
      },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {user.name || 'Writer'}</h1>
        <p className="text-sm opacity-60 mt-1">Here is an overview of your writing projects.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-base-100 shadow-md border border-base-300">
          <div className="card-body">
            <p className="text-sm opacity-60">Total Books</p>
            <p className="text-3xl font-bold text-primary">{totalBooks}</p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-md border border-base-300">
          <div className="card-body">
            <p className="text-sm opacity-60">Total Chapters</p>
            <p className="text-3xl font-bold text-secondary">
              {recentBooks.reduce((sum, b) => sum + b._count.chapters, 0)}
            </p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-md border border-base-300">
          <div className="card-body">
            <p className="text-sm opacity-60">Role</p>
            <p className="text-3xl font-bold text-accent">{user.role}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card bg-base-100 shadow-md border border-base-300">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="card-title">Recent Books</h2>
            <Link href="/dashboard/books" className="btn btn-sm btn-ghost text-primary">
              View All
            </Link>
          </div>

          {recentBooks.length > 0 ? (
            <div className="space-y-3">
              {recentBooks.map((book) => (
                <Link
                  key={book.id}
                  href={`/dashboard/books/${book.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-base-200 transition-colors"
                >
                  <div>
                    <p className="font-semibold">{book.title}</p>
                    <p className="text-xs opacity-60">
                      {book._count.chapters} chapter{book._count.chapters !== 1 ? 's' : ''} &middot; Updated {book.updatedAt.toLocaleDateString()}
                    </p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="opacity-60 mb-4">No books yet. Start writing your first novel!</p>
              <Link href="/dashboard/books" className="btn btn-primary btn-sm">
                Create Book
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="h-9 w-64 bg-base-300 rounded animate-pulse" />
          <div className="h-4 w-48 bg-base-300 rounded animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card bg-base-100 shadow-md border border-base-300">
              <div className="card-body">
                <div className="h-4 w-20 bg-base-300 rounded animate-pulse" />
                <div className="h-9 w-16 bg-base-300 rounded animate-pulse mt-2" />
              </div>
            </div>
          ))}
        </div>
        <div className="card bg-base-100 shadow-md border border-base-300">
          <div className="card-body">
            <div className="h-6 w-32 bg-base-300 rounded animate-pulse mb-4" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-base-200 rounded-lg animate-pulse mb-3" />
            ))}
          </div>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
