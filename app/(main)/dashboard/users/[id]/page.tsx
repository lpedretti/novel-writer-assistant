import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

async function toggleUserStatus(formData: FormData) {
  'use server';

  await requireRole(['ADMINISTRATOR']);

  const userId = Number(formData.get('userId'));
  const currentStatus = formData.get('currentStatus') === 'true';

  await prisma.user.update({
    where: { id: userId },
    data: { active: !currentStatus }
  });

  redirect(`/dashboard/users/${userId}`);
}

async function changeUserRole(formData: FormData) {
  'use server';

  await requireRole(['ADMINISTRATOR']);

  const userId = Number(formData.get('userId'));
  const newRole = formData.get('role') as 'ADMINISTRATOR' | 'CREATOR' | 'VIEWER';

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole }
  });

  redirect(`/dashboard/users/${userId}`);
}

async function UserDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(['ADMINISTRATOR']);

  const { id } = await params;
  const userId = Number(id);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      books: {
        include: {
          chapters: true
        }
      },
      _count: {
        select: { books: true }
      }
    }
  });

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
        <Link href="/dashboard/users" className="btn btn-primary">
          Back to Users
        </Link>
      </div>
    );
  }

  // Calculate statistics
  const totalChapters = user.books.reduce((acc, book) => acc + book.chapters.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/dashboard/users" className="btn btn-ghost btn-sm mt-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{user.name || 'No name'}</h1>
          <p className="text-sm opacity-60">{user.email}</p>
        </div>

        {/* Quick Actions - Right next to user info */}
        <div className="flex items-center gap-3 ml-6">
          {/* Change Role Action */}
          <form action={changeUserRole} className="flex gap-2 items-center">
            <input type="hidden" name="userId" value={user.id} />
            <select
              name="role"
              defaultValue={user.role}
              className="select select-bordered select-sm"
            >
              <option value="VIEWER">Viewer</option>
              <option value="CREATOR">Creator</option>
              <option value="ADMINISTRATOR">Administrator</option>
            </select>
            <button type="submit" className="btn btn-sm btn-primary whitespace-nowrap">
              Change Role
            </button>
          </form>

          {/* Enable/Disable Action */}
          <form action={toggleUserStatus}>
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="currentStatus" value={(user.active ?? true).toString()} />
            <button
              type="submit"
              className={`btn btn-sm whitespace-nowrap text-white ${(user.active ?? true) ? 'bg-error hover:bg-error/90 border-error' : 'bg-success hover:bg-success/90 border-success'}`}
            >
              {(user.active ?? true) ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Disable User
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Enable User
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* User Info Card */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">User Information</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-bold min-w-32">Email:</span>
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold min-w-32">Name:</span>
              <span>{user.name || 'Not set'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold min-w-32">Role:</span>
              <span className={`badge ${
                user.role === 'ADMINISTRATOR' ? 'badge-error' :
                user.role === 'CREATOR' ? 'badge-warning' :
                'badge-info'
              }`}>
                {user.role}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold min-w-32">Status:</span>
              <span className={`badge ${(user.active ?? true) ? 'badge-success' : 'badge-error'}`}>
                {(user.active ?? true) ? 'Active' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold min-w-32">Email Verified:</span>
              <span className={`badge ${user.emailVerified ? 'badge-success' : 'badge-warning'}`}>
                {user.emailVerified ? 'Verified' : 'Not Verified'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold min-w-32">Member Since:</span>
              <span>
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Books Stat */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold opacity-60 mb-2">Total Books</h3>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold text-primary">{user._count.books}</span>
                  <span className="text-sm opacity-60">{totalChapters} chapters</span>
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>

        {/* Writing Activity Stat */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold opacity-60 mb-2">Total Chapters</h3>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold text-secondary">{totalChapters}</span>
                  <span className="text-sm opacity-60">across {user._count.books} books</span>
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-secondary opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Books List */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Created Books</h2>
          {user.books.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Chapters</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {user.books.map((book) => (
                    <tr key={book.id}>
                      <td className="font-semibold">{book.title}</td>
                      <td>{book.chapters.length}</td>
                      <td className="text-sm opacity-60">
                        {new Date(book.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <Link
                          href={`/dashboard/books/${book.id}`}
                          className="btn btn-ghost btn-xs"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 opacity-60">
              <p>No books created yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UserDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="skeleton h-8 w-20"></div>
          <div>
            <div className="skeleton h-8 w-64 mb-2"></div>
            <div className="skeleton h-4 w-48"></div>
          </div>
        </div>
        <div className="skeleton h-64 w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="skeleton h-32 w-full"></div>
          <div className="skeleton h-32 w-full"></div>
        </div>
      </div>
    }>
      <UserDetailContent params={params} />
    </Suspense>
  );
}
