import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import env from './config/env.js';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import menuItemsRoutes from './routes/menuItems.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import transactionsRoutes from './routes/transactions.routes.js';
import stripeRoutes from './routes/stripe.routes.js';
import uploadRoutes from './routes/upload.routes.js';

const app = express();

let dbReady = null;
function ensureDB() {
  if (!dbReady) dbReady = connectDB();
  return dbReady;
}
app.use(async (_req, res, next) => {
  try { await ensureDB(); next(); }
  catch { res.status(500).json({ message: 'DB connection failed' }); }
});

app.use(helmet());
app.use(cors({
  origin: [env.CLIENT_URL, 'http://localhost:3000'],
  credentials: true,
}));
app.use(morgan('dev'));

app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 200 }));

app.get('/', (_req, res) => res.json({ ok: true, service: 'pizzahub-api' }));
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'pizzahub-api' }));



app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

if (process.env.VERCEL !== '1') {
  const PORT = env.PORT || 5000;
  ensureDB().then(() => {
    app.listen(PORT, () => console.log(`[api] listening on :${PORT}`));
  });
}

export default app;