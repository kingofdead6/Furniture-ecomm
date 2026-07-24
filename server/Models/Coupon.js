import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: {
      type: String,
      enum: ['percent', 'fixed', 'free_shipping'],
      required: true,
    },
    // Meaning depends on type: percent → 0-100, fixed → currency amount,
    // free_shipping → ignored.
    value: { type: Number, default: 0, min: 0 },
    minSubtotal: { type: Number, default: 0, min: 0 },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    usageLimit: { type: Number, default: null }, // null = unlimited
    usedCount: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Returns { valid, reason }. Server-authoritative — the storefront never
// decides on its own whether a coupon applies.
couponSchema.methods.checkValidity = function (subtotal) {
  const now = new Date();
  if (!this.active) return { valid: false, reason: 'This code is no longer active' };
  if (this.startsAt && now < this.startsAt) return { valid: false, reason: 'This code is not active yet' };
  if (this.expiresAt && now > this.expiresAt) return { valid: false, reason: 'This code has expired' };
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit)
    return { valid: false, reason: 'This code has reached its usage limit' };
  if (subtotal < this.minSubtotal)
    return { valid: false, reason: `Spend at least ${this.minSubtotal} to use this code` };
  return { valid: true, reason: null };
};

export default mongoose.model('Coupon', couponSchema);
