import { Router } from 'express';
import MenuItem from '../models/MenuItem.js';
import User from '../models/User.js';
import { verifyJWT, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { search = '', category, location, sort, page = 1, limit = 12 } = req.query;
    const q = { status: 'approved', isActive: true };
    if (search) q.itemName = new RegExp(search, 'i');
    if (category) q.category = category;
    if (location) q.location = new RegExp(location, 'i');

    const sortObj = sort === 'price_asc' ? { price: 1 } : sort === 'price_desc' ? { price: -1 } : { createdAt: -1 };
    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      MenuItem.find(q)
        .populate('vendorId', 'name businessName subscriptionPlan image')
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      MenuItem.countDocuments(q),
    ]);

    res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findOne({ _id: req.params.id, status: 'approved', isActive: true })
      .populate('vendorId', 'name businessName image subscriptionPlan');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch {
    res.status(400).json({ message: 'Invalid id' });
  }
});

router.get('/vendor/mine', verifyJWT, requireRole('vendor'), async (req, res) => {
  const items = await MenuItem.find({ vendorId: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json(items);
});

router.post('/', verifyJWT, requireRole('vendor'),
  validate(['itemName', 'category', 'description', 'price', 'location', 'images']),
  async (req, res) => {
    try {
      const vendor = await User.findById(req.user._id);
      const isPremium =
        vendor.subscriptionPlan === 'premium' &&
        vendor.subscriptionExpiresAt &&
        vendor.subscriptionExpiresAt > new Date();

      if (!isPremium) {
        const activeCount = await MenuItem.countDocuments({
          vendorId: vendor._id,
          status: { $in: ['pending', 'approved'] },
          isActive: true,
        });
        if (activeCount >= 3)
          return res.status(403).json({ message: 'Free plan allows max 3 active items. Upgrade to premium.' });
      }

      const { itemName, category, description, price, location, images } = req.body;
      const item = await MenuItem.create({
        vendorId: vendor._id,
        itemName, category, description, price, location,
        images: Array.isArray(images) ? images : [images],
        status: 'pending',
      });
      res.status(201).json(item);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

router.patch('/:id', verifyJWT, requireRole('vendor'), async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  if (String(item.vendorId) !== String(req.user._id))
    return res.status(403).json({ message: 'Not your item' });

  const allowed = ['itemName', 'category', 'description', 'price', 'location', 'images', 'isActive'];
  for (const k of allowed) if (req.body[k] !== undefined) item[k] = req.body[k];
  await item.save();
  res.json(item);
});

router.delete('/:id', verifyJWT, requireRole('vendor'), async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  if (String(item.vendorId) !== String(req.user._id))
    return res.status(403).json({ message: 'Not your item' });
  await item.deleteOne();
  res.json({ ok: true });
});

router.get('/admin/all', verifyJWT, requireRole('admin'), async (req, res) => {
  const { search = '', status, category } = req.query;
  const q = {};
  if (search) q.itemName = new RegExp(search, 'i');
  if (status) q.status = status;
  if (category) q.category = category;
  const items = await MenuItem.find(q)
    .populate('vendorId', 'name businessName email')
    .sort({ createdAt: -1 })
    .lean();
  res.json(items);
});

router.patch('/:id/status', verifyJWT, requireRole('admin'), async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected', 'inactive'].includes(status))
    return res.status(400).json({ message: 'Invalid status' });
  const item = await MenuItem.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!item) return res.status(404).json({ message: 'Item not found' });
  res.json(item);
});

router.delete('/admin/:id', verifyJWT, requireRole('admin'), async (req, res) => {
  await MenuItem.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;