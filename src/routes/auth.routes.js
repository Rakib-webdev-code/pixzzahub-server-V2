import { Router } from 'express';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { verifyJWT } from '../middleware/auth.js';

const router = Router();

router.post('/sync', async (req, res) => {
  try {
    const { name, email, image, role } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    let user = await User.findOne({ email });
    if (!user) {
      const safeRole = role === 'vendor' ? 'vendor' : 'customer';
      user = await User.create({ name: name || email, email, image: image || '', role: safeRole });
    } else if (image && !user.image) {
      user.image = image;
      await user.save();
    }

    if (user.isBlocked) return res.status(403).json({ message: 'Account blocked' });

    const token = signToken({ sub: user._id, role: user.role });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        businessName: user.businessName,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        isBlocked: user.isBlocked,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', verifyJWT, (req, res) => {
  const u = req.user;
  res.json({
    id: u._id,
    name: u.name,
    email: u.email,
    image: u.image,
    role: u.role,
    businessName: u.businessName,
    subscriptionPlan: u.subscriptionPlan,
    subscriptionExpiresAt: u.subscriptionExpiresAt,
    isBlocked: u.isBlocked,
    favorites: u.favorites,
  });
});

export default router;