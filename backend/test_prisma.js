const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['query', 'info', 'warn', 'error']
});

async function test() {
  console.log('Testing URL:', process.env.DATABASE_URL);
  try {
    await prisma.$connect();
    console.log('Successfully connected!');
    const res = await prisma.$queryRaw`SELECT 1`;
    console.log('Query result:', res);
  } catch (err) {
    console.error('Connection failed!');
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
