import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { CheckCircle2, Clock, MapPin, Package, Truck } from 'lucide-react';
import { db } from '@/src/db/index';
import { orderItems, orders } from '@/src/db/schema';
import { formatCurrency } from '@/src/lib/pricing';

export const dynamic = 'force-dynamic';

const TRACKING_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'packed', label: 'Packed Fresh', icon: Package },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

export default async function OrderDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ confirmed?: string; checkout?: string }>;
}) {
  const { orderNumber } = await params;
  const query = await searchParams;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);

  if (!order) {
    notFound();
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  const currentIdx = TRACKING_STEPS.findIndex((s) => s.key === order.orderStatus);
  const activeStep = currentIdx >= 0 ? currentIdx : 1;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 space-y-8">
      {(query.confirmed === '1' || query.checkout === 'success') && (
        <div className="rounded-3xl bg-[#114B3C] text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#B2F565] text-[#114B3C] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">
                Order #{order.orderNumber} Confirmed!
              </h1>
              <p className="text-sm text-[#D7E8DF] mt-1">
                Our local fulfillment team is packing your fresh groceries for 15-minute delivery.
              </p>
            </div>
          </div>
          <Link
            href="/shop"
            className="px-6 py-2.5 rounded-full bg-[#B2F565] text-[#114B3C] text-xs font-bold whitespace-nowrap self-start sm:self-center"
          >
            Continue Shopping
          </Link>
        </div>
      )}

      {/* Tracking Timeline */}
      <section className="bg-white rounded-3xl border border-[#EAECE9] p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#607067]">Order Reference</p>
            <h2 className="text-2xl font-extrabold text-[#14221C] font-mono">
              {order.orderNumber}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#607067]">Current Status</p>
            <p className="text-sm font-bold text-[#114B3C] capitalize">
              {order.orderStatus.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        {order.orderStatus === 'cancelled' ? (
          <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-sm font-semibold">
            This order was cancelled.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {TRACKING_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const completed = idx <= activeStep;
              return (
                <div
                  key={step.key}
                  className={`rounded-2xl p-4 border transition-colors ${
                    completed
                      ? 'bg-[#F2F8F4] border-[#114B3C] text-[#114B3C]'
                      : 'bg-[#FAFBF9] border-[#EAECE9] text-[#85948C]'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-2" />
                  <p className="text-xs font-bold">{step.label}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Receipt & Delivery Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#EAECE9] divide-y divide-[#F0F3F1] overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-bold text-[#14221C]">Items Ordered</h3>
          </div>
          {items.map((item) => (
            <div key={item.id} className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-[#EAECE9] relative shrink-0 overflow-hidden bg-white">
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    sizes="64px"
                    referrerPolicy="no-referrer"
                    className="object-contain p-1.5"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#14221C]">{item.productName}</p>
                  <p className="text-xs text-[#607067]">
                    {item.unitWeight} · Qty {item.quantity} ×{' '}
                    {formatCurrency(item.unitPriceCents)}
                  </p>
                </div>
              </div>
              <span className="text-sm font-extrabold tabular-nums text-[#14221C]">
                {formatCurrency(item.lineTotalCents)}
              </span>
            </div>
          ))}
        </div>

        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-3xl border border-[#EAECE9] p-6 space-y-3">
            <h3 className="text-base font-bold text-[#14221C] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#114B3C]" />
              Delivery Address
            </h3>
            <div className="text-sm text-[#4A5A52] space-y-1">
              <p className="font-semibold text-[#14221C]">{order.customerName}</p>
              <p>{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.postalCode}
              </p>
              <p>{order.customerPhone}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#EAECE9] p-6 space-y-2.5 text-sm">
            <h3 className="text-base font-bold text-[#14221C] mb-2">Payment Summary</h3>
            <div className="flex justify-between text-[#52625A]">
              <span>Method</span>
              <span className="font-semibold uppercase">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-[#52625A]">
              <span>Payment Status</span>
              <span className="font-semibold capitalize">{order.paymentStatus}</span>
            </div>
            <div className="flex justify-between text-[#52625A] pt-2 border-t border-[#F0F3F1]">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(order.subtotalCents)}</span>
            </div>
            {order.discountCents > 0 && (
              <div className="flex justify-between text-[#114B3C]">
                <span>Discount ({order.couponCode})</span>
                <span className="tabular-nums font-bold">
                  -{formatCurrency(order.discountCents)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-[#52625A]">
              <span>Delivery</span>
              <span className="tabular-nums">
                {order.deliveryFeeCents === 0
                  ? 'Free'
                  : formatCurrency(order.deliveryFeeCents)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-extrabold pt-2 border-t border-[#EAECE9]">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(order.totalCents)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
