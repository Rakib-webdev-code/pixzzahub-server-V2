import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME || 'pizzahub' });
  const email = process.env.ADMIN_EMAIL || 'admin@pizzahub.com';
  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    await existing.save();
    console.log('[seed] promoted existing user to admin:', email);
  } else {
    await User.create({
      name: process.env.ADMIN_NAME || 'PizzaHub Admin',
      email,
      role: 'admin',
      emailVerified: true,
    });
    console.log('[seed] created admin:', email, '— register this email in Better Auth with password:', process.env.ADMIN_PASSWORD);
  }
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });