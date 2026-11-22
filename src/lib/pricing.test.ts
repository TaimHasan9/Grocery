import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCouponDiscountCents,
  calculateDeliveryFeeCents,
  calculateOrderTotals,
  calculateSubtotalCents,
  formatCurrency,
  formatPriceParts,
  isCouponValid,
  slugify,
} from './pricing';

test('calculateSubtotalCents sums line items cleanly', () => {
  const subtotal = calculateSubtotalCents([
    { priceCents: 1229, quantity: 2 },
    { priceCents: 499, quantity: 1 },
  ]);
  assert.equal(subtotal, 2957);
});

test('calculateCouponDiscountCents handles percent and fixed coupons', () => {
  const pct = calculateCouponDiscountCents(4000, {
    code: 'FRESH15',
    discountType: 'percent',
    discountValue: 15,
    minOrderCents: 2000,
    isActive: true,
  });
  assert.equal(pct, 600);

  const fixed = calculateCouponDiscountCents(3000, {
    code: 'SAVE5',
    discountType: 'fixed',
    discountValue: 500,
    minOrderCents: 2000,
    isActive: true,
  });
  assert.equal(fixed, 500);
});

test('isCouponValid rejects expired, inactive, and under-minimum coupons', () => {
  const now = new Date('2026-11-22T00:00:00Z');
  assert.equal(
    isCouponValid(
      {
        code: 'OLD',
        discountType: 'percent',
        discountValue: 10,
        minOrderCents: 0,
        isActive: true,
        expiresAt: '2026-11-20T00:00:00Z',
      },
      2500,
      now
    ).valid,
    false
  );

  assert.equal(
    isCouponValid(
      {
        code: 'MIN50',
        discountType: 'fixed',
        discountValue: 1000,
        minOrderCents: 5000,
        isActive: true,
      },
      2500,
      now
    ).valid,
    false
  );
});

test('calculateDeliveryFeeCents waives fee at threshold', () => {
  assert.equal(calculateDeliveryFeeCents(0, 0), 0);
  assert.equal(calculateDeliveryFeeCents(3500, 0), 399);
  assert.equal(calculateDeliveryFeeCents(5000, 0), 0);
  assert.equal(calculateDeliveryFeeCents(5500, 1000), 399);
});

test('calculateOrderTotals computes full breakdown', () => {
  const totals = calculateOrderTotals(
    [
      { priceCents: 2000, quantity: 2 },
      { priceCents: 1500, quantity: 1 },
    ],
    {
      code: 'GROMUSE10',
      discountType: 'percent',
      discountValue: 10,
      minOrderCents: 2500,
      isActive: true,
    }
  );
  assert.equal(totals.subtotalCents, 5500);
  assert.equal(totals.discountCents, 550);
  assert.equal(totals.deliveryFeeCents, 399);
  assert.equal(totals.totalCents, 5349);
  assert.equal(totals.freeDeliveryRemainingCents, 50);
});

test('formatPriceParts and slugify format accurately', () => {
  assert.deepEqual(formatPriceParts(429), {
    whole: '04',
    decimals: '29',
    formatted: '$4.29',
  });
  assert.equal(formatCurrency(1729), '$17.29');
  assert.equal(slugify('Snacks & Breads!'), 'snacks-breads');
});
