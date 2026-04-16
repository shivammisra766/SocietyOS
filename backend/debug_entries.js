require('dotenv').config();
const prisma = require('./src/shared/config/prisma');

async function main() {
  // Check admin users
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, name: true, email: true, societyId: true }
  });
  console.log('=== ADMIN USERS ===');
  console.log(JSON.stringify(admins, null, 2));

  // Check recent entries
  const entries = await prisma.entryLog.findMany({
    take: 5,
    orderBy: { entryTime: 'desc' },
    select: { id: true, visitorName: true, societyId: true, entryTime: true, status: true }
  });
  console.log('\n=== RECENT 5 ENTRIES ===');
  console.log(JSON.stringify(entries, null, 2));

  // Check total entry count
  const totalCount = await prisma.entryLog.count();
  console.log('\n=== TOTAL ENTRIES ===', totalCount);

  // Check if admin societyId matches any entries
  if (admins.length > 0) {
    const adminSocietyId = admins[0].societyId;
    const matchingEntries = await prisma.entryLog.count({
      where: { societyId: adminSocietyId }
    });
    console.log(`\n=== ENTRIES FOR ADMIN SOCIETY (${adminSocietyId}) ===`, matchingEntries);
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
