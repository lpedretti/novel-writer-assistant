/**
 * Password validation utilities
 */

export interface PasswordRequirement {
  met: boolean;
  text: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  requirements: PasswordRequirement[];
  score: number; // 0-4
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePassword(password: string): PasswordValidationResult {
  const requirements: PasswordRequirement[] = [
    {
      met: password.length >= 8,
      text: 'At least 8 characters',
    },
    {
      met: /[A-Z]/.test(password),
      text: 'At least one uppercase letter',
    },
    {
      met: /[a-z]/.test(password),
      text: 'At least one lowercase letter',
    },
    {
      met: /[0-9]/.test(password),
      text: 'At least one number',
    },
    {
      met: /[^A-Za-z0-9]/.test(password),
      text: 'At least one special character (!@#$%^&*)',
    },
  ];

  const metCount = requirements.filter((r) => r.met).length;
  const isValid = metCount === requirements.length;
  const score = Math.min(4, metCount);

  return {
    isValid,
    requirements,
    score,
  };
}

/**
 * Get password strength description
 */
export function getPasswordStrength(score: number): {
  label: string;
  color: string;
} {
  if (score === 0) return { label: 'Very Weak', color: 'error' };
  if (score === 1) return { label: 'Weak', color: 'error' };
  if (score === 2) return { label: 'Fair', color: 'warning' };
  if (score === 3) return { label: 'Good', color: 'info' };
  return { label: 'Strong', color: 'success' };
}

/**
 * Generate a random token for email verification or password reset
 */
export function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
