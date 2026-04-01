#!/usr/bin/env node

/**
 * Script to create a user with a specified role
 * Usage: npm run add-user <email> <password> [name] [role]
 * Example: npm run add-user writer@example.com SecurePass123! "Jane Doe" CREATOR
 *
 * Roles: VIEWER (default), CREATOR, ADMINISTRATOR
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const VALID_ROLES = ['VIEWER', 'CREATOR', 'ADMINISTRATOR'];

async function addUser() {
  const [email, password, name, role] = process.argv.slice(2);

  if (!email || !password) {
    console.error('Error: Email and password are required');
    console.log('');
    console.log('Usage: npm run add-user <email> <password> [name] [role]');
    console.log('');
    console.log('Roles: VIEWER (default), CREATOR, ADMINISTRATOR');
    console.log('');
    console.log('Examples:');
    console.log('  npm run add-user writer@example.com MyPass123! "Jane Doe"');
    console.log('  npm run add-user writer@example.com MyPass123! "Jane Doe" CREATOR');
    console.log('  npm run add-user admin@example.com MyPass123! "Admin" ADMINISTRATOR');
    process.exit(1);
  }

  const userRole = role?.toUpperCase() || 'CREATOR';

  if (!VALID_ROLES.includes(userRole)) {
    console.error(`Error: Invalid role "${role}". Must be one of: ${VALID_ROLES.join(', ')}`);
    process.exit(1);
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.error(`Error: User with email ${email} already exists`);
      process.exit(1);
    }

    if (password.length < 8) {
      console.error('Error: Password must be at least 8 characters long');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        role: userRole,
        emailVerified: true,
      },
    });

    console.log('User created successfully!');
    console.log(`  Email: ${user.email}`);
    console.log(`  Name:  ${user.name}`);
    console.log(`  Role:  ${user.role}`);
    console.log(`  ID:    ${user.id}`);
  } catch (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addUser();
