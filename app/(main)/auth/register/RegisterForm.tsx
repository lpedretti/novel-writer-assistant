'use client';

import { useState } from 'react';
import Link from 'next/link';
import { validatePassword, getPasswordStrength } from '@/lib/password-validation';
import { registerUser } from './actions';

export default function RegisterForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validation = validatePassword(password);
  const strength = getPasswordStrength(validation.score);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await registerUser(formData);

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
    // If successful, the server action will redirect
  }

  const getStrengthColor = (color: string) => {
    switch (color) {
      case 'error': return 'bg-error';
      case 'warning': return 'bg-warning';
      case 'info': return 'bg-info';
      case 'success': return 'bg-success';
      default: return 'bg-base-300';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Name Input */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-neutral">
          Full Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-neutral/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <input
            id="name"
            name="name"
            type="text"
            className="input input-bordered pl-10"
            placeholder="John Doe"
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

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
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-neutral">
          Password
        </label>
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input input-bordered pl-10"
            placeholder="••••••••"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Password Strength Indicator */}
        {password && (
          <div className="space-y-2 mt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral/60">Password Strength:</span>
              <span className={`font-medium ${
                strength.color === 'error' ? 'text-error' :
                strength.color === 'warning' ? 'text-warning' :
                strength.color === 'info' ? 'text-info' :
                'text-success'
              }`}>
                {strength.label}
              </span>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    index < validation.score ? getStrengthColor(strength.color) : 'bg-base-300'
                  }`}
                />
              ))}
            </div>

            {/* Requirements Checklist */}
            <ul className="space-y-1 text-xs">
              {validation.requirements.map((req, index) => (
                <li key={index} className={`flex items-center gap-2 ${req.met ? 'text-success' : 'text-neutral/60'}`}>
                  {req.met ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeWidth={2} />
                    </svg>
                  )}
                  {req.text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="btn btn-primary w-full btn-lg shadow-lg hover:shadow-xl"
        disabled={isSubmitting || (password.length > 0 && !validation.isValid)}
      >
        {isSubmitting ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
}
