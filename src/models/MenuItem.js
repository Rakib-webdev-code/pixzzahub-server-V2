import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    itemName: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: [
        'Classic Pizzas',
        'Vegetarian Pizzas',
        'Meat Lovers',
        'Specialty / Gourmet Pizzas',
        'Sides & Appetizers',
        'Beverages & Desserts',
      ],
    },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    location: { type: String, required: true },
    images: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'inactive'],
      default: 'pending',
      index: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

menuItemSchema.index({ itemName: 'text', description: 'text' });

export default mongoose.model('MenuItem', menuItemSchema);