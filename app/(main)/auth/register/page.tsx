import Link from 'next/link';
import RegisterForm from './RegisterForm';
import { AuthRedirect } from '@/components/AuthRedirect';

export default function Register() {
  return (
    <>
      <AuthRedirect />
    <div className="min-h-screen flex justify-center px-4 pt-16 pb-8 bg-gradient-to-br from-base-100 via-base-200 to-accent/20">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-3 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-neutral mb-2">Create Account</h1>
          <p className="text-neutral/60">Join Reverie Capsule and discover immersive stories</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-base-300">
          <RegisterForm />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-base-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-neutral/60">Already have an account?</span>
            </div>
          </div>

          {/* Login Link */}
          <Link href="/auth/login" className="btn btn-outline border-primary text-primary w-full btn-lg hover:bg-primary hover:text-white">
            Sign In Instead
          </Link>
        </div>

        {/* Footer Text */}
        <p className="text-center text-sm text-neutral/60 mt-6">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
    </>
  );
}
