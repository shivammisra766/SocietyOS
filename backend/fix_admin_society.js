require('dotenv').config();
const prisma = require('./src/shared/config/prisma');

async function main() {
  // Update the System Admin to belong to the active society
  const updated = await prisma.user.update({
    where: { email: 'admin@societyos.cloud' },
    data: { societyId: '4406da06-fe0e-4500-acc5-1d375fb43b5d' },
    select: { id: true, name: true, email: true, societyId: true }
  });
  console.log('Updated admin:', JSON.stringify(updated, null, 2));
  
  // Verify entry count for this society
  const count = await prisma.entryLog.count({
    where: { societyId: '4406da06-fe0e-4500-acc5-1d375fb43b5d' }
  });
  console.log('Entries in this society:', count);
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
