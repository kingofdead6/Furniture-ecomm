import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    // Human-friendly reference shown to the customer (e.g. AT-000123).
    orderNumber: { type: String, unique: true, index: true },

    // Set when a logged-in customer places the order; null for guest checkout.
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },

    wilaya: { type: String, required: true },
    address: { type: String },
    desk: { type: String },
    deliveryType: { type: String, enum: ['home', 'desk'], required: true },

    deliveryPrice: { type: Number, default: 0 },

    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        variantId: { type: mongoose.Schema.Types.ObjectId },
        name: String,
        slug: String,
        size: String,
        color: String,
        sku: String,
        price: Number, // unit price, re-derived server-side at checkout
        image: String,
        quantity: Number,
      },
    ],

    subtotal: { type: Number, required: true },
    couponCode: { type: String, default: null },
    discount: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_delivery', 'reached', 'canceled'],
      default: 'pending',
    },
    // Append-only audit trail of every status transition.
    statusHistory: [
      {
        status: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Assign a sequential, zero-padded order number before the first save.
// Async pre-save hook: Mongoose does not pass `next` to async middleware, so
// we resolve the promise instead of calling next().
orderSchema.pre('save', async function () {
  if (this.isNew && !this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `AT-${String(count + 1).padStart(6, '0')}`;
    this.statusHistory = [{ status: this.status, at: new Date() }];
  }
});

export default mongoose.model('Order', orderSchema);
