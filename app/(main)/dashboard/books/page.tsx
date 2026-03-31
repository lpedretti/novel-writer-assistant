import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import Link from 'next/link';
import { Suspense } from 'react';

async function BooksList() {
  const user = await requireAuth();
  const books = await prisma.book.findMany({ where: { userId: user.userId } });

  return (
    <ul className="space-y-2">
      {books.map((b) => (
        <li key={b.id} className="border-b pb-2 flex justify-between items-center p-2 hover:bg-base-200 rounded transition-colors">
          <Link href={`/dashboard/books/${b.id}`} className="flex-1 cursor-pointer hover:text-primary">
            {b.title}
          </Link>
          <div className="flex gap-2">
            <Link href={`/dashboard/books/${b.id}`} className="btn btn-sm btn-primary">
              Details
            </Link>
            <Link href={`/dashboard/books/${b.id}/edit`} className="btn btn-sm btn-ghost">
              Edit
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Books() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">My Books</h1>
        <Link href="/dashboard/books/new" className="btn btn-primary btn-sm">
          New Book
        </Link>
      </div>
      <Suspense fallback={<div className="text-center py-8">Loading your books...</div>}>
        <BooksList />
      </Suspense>
    </div>
  );
}
