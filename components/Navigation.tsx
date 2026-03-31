import Link from 'next/link';
import { getCurrentUser } from '@/lib/session';
import UserMenuDropdown from './UserMenuDropdown';

export default async function Navigation() {
  const user = await getCurrentUser();

  return (
    <nav className="sticky top-0 z-50 bg-base-100/80 backdrop-blur-md border-b border-base-300 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="navbar min-h-16">
          {/* Logo */}
          <div className="navbar-start">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#2563eb] to-[#60a5fa] flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <span className="text-xl font-bold text-white">N</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#2563eb] to-[#60a5fa] bg-clip-text text-transparent hidden sm:inline">
                Novel Writer
              </span>
            </Link>
          </div>

          {/* Center Menu - Desktop */}
          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal px-1 gap-2">
              {user && (
                <>
                  <li>
                    <Link href="/dashboard" className="hover:text-primary transition-colors">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/books" className="hover:text-primary transition-colors">
                      My Books
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Right Side - Auth Widget */}
          <div className="navbar-end gap-2">
            {user ? (
              <UserMenuDropdown user={user} />
            ) : (
              <>
                <Link href="/auth/login" className="btn btn-ghost btn-sm">
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn btn-primary btn-sm shadow-md hover:shadow-lg transition-shadow">
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile Menu */}
            <div className="dropdown dropdown-end lg:hidden">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-square">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-300">
                {user && (
                  <>
                    <li><Link href="/dashboard">Dashboard</Link></li>
                    <li><Link href="/dashboard/books">My Books</Link></li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
