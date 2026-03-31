import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/password-validation';
import { sendPasswordResetEmail } from '@/lib/email';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

async function RecoverContent({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const params = await searchParams;

  async function recover(formData: FormData) {
    'use server';
    const email = formData.get('email') as string;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });

    // Always redirect to success page to avoid email enumeration
    // But only send email if user exists
    if (user) {
      // Generate reset token
      const resetToken = generateToken();
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save token to database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      // Send reset email
      await sendPasswordResetEmail(email, resetToken);
    }

    redirect('/auth/recover?sent=true');
  }

  return (
    <div className="min-h-screen flex justify-center px-4 pt-16 pb-8 bg-gradient-to-br from-base-100 via-base-200 to-accent/20">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-3 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-neutral mb-2">Forgot Password?</h1>
          <p className="text-neutral/60">No worries, we'll send you reset instructions</p>
        </div>

        {/* Recover Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-base-300">
          {params.sent && (
            <div className="mb-6 bg-success/10 border border-success/30 text-success px-4 py-3 rounded-lg text-sm">
              If an account exists with that email, we've sent password reset instructions.
            </div>
          )}
          <form action={recover} className="space-y-6">
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
              <p className="text-xs text-neutral/60">
                We'll send a recovery link to this email address
              </p>
            </div>

            {/* Submit Button */}
            <button type="submit" className="btn btn-primary w-full btn-lg shadow-lg hover:shadow-xl">
              Send Recovery Email
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-primary hover:text-secondary transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Sign In
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-neutral/60">
            Need help? <a href="mailto:support@reverie-capsule.com" className="text-primary hover:text-secondary transition-colors">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Recover({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RecoverContent searchParams={searchParams} />
    </Suspense>
  );
}
