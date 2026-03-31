import Link from 'next/link';
import { Suspense } from 'react';

async function CheckEmailContent({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  return (
    <div className="min-h-screen flex justify-center px-4 pt-16 pb-8 bg-gradient-to-br from-base-100 via-base-200 to-accent/20">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-3 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-neutral mb-2">Check Your Email</h1>
          <p className="text-neutral/60">We've sent you a verification link</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-base-300">
          <div className="text-center space-y-4">
            <p className="text-neutral">
              We've sent a verification link to:
            </p>
            <p className="font-semibold text-primary text-lg break-all">
              {/* Email will be shown from searchParams */}
            </p>
            <div className="bg-info/10 border border-info/30 rounded-lg p-4 text-sm text-neutral/80">
              <p className="font-medium mb-2">What's next?</p>
              <ol className="list-decimal list-inside space-y-1 text-left">
                <li>Check your email inbox</li>
                <li>Click the verification link</li>
                <li>Sign in to your account</li>
              </ol>
            </div>

            <div className="pt-4">
              <p className="text-sm text-neutral/60 mb-4">
                Didn't receive the email? Check your spam folder or wait a few minutes.
              </p>
              <Link href="/auth/login" className="btn btn-primary w-full btn-lg shadow-lg hover:shadow-xl">
                Go to Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-neutral/60 mt-6">
          The verification link will expire in 24 hours
        </p>
      </div>
    </div>
  );
}

export default function CheckEmail({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CheckEmailContent searchParams={searchParams} />
    </Suspense>
  );
}
