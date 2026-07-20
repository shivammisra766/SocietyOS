const { execSync } = require('child_process');

function runCmd(cmd) {
  console.log(`\n> ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Command failed: ${cmd}`);
    process.exit(1);
  }
}

async function main() {
  console.log('--- SocietyOS Container Startup ---');
  
  // 1. Wait for database to be ready
  runCmd('node wait-for-db.js');
  
  // 2. Sync database schema (Prisma db push)
  runCmd('npx prisma db push --accept-data-loss');
  
  // 3. Seed database
  runCmd('npx prisma db seed');
  
  // 4. Start the Express server
  console.log('\nStarting backend server...');
  runCmd('npm start');
}

main();
