import asyncHandler from 'express-async-handler';
import nodemailer from 'nodemailer';
import Order from '../Models/Order.js';
import Product from '../Models/Product.js';
import DeliveryArea from '../Models/DeliveryArea.js';
import { buildLineItems, applyCoupon, computeTotal, PricingError } from '../utils/pricing.js';

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_delivery: 'Out for delivery',
  reached: 'Delivered',
  canceled: 'Canceled',
};

// Resolve the shipping cost from the DB, never from the client.
async function resolveShipping(wilaya, deliveryType) {
  const area = await DeliveryArea.findOne({ wilaya });
  if (!area) throw new PricingError(`We do not deliver to "${wilaya}" yet`);
  return deliveryType === 'home' ? area.priceHome : area.priceDesk;
}

// POST /api/orders/create  (optionalAuth — links to account if logged in)
export const createOrder = asyncHandler(async (req, res) => {
  const { customerName, phone, customerEmail, wilaya, address, desk, deliveryType, items, couponCode } =
    req.body;

  if (!customerName || !phone || !wilaya || !deliveryType || !items?.length) {
    res.status(400);
    throw new Error('Please fill in all required fields');
  }
  if (deliveryType === 'home' && !address) {
    res.status(400);
    throw new Error('An address is required for home delivery');
  }
  if (deliveryType === 'desk' && !desk) {
    res.status(400);
    throw new Error('A pickup point is required');
  }

  try {
    // 1. Re-price the cart from the database (client prices are ignored).
    const { items: lineItems, subtotal } = await buildLineItems(items);

    // 2. Resolve shipping + coupon server-side.
    const baseShipping = await resolveShipping(wilaya, deliveryType);
    const { coupon, discount, shipping } = await applyCoupon(couponCode, subtotal, baseShipping);
    const totalPrice = computeTotal({ subtotal, discount, shipping });

    // 3. Decrement stock atomically per line item (guards against oversell).
    for (const item of lineItems) {
      if (item.variantId) {
        const ok = await Product.updateOne(
          { _id: item.productId, 'variants._id': item.variantId, 'variants.stock': { $gte: item.quantity } },
          { $inc: { 'variants.$.stock': -item.quantity, stock: -item.quantity } }
        );
        if (ok.modifiedCount === 0) {
          throw new PricingError(`"${item.name}" just sold out in that size`);
        }
      } else {
        const ok = await Product.updateOne(
          { _id: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } }
        );
        if (ok.modifiedCount === 0) {
          throw new PricingError(`"${item.name}" just sold out`);
        }
      }
    }

    // 4. Persist the order with server-computed totals.
    const order = await Order.create({
      customer: req.user?._id || null,
      customerName: customerName.trim(),
      phone: phone.trim(),
      customerEmail: customerEmail?.trim() || null,
      wilaya,
      address: deliveryType === 'home' ? address?.trim() : null,
      desk: deliveryType === 'desk' ? desk?.trim() : null,
      deliveryType,
      deliveryPrice: shipping,
      items: lineItems,
      subtotal,
      couponCode: coupon?.code || null,
      discount,
      totalPrice,
      status: 'pending',
    });

    if (coupon) {
      await coupon.updateOne({ $inc: { usedCount: 1 } });
    }

    res.status(201).json({
      success: true,
      message: 'Order placed. We will be in touch shortly.',
      orderId: order._id,
      orderNumber: order.orderNumber,
      totalPrice,
    });
  } catch (err) {
    if (err instanceof PricingError) {
      res.status(err.status);
      throw new Error(err.message);
    }
    throw err;
  }
});

// GET /api/orders/mine  (customer)
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json(orders);
});

// GET /api/orders/:id  (owner or admin)
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).lean();
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  const isAdmin = req.user.usertype === 'admin' || req.user.usertype === 'superadmin';
  if (!isAdmin && String(order.customer) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }
  res.json(order);
});

// PUT /api/orders/:id/status  (admin)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!Object.keys(STATUS_LABELS).includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.status = status;
  order.statusHistory.push({ status, at: new Date() });
  await order.save();

  if (order.customerEmail && process.env.EMAIL_USER) {
    sendStatusEmail(order, status).catch((err) => console.error('Email error:', err));
  }

  res.json({ success: true, order });
});

// GET /api/orders  (admin) — paginated + status filter
export const getAllOrders = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
  if (req.query.search) {
    query.$or = [
      { orderNumber: { $regex: req.query.search, $options: 'i' } },
      { customerName: { $regex: req.query.search, $options: 'i' } },
      { phone: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
  res.json(orders);
});

async function sendStatusEmail(order, status) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: auto; padding: 32px; color:#17130e;">
      <h2 style="font-weight:400; letter-spacing:.02em;">Hello ${order.customerName},</h2>
      <p>The status of your order has been updated to:</p>
      <p style="font-size:22px; letter-spacing:.06em; text-transform:uppercase;">${STATUS_LABELS[status]}</p>
      <p>Order reference: <strong>${order.orderNumber}</strong></p>
      <p style="color:#8a8272;">Thank you for shopping with us.</p>
    </div>`;

  await transporter.sendMail({
    from: `"ATELIER" <${process.env.EMAIL_USER}>`,
    to: order.customerEmail,
    subject: `Your ATELIER order ${order.orderNumber} — ${STATUS_LABELS[status]}`,
    html,
  });
}
