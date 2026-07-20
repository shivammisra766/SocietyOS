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
 *   RESIDENT: resident3@test.com     / Resident@123
 *   SECURITY: guard1@test.com        / Guard@123
 *   SECURITY: guard2@test.com        / Guard@123
 *   SECURITY: guard3@test.com        / Guard@123
 *   SERVICE:  service1@test.com      / Service@123
 *   SERVICE:  service2@test.com      / Service@123
 *   SERVICE:  service3@test.com      / Service@123
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SocietyOS database with rich data...\n');

  // Connect to MongoDB
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/SocietyOS';
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected for seeding');
  const EntryLog = require('../src/modules/entry/entry.model');

  console.log('🧹 Clearing existing database data...');
  await EntryLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.pass.deleteMany({});
  await prisma.notice.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.flat.deleteMany({});
  await prisma.society.deleteMany({});
  console.log('✅ Database cleared.\n');

  // 1. Create society
  const society = await prisma.society.create({
    data: {
      name: 'Emerald Heights',
      address: '42 MG Road, Sector 15, Noida, UP 201301',
      zipCode: '201301',
    },
  });
  console.log(`✅ Society created: ${society.name} (${society.id})`);

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

  const flats = {};
  for (const fd of flatData) {
    const flat = await prisma.flat.create({
      data: { ...fd, societyId: society.id },
    });
    flats[fd.number] = flat;
  }
  console.log(`✅ ${Object.keys(flats).length} flats created.`);

  // 3. Hash passwords
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const residentPassword = await bcrypt.hash('Resident@123', 10);
  const guardPassword = await bcrypt.hash('Guard@123', 10);
  const servicePassword = await bcrypt.hash('Service@123', 10);

  // 4. Create User accounts
  const userData = [
    {
      name: 'Admin User',
      email: 'admin@societyos.com',
      password: adminPassword,
      phone: '+91-9000000001',
      role: 'ADMIN',
      status: 'APPROVED',
      societyId: society.id,
    },
    {
      name: 'Aarav Mehta',
      email: 'resident1@test.com',
      password: residentPassword,
      phone: '+91-9000000002',
      role: 'RESIDENT',
      status: 'APPROVED',
      societyId: society.id,
      flatId: flats['A-401'].id,
    },
    {
      name: 'Priya Sharma',
      email: 'resident2@test.com',
      password: residentPassword,
      phone: '+91-9000000003',
      role: 'RESIDENT',
      status: 'APPROVED',
      societyId: society.id,
      flatId: flats['A-402'].id,
    },
    {
      name: 'Anita Patel',
      email: 'resident3@test.com',
      password: residentPassword,
      phone: '+91-9000000008',
      role: 'RESIDENT',
      status: 'APPROVED',
      societyId: society.id,
      flatId: flats['A-302'].id,
    },
    {
      name: 'Vikram Aditya',
      email: 'resident_a101@test.com',
      password: residentPassword,
      phone: '+91-9000000011',
      role: 'RESIDENT',
      status: 'APPROVED',
      societyId: society.id,
      flatId: flats['A-101'].id,
    },
    {
      name: 'Neha Kapoor',
      email: 'resident_a102@test.com',
      password: residentPassword,
      phone: '+91-9000000012',
      role: 'RESIDENT',
      status: 'APPROVED',
      societyId: society.id,
      flatId: flats['A-102'].id,
    },
    {
      name: 'Rajesh Khanna',
      email: 'resident_a201@test.com',
      password: residentPassword,
      phone: '+91-9000000013',
      role: 'RESIDENT',
      status: 'APPROVED',
      societyId: society.id,
      flatId: flats['A-201'].id,
    },
    {
      name: 'Sonal Verma',
      email: 'resident_a202@test.com',
      password: residentPassword,
      phone: '+91-9000000014',
      role: 'RESIDENT',
      status: 'APPROVED',
      societyId: society.id,
      flatId: flats['A-202'].id,
    },
    {
      name: 'Amit Trivedi',
      email: 'resident_a301@test.com',
      password: residentPassword,
      phone: '+91-9000000015',
      role: 'RESIDENT',
      status: 'APPROVED',
      societyId: society.id,
      flatId: flats['A-301'].id,
    },
    {
      name: 'Rajendra Singh',
      email: 'guard1@test.com',
      password: guardPassword,
      phone: '+91-9000000004',
      role: 'SECURITY',
      status: 'APPROVED',
      societyId: society.id,
    },
    {
      name: 'Vikram Yadav',
      email: 'guard2@test.com',
      password: guardPassword,
      phone: '+91-9000000005',
      role: 'SECURITY',
      status: 'APPROVED',
      societyId: society.id,
    },
    {
      name: 'Karan Singh',
      email: 'guard3@test.com',
      password: guardPassword,
      phone: '+91-9000000009',
      role: 'SECURITY',
      status: 'APPROVED',
      societyId: society.id,
    },
    {
      name: 'Sunita Devi',
      email: 'service1@test.com',
      password: servicePassword,
      phone: '+91-9000000006',
      role: 'SERVICE',
      status: 'APPROVED',
      societyId: society.id,
    },
    {
      name: 'Ramesh Kumar',
      email: 'service2@test.com',
      password: servicePassword,
      phone: '+91-9000000007',
      role: 'SERVICE',
      status: 'APPROVED',
      societyId: society.id,
    },
    {
      name: 'Geeta Rani',
      email: 'service3@test.com',
      password: servicePassword,
      phone: '+91-9000000010',
      role: 'SERVICE',
      status: 'APPROVED',
      societyId: society.id,
    },
  ];

  const users = {};
  for (const ud of userData) {
    const user = await prisma.user.create({ data: ud });
    users[ud.email] = user;
  }
  console.log(`✅ ${Object.keys(users).length} users created.`);

  // 5. Create Notices
  const now = new Date();
  const noticeData = [
    {
      title: 'Emergency Water Outage - 20th June',
      body: 'Please note that there will be a temporary water outage on 20th June from 10:00 AM to 2:00 PM due to routine overhead tank cleaning. Residents are advised to store sufficient water in advance.',
      category: 'EMERGENCY',
      priority: 'URGENT',
      isPinned: true,
      authorId: users['admin@societyos.com'].id,
      societyId: society.id,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Annual General Body Meeting (AGM)',
      body: 'The Annual General Body Meeting of Emerald Heights Society is scheduled for Sunday, 28th June at 4:00 PM in the Clubhouse. Attendance is highly appreciated. Agenda points will be shared via email shortly.',
      category: 'EVENT',
      priority: 'NORMAL',
      isPinned: true,
      authorId: users['admin@societyos.com'].id,
      societyId: society.id,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Maintenance Fee Payment Reminder',
      body: 'This is a friendly reminder to all residents to clear their monthly society maintenance dues by the 10th of this month to avoid late payment charges. Thank you for your cooperation.',
      category: 'MAINTENANCE',
      priority: 'HIGH',
      isPinned: false,
      authorId: users['admin@societyos.com'].id,
      societyId: society.id,
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Weekend Cleanliness & Tree Plantation Drive',
      body: "Join us for a green initiative! Emerald Heights is hosting a Cleanliness and Tree Plantation drive this Saturday at 8:00 AM in the Central Park. Let's make our society greener and cleaner together!",
      category: 'GENERAL',
      priority: 'NORMAL',
      isPinned: false,
      authorId: users['admin@societyos.com'].id,
      societyId: society.id,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Block A Lift Maintenance Schedule',
      body: 'The elevator in Block A will undergo quarterly inspection and maintenance on 22nd June from 2:00 PM to 5:00 PM. Please use the stairs during this period. We apologize for the inconvenience.',
      category: 'MAINTENANCE',
      priority: 'NORMAL',
      isPinned: false,
      authorId: users['admin@societyos.com'].id,
      societyId: society.id,
      createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'New Security Protocols Implemented',
      body: 'To enhance the safety of all residents, we are enforcing stricter gate check-ins using the SocietyOS app. Please ensure your visitors and delivery personnel scan the QR code at the main gate.',
      category: 'GENERAL',
      priority: 'HIGH',
      isPinned: false,
      authorId: users['admin@societyos.com'].id,
      societyId: society.id,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const nd of noticeData) {
    await prisma.notice.create({ data: nd });
  }
  console.log(`✅ ${noticeData.length} notices created.`);

  // 6. Create Complaints
  const complaintData = [
    {
      title: 'Water Seepage in Master Bathroom',
      description: 'Water is continuously leaking from the ceiling of the master bathroom. It seems to be coming from the flat above. Please investigate immediately.',
      category: 'PLUMBING',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      flatId: flats['A-401'].id,
      userId: users['resident1@test.com'].id,
      societyId: society.id,
      assignedToId: users['service1@test.com'].id,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Corridor Lights Flickering',
      description: 'The tubelight in the 4th-floor corridor near flat A-402 is flickering and sometimes completely turns off, making the corridor very dark at night.',
      category: 'ELECTRICAL',
      priority: 'MEDIUM',
      status: 'ASSIGNED',
      flatId: flats['A-402'].id,
      userId: users['resident2@test.com'].id,
      societyId: society.id,
      assignedToId: users['service2@test.com'].id,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Garbage Pile Up in Stairwell',
      description: 'Garbage bags have been left in the stairwell of Block A on the 3rd floor, emitting a bad smell. Cleaning staff should remove it urgently.',
      category: 'CLEANING',
      priority: 'LOW',
      status: 'RESOLVED',
      flatId: flats['A-302'].id,
      userId: users['resident3@test.com'].id,
      societyId: society.id,
      assignedToId: users['service3@test.com'].id,
      closingNote: 'Cleaned and sanitized the stairwell corridor.',
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Visitor Intercom Connection Broken',
      description: 'The visitor intercom at the ground floor lobby is not connecting to Flat A-201. I missed a delivery because of this issue.',
      category: 'OTHER',
      priority: 'MEDIUM',
      status: 'OPEN',
      flatId: flats['A-201'].id,
      userId: users['resident_a201@test.com'].id,
      societyId: society.id,
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
    {
      title: 'Main Gate Security Camera Blocked',
      description: 'The security camera overlooking the visitor parking at the main entrance gate seems to have its view blocked by a branch of a tree.',
      category: 'SECURITY',
      priority: 'HIGH',
      status: 'CLOSED',
      flatId: flats['A-202'].id,
      userId: users['resident_a202@test.com'].id,
      societyId: society.id,
      assignedToId: users['service2@test.com'].id,
      closingNote: 'Tree branch trimmed and camera view restored.',
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Leaking Kitchen Pipe',
      description: 'The pipe under the kitchen sink is leaking heavily, causing water to pool inside the cabinet.',
      category: 'PLUMBING',
      priority: 'HIGH',
      status: 'RESOLVED',
      flatId: flats['A-301'].id,
      userId: users['resident_a301@test.com'].id,
      societyId: society.id,
      assignedToId: users['service1@test.com'].id,
      closingNote: 'Replaced the damaged drain pipe under the sink.',
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Frequent Power Tripping in Flat A-102',
      description: 'The circuit breaker trips multiple times a day when using the AC or microwave. Needs an electrician to inspect the main DB box.',
      category: 'ELECTRICAL',
      priority: 'HIGH',
      status: 'OPEN',
      flatId: flats['A-102'].id,
      userId: users['resident_a102@test.com'].id,
      societyId: society.id,
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
    {
      title: 'Elevator Buttons Unresponsive',
      description: 'The button for floor 3 inside Elevator #2 is not lighting up or responding when pressed. Needs repair.',
      category: 'OTHER',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      flatId: flats['A-101'].id,
      userId: users['resident_a101@test.com'].id,
      societyId: society.id,
      assignedToId: users['service2@test.com'].id,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const cd of complaintData) {
    await prisma.complaint.create({ data: cd });
  }
  console.log(`✅ ${complaintData.length} complaints created.`);

  // 7. Create Passes
  const passData = [
    {
      type: 'ONE_TIME',
      visitorName: 'Zomato Delivery',
      visitorPhone: '+91-9876543210',
      visitorType: 'DELIVERY',
      notes: 'Leave food at the door',
      qrToken: 'PASS-ZOMATO-A401',
      status: 'ACTIVE',
      expiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1000),
      residentId: users['resident1@test.com'].id,
      flatId: flats['A-401'].id,
      societyId: society.id,
    },
    {
      type: 'ONE_TIME',
      visitorName: 'Uber Cab',
      visitorPhone: '+91-9876543211',
      visitorType: 'CAB',
      notes: 'Pick up at entrance lobby',
      qrToken: 'PASS-UBER-A402',
      status: 'ACTIVE',
      expiresAt: new Date(now.getTime() + 6 * 60 * 60 * 1000),
      residentId: users['resident2@test.com'].id,
      flatId: flats['A-402'].id,
      societyId: society.id,
    },
    {
      type: 'RECURRING',
      visitorName: 'Sunita Verma',
      visitorPhone: '+91-9876543212',
      visitorType: 'HOUSEHOLD_WORKER',
      notes: 'Daily maid service',
      qrToken: 'PASS-MAID-A302',
      status: 'ACTIVE',
      allowedDays: [0, 1, 2, 3, 4, 5, 6],
      windowStart: '08:00',
      windowEnd: '11:00',
      validFrom: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      validUntil: new Date(now.getTime() + 150 * 24 * 60 * 60 * 1000),
      residentId: users['resident3@test.com'].id,
      flatId: flats['A-302'].id,
      societyId: society.id,
    },
    {
      type: 'ONE_TIME',
      visitorName: 'Rohan Gupta',
      visitorPhone: '+91-9876543213',
      visitorType: 'GUEST',
      notes: 'Weekend guest',
      qrToken: 'PASS-GUEST-A201',
      status: 'USED',
      expiresAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      residentId: users['resident_a201@test.com'].id,
      flatId: flats['A-201'].id,
      societyId: society.id,
    },
    {
      type: 'RECURRING',
      visitorName: 'Amazon Delivery',
      visitorType: 'DELIVERY',
      notes: 'Regular courier agent',
      qrToken: 'PASS-AMAZON-REG',
      status: 'ACTIVE',
      allowedDays: [1, 2, 3, 4, 5, 6],
      windowStart: '09:00',
      windowEnd: '18:00',
      validFrom: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      validUntil: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      residentId: users['resident_a202@test.com'].id,
      flatId: flats['A-202'].id,
      societyId: society.id,
    },
    {
      type: 'ONE_TIME',
      visitorName: 'Urban Company Plumber',
      visitorPhone: '+91-9876543214',
      visitorType: 'SERVICE_PROFESSIONAL',
      notes: 'Kitchen sink repair',
      qrToken: 'PASS-UC-A301',
      status: 'EXPIRED',
      expiresAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      residentId: users['resident_a301@test.com'].id,
      flatId: flats['A-301'].id,
      societyId: society.id,
    },
    {
      type: 'ONE_TIME',
      visitorName: 'Milk Delivery',
      visitorType: 'DELIVERY',
      notes: 'Daily milk supply',
      qrToken: 'PASS-MILK-A102',
      status: 'REVOKED',
      expiresAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      residentId: users['resident_a102@test.com'].id,
      flatId: flats['A-102'].id,
      societyId: society.id,
    },
    {
      type: 'ONE_TIME',
      visitorName: 'Sanjay Kumar',
      visitorPhone: '+91-9876543215',
      visitorType: 'GUEST',
      notes: 'Family visit',
      qrToken: 'PASS-FAMILY-A101',
      status: 'ACTIVE',
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      residentId: users['resident_a101@test.com'].id,
      flatId: flats['A-101'].id,
      societyId: society.id,
    },
  ];

  const passes = {};
  for (const pd of passData) {
    const pass = await prisma.pass.create({ data: pd });
    passes[pd.qrToken] = pass;
  }
  console.log(`✅ ${Object.keys(passes).length} passes created.`);

  // 8. Create Entry Logs
  const entryLogData = [
    {
      visitorName: 'Rahul Verma',
      visitorPhone: '+91-9988776655',
      visitorType: 'DELIVERY',
      method: 'LIVE_APPROVAL',
      status: 'APPROVED',
      notes: 'Swiggy Instamart delivery for Aarav Mehta',
      guardId: users['guard1@test.com'].id,
      residentId: users['resident1@test.com'].id,
      flatId: flats['A-401'].id,
      societyId: society.id,
      entryTime: new Date(now.getTime() - 30 * 60 * 1000),
      exitTime: null,
    },
    {
      visitorName: 'Sunita Verma',
      visitorPhone: '+91-9876543212',
      visitorType: 'HOUSEHOLD_WORKER',
      method: 'QR_SCAN',
      status: 'APPROVED',
      passId: passes['PASS-MAID-A302'].id,
      guardId: users['guard2@test.com'].id,
      residentId: users['resident3@test.com'].id,
      flatId: flats['A-302'].id,
      societyId: society.id,
      entryTime: new Date(now.getTime() - 60 * 60 * 1000),
      exitTime: null,
    },
    {
      visitorName: 'Zomato Delivery',
      visitorPhone: '+91-9876543210',
      visitorType: 'DELIVERY',
      method: 'QR_SCAN',
      status: 'APPROVED',
      passId: passes['PASS-ZOMATO-A401'].id,
      guardId: users['guard1@test.com'].id,
      residentId: users['resident1@test.com'].id,
      flatId: flats['A-401'].id,
      societyId: society.id,
      entryTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      exitTime: new Date(now.getTime() - (2 * 60 * 60 * 1000) + 15 * 60 * 1000),
    },
    {
      visitorName: 'Rohan Gupta',
      visitorPhone: '+91-9876543213',
      visitorType: 'GUEST',
      method: 'QR_SCAN',
      status: 'APPROVED',
      passId: passes['PASS-GUEST-A201'].id,
      guardId: users['guard3@test.com'].id,
      residentId: users['resident_a201@test.com'].id,
      flatId: flats['A-201'].id,
      societyId: society.id,
      entryTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      exitTime: new Date(now.getTime() - 21 * 60 * 60 * 1000),
    },
    {
      visitorName: 'Unknown Solicitor',
      visitorPhone: '+91-9555544433',
      visitorType: 'GUEST',
      method: 'LIVE_APPROVAL',
      status: 'REJECTED',
      notes: 'Unidentified person. Resident denied entry request.',
      guardId: users['guard2@test.com'].id,
      residentId: users['resident2@test.com'].id,
      flatId: flats['A-402'].id,
      societyId: society.id,
      entryTime: new Date(now.getTime() - 25 * 60 * 60 * 1000),
      exitTime: null,
    },
    {
      visitorName: 'Amazon Delivery',
      visitorType: 'DELIVERY',
      method: 'QR_SCAN',
      status: 'APPROVED',
      passId: passes['PASS-AMAZON-REG'].id,
      guardId: users['guard1@test.com'].id,
      residentId: users['resident_a202@test.com'].id,
      flatId: flats['A-202'].id,
      societyId: society.id,
      entryTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      exitTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
    },
    {
      visitorName: 'Urban Company Plumber',
      visitorPhone: '+91-9876543214',
      visitorType: 'SERVICE_PROFESSIONAL',
      method: 'QR_SCAN',
      status: 'APPROVED',
      passId: passes['PASS-UC-A301'].id,
      guardId: users['guard3@test.com'].id,
      residentId: users['resident_a301@test.com'].id,
      flatId: flats['A-301'].id,
      societyId: society.id,
      entryTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000),
      exitTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
    },
    {
      visitorName: 'Dunzo Courier',
      visitorPhone: '+91-9888877777',
      visitorType: 'DELIVERY',
      method: 'LIVE_APPROVAL',
      status: 'APPROVED',
      guardId: users['guard1@test.com'].id,
      residentId: users['resident_a101@test.com'].id,
      flatId: flats['A-101'].id,
      societyId: society.id,
      entryTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      exitTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000),
    },
    {
      visitorName: 'Swiggy Delivery',
      visitorPhone: '+91-9777766666',
      visitorType: 'DELIVERY',
      method: 'LIVE_APPROVAL',
      status: 'APPROVED',
      guardId: users['guard2@test.com'].id,
      residentId: users['resident2@test.com'].id,
      flatId: flats['A-402'].id,
      societyId: society.id,
      entryTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
      exitTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000 + 8 * 60 * 1000),
    },
    {
      visitorName: 'Aaradhya Sen',
      visitorPhone: '+91-9123456789',
      visitorType: 'GUEST',
      method: 'MANUAL_LOOKUP',
      status: 'APPROVED',
      guardId: users['guard3@test.com'].id,
      residentId: users['resident_a102@test.com'].id,
      flatId: flats['A-102'].id,
      societyId: society.id,
      entryTime: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      exitTime: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
    },
    {
      visitorName: 'Carpentry Help',
      visitorPhone: '+91-9111122222',
      visitorType: 'SERVICE_PROFESSIONAL',
      method: 'LIVE_APPROVAL',
      status: 'APPROVED',
      guardId: users['guard1@test.com'].id,
      residentId: users['resident_a202@test.com'].id,
      flatId: flats['A-202'].id,
      societyId: society.id,
      entryTime: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000),
      exitTime: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000),
    },
    {
      visitorName: 'DHL Express',
      visitorPhone: '+91-9222233333',
      visitorType: 'DELIVERY',
      method: 'LIVE_APPROVAL',
      status: 'APPROVED',
      guardId: users['guard2@test.com'].id,
      residentId: users['resident1@test.com'].id,
      flatId: flats['A-401'].id,
      societyId: society.id,
      entryTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      exitTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
    },
    {
      visitorName: 'Electrician',
      visitorPhone: '+91-9333344444',
      visitorType: 'SERVICE_PROFESSIONAL',
      method: 'LIVE_APPROVAL',
      status: 'APPROVED',
      guardId: users['guard3@test.com'].id,
      residentId: users['resident_a301@test.com'].id,
      flatId: flats['A-301'].id,
      societyId: society.id,
      entryTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
      exitTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000),
    },
    {
      visitorName: 'Uber Cab Driver',
      visitorPhone: '+91-9444455555',
      visitorType: 'CAB',
      method: 'MANUAL_LOOKUP',
      status: 'APPROVED',
      guardId: users['guard1@test.com'].id,
      residentId: users['resident3@test.com'].id,
      flatId: flats['A-302'].id,
      societyId: society.id,
      entryTime: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      exitTime: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
    },
    {
      visitorName: 'Suspicious Solicitor',
      visitorPhone: '+91-9000011111',
      visitorType: 'GUEST',
      method: 'MANUAL_LOOKUP',
      status: 'REJECTED',
      notes: 'Soliciting strictly prohibited. Guard denied entry.',
      guardId: users['guard2@test.com'].id,
      flatId: flats['A-101'].id,
      societyId: society.id,
      entryTime: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000),
      exitTime: null,
    },
  ];

  await EntryLog.insertMany(entryLogData);
  console.log(`✅ ${entryLogData.length} entry logs created.`);

  // 9. Create Notifications
  const notificationData = [
    {
      userId: users['admin@societyos.com'].id,
      type: 'COMPLAINT_FILED',
      title: 'New Complaint Filed',
      body: 'Aarav Mehta (A-401) filed a complaint: "Water Seepage in Master Bathroom"',
      isRead: false,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      userId: users['admin@societyos.com'].id,
      type: 'USER_REGISTERED',
      title: 'New User Registered',
      body: 'Amit Trivedi registered as Resident for Flat A-301 and is pending approval.',
      isRead: true,
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      userId: users['resident1@test.com'].id,
      type: 'VISITOR_APPROVED',
      title: 'Visitor Approved',
      body: 'Zomato Delivery entered the society gate.',
      isRead: true,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      userId: users['resident1@test.com'].id,
      type: 'COMPLAINT_ASSIGNED',
      title: 'Complaint Update',
      body: 'Your complaint "Water Seepage in Master Bathroom" has been assigned to Sunita Devi.',
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      userId: users['resident1@test.com'].id,
      type: 'NOTICE_PUBLISHED',
      title: 'New Notice Posted',
      body: 'Emergency Water Outage - 20th June has been posted by Admin User.',
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      userId: users['resident2@test.com'].id,
      type: 'VISITOR_REJECTED',
      title: 'Visitor Request Denied',
      body: 'Unknown Solicitor gate entry request was rejected.',
      isRead: true,
      createdAt: new Date(now.getTime() - 25 * 60 * 60 * 1000),
    },
    {
      userId: users['resident2@test.com'].id,
      type: 'COMPLAINT_ASSIGNED',
      title: 'Complaint Update',
      body: 'Your complaint "Corridor Lights Flickering" has been assigned to Ramesh Kumar.',
      isRead: false,
      createdAt: new Date(now.getTime() - 23 * 60 * 60 * 1000),
    },
  ];

  for (const nd of notificationData) {
    await prisma.notification.create({ data: nd });
  }
  console.log(`✅ ${notificationData.length} notifications created.`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' 🎉 Rich database seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await mongoose.disconnect();
  });

