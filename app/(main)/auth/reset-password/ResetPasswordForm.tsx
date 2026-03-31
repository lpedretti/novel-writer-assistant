'use client';

import { useState } from 'react';
import { validatePassword, getPasswordStrength } from '@/lib/password-validation';
import { resetPassword } from './actions';

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validation = validatePassword(password);
  const strength = getPasswordStrength(validation.score);
  const passwordsMatch = password === confirmPassword;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!validation.isValid) {
      setError('Password does not meet security requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await resetPassword(formData);

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
      <input type="hidden" name="token" value={token} />

      {error && (
        <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* New Password Input */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-neutral">
          New Password
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

      {/* Confirm Password Input */}
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral">
          Confirm New Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-neutral/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input input-bordered pl-10"
            placeholder="••••••••"
            required
            disabled={isSubmitting}
          />
        </div>
        {confirmPassword && !passwordsMatch && (
          <p className="text-xs text-error">Passwords do not match</p>
        )}
        {confirmPassword && passwordsMatch && (
          <p className="text-xs text-success flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Passwords match
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="btn btn-primary w-full btn-lg shadow-lg hover:shadow-xl"
        disabled={isSubmitting || (password && !validation.isValid) || !passwordsMatch}
      >
        {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
      </button>
    </form>
  );
}
