#!/usr/bin/env node

/**
 * Script to change a user's role
 * Usage: npm run change-role <email> <role>
 * Roles: ADMINISTRATOR, CREATOR, VIEWER
 * Example: npm run change-role user@example.com CREATOR
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VALID_ROLES = ['ADMINISTRATOR', 'CREATOR', 'VIEWER'];

async function changeRole() {
  const [email, newRole] = process.argv.slice(2);

  if (!email || !newRole) {
    console.error('❌ Error: Email and role are required');
    console.log('Usage: npm run change-role <email> <role>');
    console.log('Valid roles: ADMINISTRATOR, CREATOR, VIEWER');
    console.log('Example: npm run change-role user@example.com CREATOR');
    process.exit(1);
  }

  // Validate role
  if (!VALID_ROLES.includes(newRole.toUpperCase())) {
    console.error(`❌ Error: Invalid role "${newRole}"`);
    console.log('Valid roles: ADMINISTRATOR, CREATOR, VIEWER');
    process.exit(1);
  }

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`❌ Error: User with email ${email} not found`);
      process.exit(1);
    }

    // Update role
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: newRole.toUpperCase() },
    });

    console.log('✅ User role updated successfully!');
    console.log(`   User: ${updatedUser.email}`);
    console.log(`   Name: ${updatedUser.name}`);
    console.log(`   Old role: ${user.role}`);
    console.log(`   New role: ${updatedUser.role}`);
  } catch (error) {
    console.error('❌ Error changing role:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

changeRole();
