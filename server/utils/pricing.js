import Product from '../Models/Product.js';
import Coupon from '../Models/Coupon.js';

// ─────────────────────────────────────────────────────────────────────────────
// Server-authoritative pricing.
//
// The client sends only { productId, variantId?, quantity }. Prices, stock, and
// discounts are ALWAYS recomputed here from the database — a tampered client
// payload can never change what a customer is charged. Both the checkout flow
// and the "validate coupon" endpoint call this so the numbers can never diverge.
// ─────────────────────────────────────────────────────────────────────────────

export class PricingError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Resolve a raw client cart into priced, stock-checked line items.
 * @returns {Promise<{ items, subtotal }>}
 */
export async function buildLineItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new PricingError('Your cart is empty');
  }

  const items = [];
  let subtotal = 0;

  for (const raw of rawItems) {
    const quantity = Math.max(1, parseInt(raw.quantity, 10) || 1);
    const product = await Product.findById(raw.productId).lean();
    if (!product || product.status !== 'active') {
      throw new PricingError(`A product in your cart is no longer available`);
    }

    let variant = null;
    if (product.variants && product.variants.length > 0) {
      variant = product.variants.find((v) => String(v._id) === String(raw.variantId));
      if (!variant) {
        throw new PricingError(`Please choose a size and colour for "${product.name}"`);
      }
      if (variant.stock < quantity) {
        throw new PricingError(
          `Only ${variant.stock} left of "${product.name}" (${variant.size} / ${variant.color})`
        );
      }
    } else if ((product.stock ?? 0) < quantity) {
      throw new PricingError(`Only ${product.stock} left of "${product.name}"`);
    }

    const unitPrice = variant?.priceOverride ?? product.price;
    subtotal += unitPrice * quantity;

    items.push({
      productId: product._id,
      variantId: variant?._id || null,
      name: product.name,
      slug: product.slug,
      size: variant?.size || null,
      color: variant?.color || null,
      sku: variant?.sku || null,
      price: unitPrice,
      image: product.images?.[0]?.url || null,
      quantity,
    });
  }

  return { items, subtotal };
}

/**
 * Resolve and validate a coupon against a subtotal + shipping cost.
 * @returns {Promise<{ coupon, discount, shipping }>}
 */
export async function applyCoupon(code, subtotal, shipping) {
  if (!code) return { coupon: null, discount: 0, shipping };

  const coupon = await Coupon.findOne({ code: String(code).toUpperCase().trim() });
  if (!coupon) throw new PricingError('Invalid coupon code');

  const { valid, reason } = coupon.checkValidity(subtotal);
  if (!valid) throw new PricingError(reason);

  let discount = 0;
  let adjustedShipping = shipping;

  if (coupon.type === 'percent') {
    discount = Math.round((subtotal * coupon.value) / 100);
  } else if (coupon.type === 'fixed') {
    discount = Math.min(coupon.value, subtotal);
  } else if (coupon.type === 'free_shipping') {
    adjustedShipping = 0;
  }

  return { coupon, discount, shipping: adjustedShipping };
}

/** Final money math used by both checkout and the coupon preview endpoint. */
export function computeTotal({ subtotal, discount = 0, shipping = 0 }) {
  return Math.max(0, subtotal - discount) + shipping;
}
