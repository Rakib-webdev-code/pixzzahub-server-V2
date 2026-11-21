import { Router } from 'express';
import User from '../models/User.js';
import { verifyJWT, requireRole } from '../middleware/auth.js';

const router = Router();

router.patch('/me', verifyJWT, async (req, res) => {
  const allowed = ['name', 'image', 'businessName'];
  const update = {};
  for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];
  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    businessName: user.businessName,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
  });
});

router.post('/me/favorites/:itemId', verifyJWT, async (req, res) => {
  const u = await User.findById(req.user._id);
  const id = req.params.itemId;
  if (!u.favorites.includes(id)) u.favorites.push(id);
  else u.favorites = u.favorites.filter((f) => String(f) !== id);
  await u.save();
  res.json({ favorites: u.favorites });
});

router.get('/', verifyJWT, requireRole('admin'), async (req, res) => {
  const { search = '', role } = req.query;
  const q = {};
  if (search) q.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
  if (role) q.role = role;
  const users = await User.find(q).sort({ createdAt: -1 }).lean();
  res.json(users);
});

router.patch('/:id/block', verifyJWT, requireRole('admin'), async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: true }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ id: user._id, isBlocked: user.isBlocked });
});

router.patch('/:id/unblock', verifyJWT, requireRole('admin'), async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ id: user._id, isBlocked: user.isBlocked });
});

export default router;