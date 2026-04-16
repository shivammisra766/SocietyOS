const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testGetEntries() {
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { societyId: true, id: true }
  });
  
  if (!admin) {
    console.log("No admin found.");
    return;
  }
  
  console.log("Admin Society ID:", admin.societyId);

  const entries = await prisma.entryLog.findMany({
    where: { societyId: admin.societyId },
    include: {
      flat: { select: { number: true } },
      guard: { select: { name: true } },
      resident: { select: { name: true } },
      pass: true
    },
    orderBy: { entryTime: 'desc' },
    take: 5
  });

  console.log("Entries:", JSON.stringify(entries, null, 2));
}

testGetEntries().finally(() => prisma.$disconnect());
