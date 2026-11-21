import { Router } from 'express';
import Stripe from 'stripe';
import env from '../config/env.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { verifyJWT, requireRole } from '../middleware/auth.js';

const router = Router();
const stripe = new Stripe(env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

router.post('/checkout', verifyJWT, requireRole('vendor'), async (req, res) => {
  try {
    const vendor = req.user;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: env.STRIPE_CURRENCY,
            unit_amount: env.PREMIUM_PRICE_CENTS,
            product_data: { name: 'PizzaHub Premium Subscription (30 days)' },
          },
          quantity: 1,
        },
      ],
      metadata: { vendorId: String(vendor._id), plan: 'premium' },
      success_url: `${env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.CLIENT_URL}/payment/cancel`,
    });

    await Transaction.create({
      vendorId: vendor._id, plan: 'premium',
      amount: env.PREMIUM_PRICE_CENTS, currency: env.STRIPE_CURRENCY,
      stripeSessionId: session.id, status: 'pending',
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe] webhook signature failed', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (session.payment_status === 'paid') {
        const vendorId = session.metadata?.vendorId;
        await Transaction.findOneAndUpdate(
          { stripeSessionId: session.id },
          { status: 'paid', stripeSubscriptionId: session.subscription || '' },
          { new: true }
        );
        if (vendorId) {
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + 30);
          await User.findByIdAndUpdate(vendorId, {
            subscriptionPlan: 'premium',
            subscriptionExpiresAt: expiry,
          });
        }
      }
    } else if (
      event.type === 'checkout.session.expired' ||
      event.type === 'checkout.session.async_payment_failed'
    ) {
      const session = event.data.object;
      await Transaction.findOneAndUpdate({ stripeSessionId: session.id }, { status: 'failed' });
    }
    res.json({ received: true });
  } catch (err) {
    console.error('[stripe] handler error', err);
    res.status(500).json({ message: 'Webhook handler error' });
  }
});

router.get('/session/:id', verifyJWT, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id);
    if (session.metadata?.vendorId !== String(req.user._id))
      return res.status(403).json({ message: 'Forbidden' });
    res.json({
      status: session.payment_status,
      amount: session.amount_total,
      currency: session.currency,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;