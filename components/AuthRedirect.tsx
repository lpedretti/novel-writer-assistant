'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Client-side component that redirects authenticated users to the dashboard
 * This prevents blocking the page render while checking auth status
 */
export function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in by calling an API endpoint
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();

        if (data.isLoggedIn) {
          router.push('/dashboard');
        }
      } catch (error) {
        // Silently fail - user can still use the form
        console.error('Auth check failed:', error);
      }
    }

    checkAuth();
  }, [router]);

  return null; // This component doesn't render anything
}
