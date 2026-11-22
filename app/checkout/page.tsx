'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  CreditCard,
  Lock,
  MapPin,
  ShoppingBag,
  Tag,
  Truck,
} from 'lucide-react';
import { z } from 'zod';
import { useStore } from '@/src/context/StoreContext';
import { formatCurrency } from '@/src/lib/pricing';
import { CheckoutFormValues, checkoutSchema } from '@/src/lib/validations';

interface SavedAddress {
  id: number;
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    totals,
    hydrated,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    clearCart,
    dbUser,
    idToken,
    sessionId,
  } = useStore();

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof checkoutSchema>, unknown, CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      street: '',
      city: '',
      postalCode: '',
      paymentMethod: 'cod',
      couponCode: appliedCoupon?.code || '',
      notes: '',
    },
  });

  const selectedPayment = watch('paymentMethod');

  useEffect(() => {
    if (dbUser) {
      if (dbUser.name) setValue('customerName', dbUser.name);
      if (dbUser.email) setValue('customerEmail', dbUser.email);
      if (dbUser.phone) setValue('customerPhone', dbUser.phone);
    }
  }, [dbUser, setValue]);

  useEffect(() => {
    if (appliedCoupon?.code) {
      setValue('couponCode', appliedCoupon.code);
    } else {
      setValue('couponCode', '');
    }
  }, [appliedCoupon, setValue]);

  useEffect(() => {
    if (!idToken) return;
    fetch('/api/account/addresses', {
      headers: { Authorization: `Bearer ${idToken}` },
    })
      .then((r) => (r.ok ? r.json() : { addresses: [] }))
      .then((data) => {
        if (Array.isArray(data.addresses)) setSavedAddresses(data.addresses);
      })
      .catch(() => {});
  }, [idToken]);

  const handleApplyCoupon = async () => {
    setCouponMsg(null);
    const res = await applyCoupon(couponInput);
    if (!res.ok) {
      setCouponMsg(res.error || 'Invalid coupon.');
    } else {
      setCouponInput('');
    }
  };

  const onSubmit = async (values: CheckoutFormValues) => {
    setSubmitError(null);
    if (cart.length === 0) {
      setSubmitError('Your cart is empty.');
      return;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (idToken) headers.Authorization = `Bearer ${idToken}`;
      if (sessionId) headers['x-gromuse-session'] = sessionId;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...values,
          couponCode: appliedCoupon?.code || values.couponCode || '',
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Unable to place order.');
        return;
      }

      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }

      await clearCart();
      router.push(`/orders/${data.order.orderNumber}?confirmed=1`);
    } catch {
      setSubmitError('Network error while placing your order. Please try again.');
    }
  };

  if (!hydrated) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-10">
        <div className="bg-white rounded-3xl border border-[#EAECE9] p-12 text-center text-sm text-[#607067]">
          Loading your checkout summary...
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-10">
        <div className="bg-white rounded-3xl border border-[#EAECE9] p-12 text-center">
          <ShoppingBag className="w-10 h-10 text-[#114B3C] mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-[#14221C]">
            Your basket is empty
          </h1>
          <p className="text-sm text-[#607067] mt-1">
            Add fresh groceries to your basket before checking out.
          </p>
          <Link
            href="/shop"
            className="mt-5 inline-flex px-7 py-3 rounded-full bg-[#114B3C] text-white text-sm font-bold hover:bg-[#0D3C30]"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-[#14221C] tracking-tight">
          Express Checkout
        </h1>
        <p className="text-sm text-[#607067] mt-1">
          Complete your delivery information and payment preference.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* Left Form */}
        <div className="lg:col-span-7 space-y-6">
          {savedAddresses.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#EAECE9] p-6">
              <h2 className="text-sm font-bold text-[#14221C] mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#114B3C]" />
                Autofill from Saved Addresses
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => {
                      setValue('customerName', addr.recipientName);
                      setValue('customerPhone', addr.phone);
                      setValue('street', addr.street);
                      setValue('city', addr.city);
                      setValue('postalCode', addr.postalCode);
                    }}
                    className="px-4 py-2 rounded-xl border border-[#DCE3DE] hover:border-[#114B3C] hover:bg-[#F4F8F5] text-xs font-semibold text-left transition-colors"
                  >
                    {addr.label} · {addr.street}, {addr.city}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customer & Address Details */}
          <div className="bg-white rounded-3xl border border-[#EAECE9] p-6 sm:p-8 space-y-5">
            <h2 className="text-xl font-bold text-[#14221C]">
              1. Customer &amp; Delivery Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="customerName"
                  className="block text-xs font-semibold text-[#14221C] mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="customerName"
                  type="text"
                  {...register('customerName')}
                  placeholder="Alex Morgan"
                  className="w-full h-11 px-4 rounded-xl border border-[#DCE3DE] text-sm focus:outline-none focus:border-[#114B3C]"
                />
                {errors.customerName && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.customerName.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="customerPhone"
                  className="block text-xs font-semibold text-[#14221C] mb-1.5"
                >
                  Phone Number
                </label>
                <input
                  id="customerPhone"
                  type="tel"
                  {...register('customerPhone')}
                  placeholder="+1 (555) 234-5678"
                  className="w-full h-11 px-4 rounded-xl border border-[#DCE3DE] text-sm focus:outline-none focus:border-[#114B3C]"
                />
                {errors.customerPhone && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.customerPhone.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="customerEmail"
                className="block text-xs font-semibold text-[#14221C] mb-1.5"
              >
                Email Address (for order updates)
              </label>
              <input
                id="customerEmail"
                type="email"
                {...register('customerEmail')}
                placeholder="alex@example.com"
                className="w-full h-11 px-4 rounded-xl border border-[#DCE3DE] text-sm focus:outline-none focus:border-[#114B3C]"
              />
              {errors.customerEmail && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.customerEmail.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="street"
                className="block text-xs font-semibold text-[#14221C] mb-1.5"
              >
                Street Address &amp; Apartment
              </label>
              <input
                id="street"
                type="text"
                {...register('street')}
                placeholder="742 Evergreen Terrace, Apt 4B"
                className="w-full h-11 px-4 rounded-xl border border-[#DCE3DE] text-sm focus:outline-none focus:border-[#114B3C]"
              />
              {errors.street && (
                <p className="text-xs text-red-600 mt-1">{errors.street.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="city"
                  className="block text-xs font-semibold text-[#14221C] mb-1.5"
                >
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  {...register('city')}
                  placeholder="Portland"
                  className="w-full h-11 px-4 rounded-xl border border-[#DCE3DE] text-sm focus:outline-none focus:border-[#114B3C]"
                />
                {errors.city && (
                  <p className="text-xs text-red-600 mt-1">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="postalCode"
                  className="block text-xs font-semibold text-[#14221C] mb-1.5"
                >
                  Postal / ZIP Code
                </label>
                <input
                  id="postalCode"
                  type="text"
                  {...register('postalCode')}
                  placeholder="97205"
                  className="w-full h-11 px-4 rounded-xl border border-[#DCE3DE] text-sm focus:outline-none focus:border-[#114B3C]"
                />
                {errors.postalCode && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.postalCode.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="notes"
                className="block text-xs font-semibold text-[#14221C] mb-1.5"
              >
                Delivery Instructions (Optional)
              </label>
              <input
                id="notes"
                type="text"
                {...register('notes')}
                placeholder="Ring bell once, leave insulated tote by porch"
                className="w-full h-11 px-4 rounded-xl border border-[#DCE3DE] text-sm focus:outline-none focus:border-[#114B3C]"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-3xl border border-[#EAECE9] p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-[#14221C]">2. Payment Method</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`cursor-pointer rounded-2xl border p-4 flex items-start gap-3 transition-colors ${
                  selectedPayment === 'cod'
                    ? 'border-[#114B3C] bg-[#F2F8F4]'
                    : 'border-[#DCE3DE] hover:bg-[#FAFBF9]'
                }`}
              >
                <input
                  type="radio"
                  value="cod"
                  {...register('paymentMethod')}
                  className="mt-1 accent-[#114B3C]"
                />
                <div>
                  <span className="text-sm font-bold text-[#14221C] flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#114B3C]" />
                    Cash on Delivery
                  </span>
                  <p className="text-xs text-[#607067] mt-1">
                    Pay cash or contactless at your doorstep when your courier arrives.
                  </p>
                </div>
              </label>

              <label
                className={`cursor-pointer rounded-2xl border p-4 flex items-start gap-3 transition-colors ${
                  selectedPayment === 'stripe'
                    ? 'border-[#114B3C] bg-[#F2F8F4]'
                    : 'border-[#DCE3DE] hover:bg-[#FAFBF9]'
                }`}
              >
                <input
                  type="radio"
                  value="stripe"
                  {...register('paymentMethod')}
                  className="mt-1 accent-[#114B3C]"
                />
                <div>
                  <span className="text-sm font-bold text-[#14221C] flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-[#114B3C]" />
                    Card / Stripe Checkout
                  </span>
                  <p className="text-xs text-[#607067] mt-1">
                    Server-verified Stripe Checkout session (requires STRIPE_SECRET_KEY).
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Summary */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#EAECE9] p-6 sm:p-8 space-y-5 sticky top-24">
          <h2 className="text-xl font-bold text-[#14221C]">Order Summary</h2>

          <div className="max-h-72 overflow-y-auto divide-y divide-[#F0F3F1] pr-1">
            {cart.map((item) => (
              <div key={item.productId} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl border border-[#EAECE9] relative shrink-0 overflow-hidden bg-white">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="48px"
                      referrerPolicy="no-referrer"
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#14221C] truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-[#607067]">
                      Qty {item.quantity} · {item.unitWeight}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold tabular-nums text-[#14221C]">
                  {formatCurrency(item.priceCents * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Coupon Input */}
          <div className="pt-2 border-t border-[#F0F3F1] space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-[#607067] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Promo code (e.g. FRESH15)"
                  className="w-full h-10 pl-8 pr-3 rounded-xl border border-[#DCE3DE] text-xs uppercase focus:outline-none focus:border-[#114B3C]"
                />
              </div>
              <button
                type="button"
                onClick={() => void handleApplyCoupon()}
                className="px-4 h-10 rounded-xl bg-[#114B3C] text-white text-xs font-semibold hover:bg-[#0D3C30]"
              >
                Apply
              </button>
            </div>
            {couponMsg && <p className="text-xs text-red-600">{couponMsg}</p>}
            {appliedCoupon && (
              <div className="flex items-center justify-between text-xs bg-[#E7F6D5] text-[#114B3C] px-3 py-1.5 rounded-lg font-semibold">
                <span>Applied: {appliedCoupon.code}</span>
                <button type="button" onClick={removeCoupon} className="underline">
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-3 border-t border-[#F0F3F1] text-sm">
            <div className="flex justify-between text-[#52625A]">
              <span>Subtotal</span>
              <span className="tabular-nums font-semibold">
                {formatCurrency(totals.subtotalCents)}
              </span>
            </div>
            {totals.discountCents > 0 && (
              <div className="flex justify-between text-[#114B3C]">
                <span>Discount</span>
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

          {submitError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-full bg-[#B2F565] text-[#114B3C] text-sm font-bold hover:bg-[#A3EB52] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Lock className="w-4 h-4" />
            {isSubmitting ? 'Placing Order...' : `Place Order · ${formatCurrency(totals.totalCents)}`}
          </button>
        </div>
      </form>
    </div>
  );
}
