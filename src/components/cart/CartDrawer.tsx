'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { Minus, Plus, ShoppingBag, Tag, Trash2, X } from 'lucide-react';
import { useStore } from '@/src/context/StoreContext';
import { FREE_DELIVERY_THRESHOLD_CENTS, formatCurrency } from '@/src/lib/pricing';

export function CartDrawer() {
  const {
    cart,
    cartCount,
    totals,
    appliedCoupon,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const progressPct = Math.min(
    100,
    Math.round(
      ((totals.subtotalCents - totals.discountCents) / FREE_DELIVERY_THRESHOLD_CENTS) *
        100
    )
  );

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setApplying(true);
    const result = await applyCoupon(couponInput);
    setApplying(false);
    if (!result.ok) {
      setCouponError(result.error || 'Invalid coupon.');
    } else {
      setCouponInput('');
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/45 backdrop-blur-xs"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            aria-label="Shopping cart drawer"
            className="relative z-10 w-full max-w-md bg-white text-[#14221C] h-full flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-[#114B3C] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-[#B2F565]" />
                <h2 className="text-lg font-bold">Your Basket ({cartCount})</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                aria-label="Close cart drawer"
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Delivery Progress */}
            {cart.length > 0 && (
              <div className="px-6 py-3 bg-[#F4F9F4] border-b border-[#E4EDE5]">
                <p className="text-xs font-medium text-[#114B3C] mb-1.5">
                  {totals.freeDeliveryRemainingCents === 0
                    ? 'You unlocked Free 15-Minute Delivery!'
                    : `Add ${formatCurrency(totals.freeDeliveryRemainingCents)} more for Free Delivery`}
                </p>
                <div className="w-full h-1.5 rounded-full bg-[#DCE8DE] overflow-hidden">
                  <div
                    className="h-full bg-[#114B3C] transition-all duration-300"
                    style={{ width: `${Math.max(4, progressPct)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-[#F2F6F3] text-[#114B3C] flex items-center justify-center mb-4">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-[#14221C]">
                    Your grocery basket is empty
                  </h3>
                  <p className="text-sm text-[#607067] mt-1 max-w-xs">
                    Add fresh produce, dairy, snacks, or pantry essentials to get 15-minute delivery.
                  </p>
                  <Link
                    href="/shop"
                    onClick={() => setIsCartOpen(false)}
                    className="mt-5 px-5 py-2.5 rounded-full bg-[#114B3C] text-white text-sm font-semibold hover:bg-[#0D3C30] transition-colors"
                  >
                    Browse Groceries
                  </Link>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex gap-3.5 pb-4 border-b border-[#F0F3F1] last:border-b-0"
                  >
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={() => setIsCartOpen(false)}
                      className="w-16 h-16 rounded-xl bg-white border border-[#EAECE9] relative shrink-0 overflow-hidden"
                    >
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="64px"
                        referrerPolicy="no-referrer"
                        className="object-contain p-1.5"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={() => setIsCartOpen(false)}
                          className="text-sm font-semibold text-[#14221C] hover:text-[#114B3C] truncate"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => void removeFromCart(item.productId)}
                          aria-label={`Remove ${item.name} from cart`}
                          className="text-[#85948C] hover:text-red-600 p-0.5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-[#607067] mt-0.5">{item.unitWeight}</p>

                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-full bg-[#B2F565] text-[#114B3C] h-8 px-1.5 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void updateQuantity(item.productId, item.quantity - 1)
                            }
                            aria-label={`Decrease ${item.name} quantity`}
                            className="w-6 h-6 rounded-full hover:bg-black/10 flex items-center justify-center"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold tabular-nums min-w-[16px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              void updateQuantity(item.productId, item.quantity + 1)
                            }
                            aria-label={`Increase ${item.name} quantity`}
                            className="w-6 h-6 rounded-full hover:bg-black/10 flex items-center justify-center"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-sm font-bold tabular-nums text-[#14221C]">
                          {formatCurrency(item.priceCents * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Totals & Checkout CTA */}
            {cart.length > 0 && (
              <div className="p-6 bg-[#F8FAF8] border-t border-[#E6ECE7] space-y-4">
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-[#607067] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Promo code (e.g. FRESH15)"
                      aria-label="Promo coupon code"
                      className="w-full h-9 pl-8 pr-3 rounded-xl bg-white border border-[#DCE3DE] text-xs uppercase focus:outline-none focus:border-[#114B3C]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={applying}
                    className="px-4 h-9 rounded-xl bg-[#114B3C] text-white text-xs font-semibold hover:bg-[#0D3C30] disabled:opacity-60"
                  >
                    Apply
                  </button>
                </form>

                {couponError && (
                  <p className="text-xs text-red-600">{couponError}</p>
                )}

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-xs bg-[#E7F6D5] text-[#114B3C] px-3 py-1.5 rounded-lg font-medium">
                    <span>Coupon {appliedCoupon.code} applied</span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="underline hover:no-underline"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-[#52625A]">
                    <span>Subtotal</span>
                    <span className="tabular-nums font-medium">
                      {formatCurrency(totals.subtotalCents)}
                    </span>
                  </div>
                  {totals.discountCents > 0 && (
                    <div className="flex justify-between text-[#114B3C]">
                      <span>Discount</span>
                      <span className="tabular-nums font-semibold">
                        -{formatCurrency(totals.discountCents)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#52625A]">
                    <span>Delivery Fee</span>
                    <span className="tabular-nums font-medium">
                      {totals.deliveryFeeCents === 0
                        ? 'Free'
                        : formatCurrency(totals.deliveryFeeCents)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-[#E2EAE4]">
                    <span>Total</span>
                    <span className="tabular-nums">
                      {formatCurrency(totals.totalCents)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    href="/cart"
                    onClick={() => setIsCartOpen(false)}
                    className="h-11 rounded-full border border-[#114B3C] text-[#114B3C] text-sm font-semibold flex items-center justify-center hover:bg-[#EDF5EF] transition-colors"
                  >
                    View Cart
                  </Link>
                  <Link
                    href="/checkout"
                    onClick={() => setIsCartOpen(false)}
                    className="h-11 rounded-full bg-[#B2F565] text-[#114B3C] text-sm font-bold flex items-center justify-center hover:bg-[#A3EB52] transition-colors shadow-xs"
                  >
                    Checkout
                  </Link>
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
