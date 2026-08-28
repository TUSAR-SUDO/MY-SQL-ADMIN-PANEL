const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const prisma = require('./db');

const seed = async () => {
  try {
    await prisma.$connect();
    console.log('MySQL connected via Prisma');

    const email = 'admin@gamecenter.com';
    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      console.log('Super admin already exists. Skipping creation.');
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.admin.create({
      data: {
        name: 'Super Admin',
        email,
        passwordHash,
        role: 'super_admin',
      },
    });

    console.log('Super admin created:');
    console.log('  Email: admin@gamecenter.com');
    console.log('  Password: admin123');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

seed();