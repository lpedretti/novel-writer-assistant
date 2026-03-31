import Link from 'next/link';
import { getCurrentUser } from '@/lib/session';

export default async function DashboardNav() {
  const user = await getCurrentUser();

  return (
    <aside className="w-64 bg-gradient-to-b from-base-200 to-base-300 border-r border-base-300 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-base-300">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#2563eb] to-[#60a5fa] flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <span className="text-xl font-bold text-white">N</span>
          </div>
          <div>
            <h2 className="font-bold text-lg bg-gradient-to-r from-[#2563eb] to-[#60a5fa] bg-clip-text text-transparent">
              Novel Writer
            </h2>
            <p className="text-xs opacity-60">Assistant</p>
          </div>
        </Link>
      </div>

      {/* User Info */}
      {user && (
        <div className="p-4 border-b border-base-300 bg-base-100/50">
          <div className="flex items-center gap-3">
            <div className="avatar placeholder">
              <div className="bg-gradient-to-br from-primary to-secondary text-white w-10 h-10 rounded-full">
                <span className="text-sm font-bold">
                  {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user.name || 'User'}</p>
              <p className="text-xs opacity-60 truncate">{user.email}</p>
            </div>
          </div>
          <div className="mt-2">
            <span className={`badge badge-sm ${
              user.role === 'ADMINISTRATOR' ? 'badge-error' :
              user.role === 'CREATOR' ? 'badge-warning' :
              'badge-info'
            }`}>
              {user.role}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {/* Overview */}
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-base-100 transition-all group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="font-medium group-hover:text-primary transition-colors">Overview</span>
          </Link>

          {/* My Books */}
          <Link
            href="/dashboard/books"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-base-100 transition-all group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="font-medium group-hover:text-primary transition-colors">My Books</span>
          </Link>

          {/* Admin Section */}
          {user?.role === 'ADMINISTRATOR' && (
            <>
              <div className="pt-4 pb-2">
                <p className="text-xs font-semibold uppercase opacity-40 px-4">Administration</p>
              </div>

              <Link
                href="/dashboard/users"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-base-100 transition-all group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="font-medium group-hover:text-primary transition-colors">Users</span>
              </Link>
            </>
          )}
        </div>
      </nav>

    </aside>
  );
}
