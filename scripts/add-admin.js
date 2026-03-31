#!/usr/bin/env node

/**
 * Script to create an admin user
 * Usage: npm run add-admin <email> <password> <name>
 * Example: npm run add-admin admin@example.com SecurePass123! "Admin User"
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function addAdmin() {
  const [email, password, name] = process.argv.slice(2);

  if (!email || !password) {
    console.error('❌ Error: Email and password are required');
    console.log('Usage: npm run add-admin <email> <password> [name]');
    console.log('Example: npm run add-admin admin@example.com SecurePass123! "Admin User"');
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.error(`❌ Error: User with email ${email} already exists`);
      process.exit(1);
    }

    // Validate password strength
    if (password.length < 8) {
      console.error('❌ Error: Password must be at least 8 characters long');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        role: 'ADMINISTRATOR',
        emailVerified: true, // Auto-verify admin users
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user.id}`);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addAdmin();
