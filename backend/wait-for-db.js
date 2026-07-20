const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient({ log: ['error'] });
  const maxRetries = 30;
  const delayMs = 2000;

  console.log('Checking database connection...');
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await prisma.$connect();
      console.log('Database is ready!');
      await prisma.$disconnect();
      process.exit(0);
    } catch (err) {
      console.log(`Database connection attempt ${i}/${maxRetries} failed: ${err.message}. Retrying in ${delayMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  console.error('Could not connect to database after 30 attempts. Exiting.');
  process.exit(1);
}

main();
