import { Router } from 'express';
import Transaction from '../models/Transaction.js';
import { verifyJWT, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyJWT, requireRole('admin'), async (_req, res) => {
  const tx = await Transaction.find()
    .populate('vendorId', 'name email businessName')
    .sort({ createdAt: -1 }).lean();
  res.json(tx);
});

export default router;