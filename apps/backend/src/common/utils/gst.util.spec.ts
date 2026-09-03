import { PricingUtil } from './gst.util';

describe('PricingUtil (Phase 8 — GST & Pricing)', () => {
  describe('calculateCartTotals()', () => {
    it('should calculate subtotal correctly', () => {
      const items = [{ price: 849, quantity: 2 }];
      const result = PricingUtil.calculateCartTotals(items);
      expect(result.subtotal).toBe(1698);
    });

    it('should calculate 18% GST correctly', () => {
      const items = [{ price: 849, quantity: 2 }]; // subtotal = 1698
      const result = PricingUtil.calculateCartTotals(items);
      // 1698 * 0.18 = 305.64
      expect(result.tax).toBe(305.64);
    });

    it('should apply free delivery for orders >= ₹999', () => {
      const items = [{ price: 999, quantity: 1 }];
      const result = PricingUtil.calculateCartTotals(items);
      expect(result.deliveryFee).toBe(0);
    });

    it('should apply ₹50 delivery charge for orders below ₹999', () => {
      const items = [{ price: 500, quantity: 1 }];
      const result = PricingUtil.calculateCartTotals(items);
      expect(result.deliveryFee).toBe(50);
    });

    it('should compute correct totalAmount (subtotal + tax + delivery)', () => {
      const items = [{ price: 500, quantity: 1 }]; // subtotal=500, tax=90, delivery=50 → total=640
      const result = PricingUtil.calculateCartTotals(items);
      expect(result.totalAmount).toBe(640);
    });

    it('should handle multiple items correctly', () => {
      const items = [
        { price: 400, quantity: 2 }, // 800
        { price: 200, quantity: 1 }, // 200
      ]; // subtotal = 1000 → free delivery
      const result = PricingUtil.calculateCartTotals(items);
      expect(result.subtotal).toBe(1000);
      expect(result.deliveryFee).toBe(0);
      expect(result.tax).toBe(180);
      expect(result.totalAmount).toBe(1180);
    });

    it('should return 0 for empty cart', () => {
      const result = PricingUtil.calculateCartTotals([]);
      expect(result.subtotal).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.totalAmount).toBe(50); // delivery fee on ₹0 subtotal
    });

    it('GST_RATE should be 18%', () => {
      expect(PricingUtil.GST_RATE).toBe(0.18);
    });

    it('FREE_DELIVERY_THRESHOLD should be ₹999', () => {
      expect(PricingUtil.FREE_DELIVERY_THRESHOLD).toBe(999);
    });
  });
});
