import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/session';

export default async function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; redirect?: string }>;
}) {
  const params = await searchParams;

  async function handleLogin(formData: FormData) {
    'use server';

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const redirectTo = formData.get('redirect') as string | null;

    if (!email || !password) {
      const redirectParam = redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : '';
      redirect(`/auth/login?error=Please provide both email and password${redirectParam}`);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    const redirectParam = redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : '';

    if (!user) {
      redirect(`/auth/login?error=Invalid email or password${redirectParam}`);
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      redirect(`/auth/login?error=Invalid email or password${redirectParam}`);
    }

    // Check if email is verified
    if (!user.emailVerified) {
      redirect(`/auth/login?error=Please verify your email before logging in${redirectParam}`);
    }

    // Check if user is active (defaults to true if field doesn't exist yet)
    if (user.active === false) {
      redirect(`/auth/login?error=Your account has been disabled. Please contact support${redirectParam}`);
    }

    // Create encrypted session
    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Redirect to original URL or dashboard
    redirect(redirectTo || '/dashboard');
  }

  return (
    <>
      {params.error && (
        <div className="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{params.error}</span>
        </div>
      )}

      {params.success && (
        <div className="alert alert-success mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{params.success}</span>
        </div>
      )}

      <form action={handleLogin} className="space-y-6">
        {/* Hidden redirect field */}
        {params.redirect && (
          <input type="hidden" name="redirect" value={params.redirect} />
        )}

        {/* Email Input */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-neutral">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-neutral/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <input
              id="email"
              name="email"
              type="email"
              className="input input-bordered pl-10"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-neutral">
              Password
            </label>
            <Link href="/auth/recover" className="text-sm text-primary hover:text-secondary transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-neutral/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              className="input input-bordered pl-10"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" className="btn btn-primary w-full btn-lg shadow-lg hover:shadow-xl">
          Sign In
        </button>
      </form>
    </>
  );
}
