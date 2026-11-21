import dotenv from 'dotenv';
dotenv.config();

const required = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`[env] Missing required env var: ${key}`);
    process.exit(1);
  }
}

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  MONGODB_URI: process.env.MONGODB_URI,
  DB_NAME: process.env.DB_NAME || 'pizzahub',
  JWT_SECRET: process.env.JWT_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  PREMIUM_PRICE_CENTS: Number(process.env.PREMIUM_PRICE_CENTS || 999),
  STRIPE_CURRENCY: process.env.STRIPE_CURRENCY || 'usd',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  IMGBB_API_KEY: process.env.IMGBB_API_KEY || '',
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: Number(process.env.SMTP_PORT || 465),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  MAIL_FROM: process.env.MAIL_FROM || 'PizzaHub <noreply@pizzahub.com>',
};

export default env;