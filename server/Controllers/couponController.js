import asyncHandler from 'express-async-handler';
import Coupon from '../Models/Coupon.js';
import { applyCoupon, PricingError } from '../utils/pricing.js';

// POST /api/coupons/validate  { code, subtotal }  (public)
// Returns the discount the storefront may PREVIEW. Checkout re-validates.
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal = 0 } = req.body;
  if (!code) {
    res.status(400);
    throw new Error('Enter a coupon code');
  }
  try {
    const { coupon, discount } = await applyCoupon(code, Number(subtotal), 0);
    res.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount,
      freeShipping: coupon.type === 'free_shipping',
    });
  } catch (err) {
    if (err instanceof PricingError) {
      res.status(200).json({ valid: false, message: err.message });
    } else {
      throw err;
    }
  }
});

// ── Admin ────────────────────────────────────────────────────────────────────
export const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
  res.json(coupons);
});

export const createCoupon = asyncHandler(async (req, res) => {
  const { code, type, value } = req.body;
  if (!code || !type) {
    res.status(400);
    throw new Error('Code and type are required');
  }
  const exists = await Coupon.findOne({ code: code.toUpperCase().trim() });
  if (exists) {
    res.status(400);
    throw new Error('A coupon with this code already exists');
  }
  const coupon = await Coupon.create({
    code: code.toUpperCase().trim(),
    type,
    value: Number(value) || 0,
    minSubtotal: Number(req.body.minSubtotal) || 0,
    startsAt: req.body.startsAt || null,
    expiresAt: req.body.expiresAt || null,
    usageLimit: req.body.usageLimit ? Number(req.body.usageLimit) : null,
    active: req.body.active !== undefined ? req.body.active : true,
  });
  res.status(201).json(coupon);
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }
  const b = req.body;
  if (b.code) coupon.code = b.code.toUpperCase().trim();
  if (b.type) coupon.type = b.type;
  if (b.value !== undefined) coupon.value = Number(b.value);
  if (b.minSubtotal !== undefined) coupon.minSubtotal = Number(b.minSubtotal);
  if (b.startsAt !== undefined) coupon.startsAt = b.startsAt || null;
  if (b.expiresAt !== undefined) coupon.expiresAt = b.expiresAt || null;
  if (b.usageLimit !== undefined) coupon.usageLimit = b.usageLimit ? Number(b.usageLimit) : null;
  if (b.active !== undefined) coupon.active = b.active;
  await coupon.save();
  res.json(coupon);
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }
  await coupon.deleteOne();
  res.json({ message: 'Coupon deleted' });
});
