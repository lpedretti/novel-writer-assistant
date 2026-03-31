import Link from 'next/link';
import ResetPasswordForm from './ResetPasswordForm';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

async function ResetPasswordContent({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    redirect('/auth/login?error=invalid-token');
  }

  // Verify token exists and is not expired
  const user = await prisma.user.findUnique({
    where: { resetToken: token },
    select: { id: true, resetTokenExpiry: true },
  });

  if (!user) {
    redirect('/auth/login?error=invalid-token');
  }

  if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
    redirect('/auth/login?error=token-expired');
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
          <h1 className="text-3xl font-bold text-neutral mb-2">Reset Password</h1>
          <p className="text-neutral/60">Choose a new secure password</p>
        </div>

        {/* Reset Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-base-300">
          <ResetPasswordForm token={token} />
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Link href="/auth/login" className="text-sm text-primary hover:text-secondary transition-colors">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordContent searchParams={searchParams} />
    </Suspense>
  );
}
