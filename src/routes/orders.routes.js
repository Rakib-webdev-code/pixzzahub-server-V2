import { Router } from 'express';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import User from '../models/User.js';
import { verifyJWT, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { sendOrderStatusEmail } from '../utils/mailer.js';

const router = Router();

router.post('/', verifyJWT, requireRole('customer'),
  validate(['itemId', 'deliveryDate', 'deliveryAddress']),
  async (req, res) => {
    try {
      const item = await MenuItem.findById(req.body.itemId);
      if (!item || item.status !== 'approved' || !item.isActive)
        return res.status(400).json({ message: 'Item not orderable' });

      if (String(item.vendorId) === String(req.user._id))
        return res.status(403).json({ message: 'You cannot order your own item' });

      const deliveryDate = new Date(req.body.deliveryDate);
      const dup = await Order.findOne({
        customerId: req.user._id, itemId: item._id, deliveryDate,
        status: { $in: ['pending', 'accepted'] },
      });
      if (dup) return res.status(409).json({ message: 'You already have an active order for this item on this date' });

      const order = await Order.create({
        itemId: item._id, vendorId: item.vendorId, customerId: req.user._id,
        deliveryDate, deliveryAddress: req.body.deliveryAddress,
        message: req.body.message || '', status: 'pending',
      });
      res.status(201).json(order);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

router.get('/mine', verifyJWT, requireRole('customer'), async (req, res) => {
  const orders = await Order.find({ customerId: req.user._id })
    .populate('itemId', 'itemName images price')
    .populate('vendorId', 'name businessName image')
    .sort({ createdAt: -1 }).lean();
  res.json(orders);
});

router.patch('/:id/cancel', verifyJWT, requireRole('customer'), async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (String(order.customerId) !== String(req.user._id))
    return res.status(403).json({ message: 'Not your order' });
  if (order.status !== 'pending')
    return res.status(400).json({ message: 'Only pending orders can be cancelled' });
  order.status = 'cancelled';
  await order.save();
  res.json(order);
});

router.get('/vendor', verifyJWT, requireRole('vendor'), async (req, res) => {
  const orders = await Order.find({ vendorId: req.user._id })
    .populate('itemId', 'itemName images price')
    .populate('customerId', 'name email image')
    .sort({ createdAt: -1 }).lean();
  res.json(orders);
});

router.patch('/:id/decision', verifyJWT, requireRole('vendor'), async (req, res) => {
  const { decision } = req.body;
  if (!['accepted', 'rejected'].includes(decision))
    return res.status(400).json({ message: 'Invalid decision' });
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (String(order.vendorId) !== String(req.user._id))
    return res.status(403).json({ message: 'Not your order' });
  if (order.status !== 'pending')
    return res.status(400).json({ message: 'Only pending orders can be decided' });

  order.status = decision;
  await order.save();

  const customer = await User.findById(order.customerId);
  const item = await MenuItem.findById(order.itemId);
  if (customer && item) {
    sendOrderStatusEmail({
      to: customer.email, customerName: customer.name,
      itemName: item.itemName, status: decision,
    }).catch(() => {});
  }
  res.json(order);
});

router.get('/admin/all', verifyJWT, requireRole('admin'), async (_req, res) => {
  const orders = await Order.find()
    .populate('itemId', 'itemName')
    .populate('vendorId', 'name businessName')
    .populate('customerId', 'name email')
    .sort({ createdAt: -1 }).lean();
  res.json(orders);
});

export default router;