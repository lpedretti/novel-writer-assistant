#!/usr/bin/env node

/**
 * Script to list all users in the database
 * Usage: npm run list-users
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (users.length === 0) {
      console.log('No users found in the database.');
      return;
    }

    console.log(`\n📋 Total users: ${users.length}\n`);
    console.log('─'.repeat(80));

    users.forEach((user, index) => {
      const verified = user.emailVerified ? '✅' : '❌';
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Email Verified: ${verified}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log(`   ID: ${user.id}`);
      console.log('─'.repeat(80));
    });

    console.log('');
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
