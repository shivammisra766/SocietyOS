const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign(
  { id: 'some-admin-id', role: 'ADMIN', societyId: 'default-society-id' },
  process.env.JWT_SECRET || 'societyos_super_secret',
  { expiresIn: '1h' }
);

console.log("Token:", token);
