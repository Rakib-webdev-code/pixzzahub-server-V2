import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    emailVerified: { type: Boolean, default: false },
    image: { type: String, default: "" },

    role: {
      type: String,
      enum: ["vendor", "customer", "admin"],
      default: "customer",
      index: true,
    },
    isBlocked: { type: Boolean, default: false },
    businessName: { type: String, default: "" },
    subscriptionPlan: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },
    subscriptionExpiresAt: { type: Date, default: null },
    favorites: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "MenuItem",
      default: [],
    },
  },
  { timestamps: true, strict: false, collection: "users" },
);

export default mongoose.model("User", userSchema);
