const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const env = require('../config/env');
const { School, User } = require('../models');
const generateLoginId = require('../utils/generateLoginId');

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'MLK@123456';

const sampleSchools = [
  {
    name: 'AVM Public School',
    code: 'AVMP',
    email: 'office@avmp.example.com',
    phone: '+91 98765 43001',
    academicYear: '2026-2027',
  },
];

async function upsertUser(userData) {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  return User.findOneAndUpdate(
    { loginId: userData.loginId },
    {
      $set: {
        ...userData,
        passwordHash,
        status: 'active',
      },
    },
    { new: true, upsert: true, runValidators: true }
  );
}

async function seedAuthData() {
  env.validateEnv();

  await mongoose.connect(env.mongoUri);

  const [school] = await Promise.all(
    sampleSchools.map((school) =>
      School.findOneAndUpdate({ code: school.code }, { $set: school }, { new: true, upsert: true, runValidators: true })
    )
  );

  await upsertUser({
    loginId: generateLoginId({ role: 'superadmin', sequence: 1 }),
    username: 'admin',
    firstName: 'Anuj',
    lastName: 'Gupta',
    email: 'admin@mlk-erp.example.com',
    role: 'superadmin',
    permissions: ['auth:read', 'auth:write', 'schools:read', 'schools:write', 'users:read', 'users:write'],
  });

  await upsertUser({
    school: school._id,
    loginId: generateLoginId({ role: 'admin', schoolCode: school.code, sequence: 1 }),
    username: 'admin.avmp',
    firstName: 'Sample',
    lastName: 'Admin',
    email: 'admin@avmp.example.com',
    phone: '+91 98765 43002',
    role: 'admin',
  });

  await upsertUser({
    school: school._id,
    loginId: generateLoginId({ role: 'principal', schoolCode: school.code, sequence: 1 }),
    username: 'principal.avmp',
    firstName: 'Sample',
    lastName: 'Principal',
    email: 'principal@avmp.example.com',
    phone: '+91 98765 43003',
    role: 'principal',
  });

  await upsertUser({
    school: school._id,
    loginId: generateLoginId({ role: 'teacher', schoolCode: school.code, sequence: 1 }),
    username: 'teacher.avmp',
    firstName: 'Sample',
    lastName: 'Teacher',
    email: 'teacher@avmp.example.com',
    phone: '+91 98765 43004',
    role: 'teacher',
  });

  console.log('Authentication seed completed.');
  console.log(`Default seed password: ${DEFAULT_PASSWORD}`);
  await mongoose.disconnect();
}

seedAuthData().catch(async (error) => {
  console.error('Authentication seed failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
