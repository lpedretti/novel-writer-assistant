#!/usr/bin/env node

/**
 * Script to change a user's password
 * Usage: npm run change-password <email> <new-password>
 * Example: npm run change-password user@example.com NewSecurePass123!
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function changePassword() {
  const [email, newPassword] = process.argv.slice(2);

  if (!email || !newPassword) {
    console.error('❌ Error: Email and new password are required');
    console.log('Usage: npm run change-password <email> <new-password>');
    console.log('Example: npm run change-password user@example.com NewSecurePass123!');
    process.exit(1);
  }

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`❌ Error: User with email ${email} not found`);
      process.exit(1);
    }

    // Validate password strength
    if (newPassword.length < 8) {
      console.error('❌ Error: Password must be at least 8 characters long');
      process.exit(1);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    console.log('✅ Password updated successfully!');
    console.log(`   User: ${email}`);
    console.log(`   Name: ${user.name}`);
  } catch (error) {
    console.error('❌ Error changing password:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

changePassword();
