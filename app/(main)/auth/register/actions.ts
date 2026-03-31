'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { redirect } from 'next/navigation';
import { validatePassword, generateToken } from '@/lib/password-validation';
import { sendVerificationEmail } from '@/lib/email';

export async function registerUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return {
      error: 'Password does not meet security requirements',
      requirements: passwordValidation.requirements,
    };
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: 'An account with this email already exists' };
  }

  // Generate verification token
  const verificationToken = generateToken();
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Hash password and create user
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      password: hash,
      name,
      verificationToken,
      verificationTokenExpiry,
    },
  });

  // Send verification email
  await sendVerificationEmail(email, verificationToken);

  // Redirect to check email page
  redirect(`/auth/check-email?email=${encodeURIComponent(email)}`);
}
