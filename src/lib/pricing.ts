export const FREE_DELIVERY_THRESHOLD_CENTS = 5000; // $50.00
export const STANDARD_DELIVERY_FEE_CENTS = 399; // $3.99

export interface PricedCartItem {
  priceCents: number;
  quantity: number;
}

export interface ApplicableCoupon {
  code: string;
  discountType: 'percent' | 'fixed' | string;
  discountValue: number;
  minOrderCents: number;
  isActive: boolean;
  maxUses?: number | null;
  usedCount?: number;
  expiresAt?: Date | string | null;
}

export interface OrderTotals {
  subtotalCents: number;
  discountCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  freeDeliveryRemainingCents: number;
}

export function calculateSubtotalCents(items: PricedCartItem[]): number {
  return items.reduce((sum, item) => {
    const qty = Math.max(0, Math.floor(item.quantity));
    const price = Math.max(0, Math.round(item.priceCents));
    return sum + price * qty;
  }, 0);
}

export function isCouponValid(
  coupon: ApplicableCoupon | null | undefined,
  subtotalCents: number,
  now: Date = new Date()
): { valid: boolean; reason?: string } {
  if (!coupon) {
    return { valid: false, reason: 'Coupon code not found.' };
  }
  if (!coupon.isActive) {
    return { valid: false, reason: 'This coupon is no longer active.' };
  }
  if (coupon.expiresAt) {
    const exp = typeof coupon.expiresAt === 'string' ? new Date(coupon.expiresAt) : coupon.expiresAt;
    if (!Number.isNaN(exp.getTime()) && exp.getTime() < now.getTime()) {
      return { valid: false, reason: 'This coupon has expired.' };
    }
  }
  if (
    typeof coupon.maxUses === 'number' &&
    typeof coupon.usedCount === 'number' &&
    coupon.usedCount >= coupon.maxUses
  ) {
    return { valid: false, reason: 'This coupon has reached its redemption limit.' };
  }
  if (subtotalCents < coupon.minOrderCents) {
    const minDollars = (coupon.minOrderCents / 100).toFixed(2);
    return {
      valid: false,
      reason: `Minimum order of $${minDollars} required for ${coupon.code}.`,
    };
  }
  return { valid: true };
}

export function calculateCouponDiscountCents(
  subtotalCents: number,
  coupon: ApplicableCoupon | null | undefined,
  now: Date = new Date()
): number {
  if (subtotalCents <= 0) return 0;
  const validation = isCouponValid(coupon, subtotalCents, now);
  if (!validation.valid || !coupon) return 0;

  if (coupon.discountType === 'percent') {
    const pct = Math.min(100, Math.max(0, coupon.discountValue));
    return Math.round((subtotalCents * pct) / 100);
  }

  return Math.min(subtotalCents, Math.max(0, coupon.discountValue));
}

export function calculateDeliveryFeeCents(
  subtotalCents: number,
  discountCents: number = 0
): number {
  if (subtotalCents <= 0) return 0;
  const net = Math.max(0, subtotalCents - discountCents);
  return net >= FREE_DELIVERY_THRESHOLD_CENTS ? 0 : STANDARD_DELIVERY_FEE_CENTS;
}

export function calculateOrderTotals(
  items: PricedCartItem[],
  coupon?: ApplicableCoupon | null,
  now: Date = new Date()
): OrderTotals {
  const subtotalCents = calculateSubtotalCents(items);
  const discountCents = calculateCouponDiscountCents(subtotalCents, coupon, now);
  const deliveryFeeCents = calculateDeliveryFeeCents(subtotalCents, discountCents);
  const totalCents = Math.max(0, subtotalCents - discountCents) + deliveryFeeCents;
  const net = Math.max(0, subtotalCents - discountCents);
  const freeDeliveryRemainingCents =
    subtotalCents <= 0 ? FREE_DELIVERY_THRESHOLD_CENTS : Math.max(0, FREE_DELIVERY_THRESHOLD_CENTS - net);

  return {
    subtotalCents,
    discountCents,
    deliveryFeeCents,
    totalCents,
    freeDeliveryRemainingCents,
  };
}

export function formatPriceParts(cents: number): {
  whole: string;
  decimals: string;
  formatted: string;
} {
  const safe = Math.max(0, Math.round(cents));
  const dollars = Math.floor(safe / 100);
  const remainder = safe % 100;
  const whole = dollars.toString().padStart(dollars < 10 ? 2 : 1, '0');
  const decimals = remainder.toString().padStart(2, '0');
  return {
    whole,
    decimals,
    formatted: `$${(safe / 100).toFixed(2)}`,
  };
}

export function formatCurrency(cents: number): string {
  const safe = Math.round(cents);
  return `$${(safe / 100).toFixed(2)}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
