import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: String, enum: ['premium'], default: 'premium' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    stripeSessionId: { type: String, required: true, index: true, unique: true },
    stripeSubscriptionId: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'expired'], default: 'pending' },
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);