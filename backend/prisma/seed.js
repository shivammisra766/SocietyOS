/**
 * SocietyOS Database Seed Script
 * Creates a test society, flats, and user accounts for all roles.
 *
 * Usage: node prisma/seed.js
 *
 * Accounts created (all passwords hashed with bcrypt):
 *   ADMIN:    admin@societyos.com    / Admin@123
 *   RESIDENT: resident1@test.com     / Resident@123
 *   RESIDENT: resident2@test.com     / Resident@123
 *   SECURITY: guard1@test.com        / Guard@123
 *   SECURITY: guard2@test.com        / Guard@123
 *   SERVICE:  service1@test.com      / Service@123
 *   SERVICE:  service2@test.com      / Service@123
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SocietyOS database...\n');

  // 1. Create or find society
  let society = await prisma.society.findFirst({ where: { name: 'Emerald Heights' } });
  if (!society) {
    society = await prisma.society.create({
      data: {
        name: 'Emerald Heights',
        address: '42 MG Road, Sector 15, Noida, UP 201301',
        zipCode: '201301',
      },
    });
    console.log(`✅ Society created: ${society.name} (${society.id})`);
  } else {
    console.log(`ℹ️  Society already exists: ${society.name} (${society.id})`);
  }

  // 2. Create flats
  const flatData = [
    { number: 'A-101', floor: 1 },
    { number: 'A-102', floor: 1 },
    { number: 'A-201', floor: 2 },
    { number: 'A-202', floor: 2 },
    { number: 'A-301', floor: 3 },
    { number: 'A-302', floor: 3 },
    { number: 'A-401', floor: 4 },
    { number: 'A-402', floor: 4 },
  ];

  const flats = [];
  for (const fd of flatData) {
    let flat = await prisma.flat.findFirst({
      where: { number: fd.number, societyId: society.id },
    });
    if (!flat) {
      flat = await prisma.flat.create({
        data: { ...fd, societyId: society.id },
      });
    }
    flats.push(flat);
  }
  console.log(`✅ ${flats.length} flats ensured\n`);

  // 3. Hash passwords
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const residentPassword = await bcrypt.hash('Resident@123', 10);
  const guardPassword = await bcrypt.hash('Guard@123', 10);
  const servicePassword = await bcrypt.hash('Service@123', 10);

  // 4. Create user accounts
  const users = [
    {
      name: 'Admin User',
      email: 'admin@societyos.com',
      password: adminPassword,
      phone: '+91-9000000001',
      role: 'ADMIN',
      status: 'APPROVED',
      societyId: society.id,
      flatId: null,
    },
    {
      name: 'Aarav Mehta',
      email: 'resident1@test.com',
      password: residentPassword,
      phone: '+91-9000000002',
      role: 'RESIDENT',
      status: 'APPROVED',
      societyId: society.id,
      flatId: flats[6].id, // A-401
    },
    {
      name: 'Priya Sharma',
      email: 'resident2@test.com',
      password: residentPassword,
      phone: '+91-9000000003',
      role: 'RESIDENT',
      status: 'APPROVED',
      societyId: society.id,
      flatId: flats[7].id, // A-402
    },
    {
      name: 'Rajendra Singh',
      email: 'guard1@test.com',
      password: guardPassword,
      phone: '+91-9000000004',
      role: 'SECURITY',
      status: 'APPROVED',
      societyId: society.id,
      flatId: null,
    },
    {
      name: 'Vikram Yadav',
      email: 'guard2@test.com',
      password: guardPassword,
      phone: '+91-9000000005',
      role: 'SECURITY',
      status: 'APPROVED',
      societyId: society.id,
      flatId: null,
    },
    {
      name: 'Sunita Devi',
      email: 'service1@test.com',
      password: servicePassword,
      phone: '+91-9000000006',
      role: 'SERVICE',
      status: 'APPROVED',
      societyId: society.id,
      flatId: null,
    },
    {
      name: 'Ramesh Kumar',
      email: 'service2@test.com',
      password: servicePassword,
      phone: '+91-9000000007',
      role: 'SERVICE',
      status: 'APPROVED',
      societyId: society.id,
      flatId: null,
    },
  ];

  for (const userData of users) {
    const existing = await prisma.user.findUnique({ where: { email: userData.email } });
    if (existing) {
      // Update to ensure password + status are correct
      await prisma.user.update({
        where: { email: userData.email },
        data: {
          password: userData.password,
          status: userData.status,
          role: userData.role,
        },
      });
      console.log(`🔄 Updated: ${userData.email} (${userData.role})`);
    } else {
      await prisma.user.create({ data: userData });
      console.log(`✅ Created: ${userData.email} (${userData.role})`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' 🎉 Seed complete! Test accounts:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(' ADMIN:     admin@societyos.com    / Admin@123');
  console.log(' RESIDENT:  resident1@test.com     / Resident@123');
  console.log(' RESIDENT:  resident2@test.com     / Resident@123');
  console.log(' GUARD:     guard1@test.com        / Guard@123');
  console.log(' GUARD:     guard2@test.com        / Guard@123');
  console.log(' SERVICE:   service1@test.com      / Service@123');
  console.log(' SERVICE:   service2@test.com      / Service@123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
