/**
 * PricingUtil — Centralised pricing calculations for the checkout pipeline.
 *
 * GST is calculated at 18% (applicable to herbal cosmetics under HSN 33 / 34).
 * Free delivery is granted on orders whose subtotal meets the threshold.
 */
export class PricingUtil {
  /** 18 % GST — adjust if product-specific rates are introduced later */
  static readonly GST_RATE = 0.18;

  /** Subtotal (pre-tax) above which delivery is free */
  static readonly FREE_DELIVERY_THRESHOLD = 999;

  /** Flat delivery charge applied when the threshold is not met */
  static readonly STANDARD_DELIVERY_CHARGE = 50;

  /**
   * Calculate all financial totals for a set of cart/order line-items.
   *
   * Returns values compatible with the Prisma Order model fields:
   *   subtotal  → pre-tax item total
   *   tax       → GST amount
   *   deliveryFee → delivery charge (0 if free delivery)
   *   totalAmount → the amount to be charged to the customer
   */
  static calculateCartTotals(items: { price: number; quantity: number }[]): {
    subtotal: number;
    tax: number;
    deliveryFee: number;
    totalAmount: number;
  } {
    const subtotal = parseFloat(
      items.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2),
    );

    const tax = parseFloat((subtotal * this.GST_RATE).toFixed(2));

    const deliveryFee =
      subtotal >= this.FREE_DELIVERY_THRESHOLD ? 0 : this.STANDARD_DELIVERY_CHARGE;

    const totalAmount = parseFloat((subtotal + tax + deliveryFee).toFixed(2));

    return { subtotal, tax, deliveryFee, totalAmount };
  }
}
