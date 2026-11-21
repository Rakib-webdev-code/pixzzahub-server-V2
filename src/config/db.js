import mongoose from 'mongoose';
import env from './env.js';

export default async function connectDB() {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGODB_URI, { dbName: env.DB_NAME });
    console.log(`[db] connected to ${env.DB_NAME}`);
  } catch (err) {
    console.error('[db] connection failed', err.message);
    throw err;
  }
}