'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { redirect } from 'next/navigation';
import { validatePassword } from '@/lib/password-validation';

export async function resetPassword(formData: FormData) {
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return {
      error: 'Password does not meet security requirements',
    };
  }

  // Check passwords match
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' };
  }

  // Find user with this reset token
  const user = await prisma.user.findUnique({
    where: { resetToken: token },
  });

  if (!user) {
    return { error: 'Invalid reset token' };
  }

  // Check if token is expired
  if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
    return { error: 'Reset token has expired. Please request a new one.' };
  }

  // Hash new password
  const hash = await bcrypt.hash(password, 10);

  // Update password and clear reset token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  // Redirect to login with success message
  redirect('/auth/login?reset=true');
}
