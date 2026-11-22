'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Minus, Plus, ShoppingBag, Tag, Trash2, Truck } from 'lucide-react';
import { useStore } from '@/src/context/StoreContext';
import { FREE_DELIVERY_THRESHOLD_CENTS, formatCurrency } from '@/src/lib/pricing';

const QUICK_COUPONS = [
  { code: 'FRESH15', label: 'FRESH15 · 15% off $20+' },
  { code: 'GROMUSE10', label: 'GROMUSE10 · 10% off $10+' },
  { code: 'SAVE5', label: 'SAVE5 · $5 off $30+' },
  { code: 'HEALTH5', label: 'HEALTH5 · 5% Health Card' },
];

export default function CartPage() {
  const {
    cart,
    cartCount,
    totals,
    hydrated,
    appliedCoupon,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  const handleApply = async (codeToUse: string) => {
    setCouponMessage(null);
    setBusy(true);
    const res = await applyCoupon(codeToUse);
    setBusy(false);
    if (!res.ok) {
      setCouponMessage({ type: 'err', text: res.error || 'Could not apply coupon.' });
    } else {
      setCouponMessage({ type: 'ok', text: `Coupon ${codeToUse.toUpperCase()} applied!` });
      setCouponInput('');
    }
  };

  const progressPct = Math.min(
    100,
    Math.round(
      ((totals.subtotalCents - totals.discountCents) / FREE_DELIVERY_THRESHOLD_CENTS) *
        100
    )
  );

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#14221C] tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-sm text-[#607067] mt-1">
            {cartCount} {cartCount === 1 ? 'item' : 'items'} ready for 15-minute delivery
          </p>
        </div>

        {cart.length > 0 && (
          <button
            type="button"
            onClick={() => void clearCart()}
            className="text-xs font-semibold text-[#607067] hover:text-red-600 underline"
          >
            Clear Cart
          </button>
        )}
      </div>

      {!hydrated ? (
        <div className="bg-white rounded-3xl border border-[#EAECE9] p-12 text-center text-sm text-[#607067]">
          Loading your Gromuse basket...
        </div>
      ) : cart.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EAECE9] p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F2F6F3] text-[#114B3C] flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#14221C]">Your cart is empty</h2>
          <p className="text-sm text-[#607067] mt-1 max-w-md mx-auto">
            Browse our fresh organic vegetables, fruits, bakery items, and household essentials.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#114B3C] text-white text-sm font-bold hover:bg-[#0D3C30]"
          >
            Start Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Items Column */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-[#F4F9F4] border border-[#DCE8DE] rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-[#114B3C] mb-2">
                <span className="inline-flex items-center gap-1.5">
                  <Truck className="w-4 h-4" />
                  {totals.freeDeliveryRemainingCents === 0
                    ? 'Free 15-Minute Delivery Unlocked!'
                    : `Add ${formatCurrency(totals.freeDeliveryRemainingCents)} more for Free Delivery`}
                </span>
                <span className="tabular-nums">{progressPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#DCE8DE] overflow-hidden">
                <div
                  className="h-full bg-[#114B3C] transition-all duration-300"
                  style={{ width: `${Math.max(4, progressPct)}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#EAECE9] divide-y divide-[#F0F3F1] overflow-hidden">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/products/${item.slug}`}
                      className="w-20 h-20 rounded-2xl bg-white border border-[#EAECE9] relative shrink-0 overflow-hidden"
                    >
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="80px"
                        referrerPolicy="no-referrer"
                        className="object-contain p-2"
                      />
                    </Link>
                    <div>
                      <Link
                        href={`/products/${item.slug}`}
                        className="text-base font-bold text-[#14221C] hover:text-[#114B3C]"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-[#607067] mt-0.5">
                        {item.storeName} · {item.unitWeight}
                      </p>
                      <p className="text-sm font-bold text-[#114B3C] mt-1 tabular-nums">
                        {formatCurrency(item.priceCents)} each
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="inline-flex items-center rounded-full bg-[#B2F565] text-[#114B3C] h-10 px-2 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          void updateQuantity(item.productId, item.quantity - 1)
                        }
                        aria-label={`Decrease ${item.name} quantity`}
                        className="w-7 h-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold tabular-nums min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          void updateQuantity(item.productId, item.quantity + 1)
                        }
                        aria-label={`Increase ${item.name} quantity`}
                        className="w-7 h-7 rounded-full bg-[#114B3C] text-white flex items-center justify-center"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right min-w-[84px]">
                      <p className="text-base font-extrabold text-[#14221C] tabular-nums">
                        {formatCurrency(item.priceCents * item.quantity)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => void removeFromCart(item.productId)}
                      aria-label={`Remove ${item.name}`}
                      className="p-2 rounded-lg text-[#85948C] hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary & Coupon Column */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-[#EAECE9] p-6 space-y-5 sticky top-24">
            <h2 className="text-xl font-bold text-[#14221C]">Order Summary</h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleApply(couponInput);
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-[#607067] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Enter coupon code"
                  aria-label="Coupon code"
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#DCE3DE] text-sm uppercase focus:outline-none focus:border-[#114B3C]"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="px-4 h-10 rounded-xl bg-[#114B3C] text-white text-sm font-semibold hover:bg-[#0D3C30] disabled:opacity-60"
              >
                Apply
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5">
              {QUICK_COUPONS.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => void handleApply(c.code)}
                  className="px-2.5 py-1 rounded-lg bg-[#F4F7F5] hover:bg-[#E7F6D5] text-[11px] font-semibold text-[#114B3C] transition-colors"
                >
                  {c.label}
                </button>
              ))}
            </div>

            {couponMessage && (
              <p
                className={`text-xs font-medium ${
                  couponMessage.type === 'ok' ? 'text-[#114B3C]' : 'text-red-600'
                }`}
              >
                {couponMessage.text}
              </p>
            )}

            {appliedCoupon && (
              <div className="flex items-center justify-between text-xs bg-[#E7F6D5] text-[#114B3C] px-3 py-2 rounded-xl font-semibold">
                <span>Active Coupon: {appliedCoupon.code}</span>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="underline hover:no-underline"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="space-y-2.5 pt-2 border-t border-[#F0F3F1] text-sm">
              <div className="flex justify-between text-[#52625A]">
                <span>Subtotal</span>
                <span className="tabular-nums font-semibold">
                  {formatCurrency(totals.subtotalCents)}
                </span>
              </div>
              {totals.discountCents > 0 && (
                <div className="flex justify-between text-[#114B3C]">
                  <span>Coupon Discount</span>
                  <span className="tabular-nums font-bold">
                    -{formatCurrency(totals.discountCents)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[#52625A]">
                <span>Delivery Fee</span>
                <span className="tabular-nums font-semibold">
                  {totals.deliveryFeeCents === 0
                    ? 'Free'
                    : formatCurrency(totals.deliveryFeeCents)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-extrabold pt-3 border-t border-[#EAECE9]">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(totals.totalCents)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full h-12 rounded-full bg-[#B2F565] text-[#114B3C] text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#A3EB52] transition-colors shadow-xs"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
