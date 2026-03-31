import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';
import Link from 'next/link';
import { Suspense } from 'react';

async function UsersList() {
  // Require ADMINISTRATOR role, will redirect to login if not authorized
  await requireRole(['ADMINISTRATOR']);

  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: { books: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra w-full">
        {/* Table Header */}
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Books</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="hover">
              <td>
                <div className="flex items-center gap-3">
                  <div className="avatar placeholder">
                    <div className="bg-gradient-to-br from-primary to-secondary text-white w-12 h-12 rounded-full">
                      <span className="text-xl font-bold">
                        {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="font-bold">{user.name || 'No name'}</div>
                    <div className="text-sm opacity-60">{user.email}</div>
                  </div>
                </div>
              </td>
              <td>
                <span className={`badge ${
                  user.role === 'ADMINISTRATOR' ? 'badge-error' :
                  user.role === 'CREATOR' ? 'badge-warning' :
                  'badge-info'
                }`}>
                  {user.role}
                </span>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="font-semibold">{user._count.books}</span>
                </div>
              </td>
              <td>
                <div className="flex flex-col gap-1">
                  <span className={`badge badge-sm ${(user.active ?? true) ? 'badge-success' : 'badge-error'}`}>
                    {(user.active ?? true) ? 'Active' : 'Disabled'}
                  </span>
                  {user.emailVerified ? (
                    <span className="badge badge-sm badge-ghost">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Verified
                    </span>
                  ) : (
                    <span className="badge badge-sm badge-ghost opacity-50">Not verified</span>
                  )}
                </div>
              </td>
              <td className="text-sm opacity-60">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </td>
              <td>
                <Link
                  href={`/dashboard/users/${user.id}`}
                  className="btn btn-ghost btn-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <div className="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto opacity-30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-lg opacity-60">No users found</p>
        </div>
      )}
    </div>
  );
}

export default function Users() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-sm opacity-60">Manage users, roles, and permissions</p>
        </div>
      </div>
      <Suspense fallback={
        <div className="text-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 opacity-60">Loading users...</p>
        </div>
      }>
        <UsersList />
      </Suspense>
    </div>
  );
}
