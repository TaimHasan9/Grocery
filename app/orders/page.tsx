'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, Search } from 'lucide-react';
import { useStore } from '@/src/context/StoreContext';
import { formatCurrency } from '@/src/lib/pricing';

interface OrderSummary {
  id: number;
  orderNumber: string;
  orderStatus: string;
  paymentMethod: string;
  totalCents: number;
  createdAt: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const { idToken } = useStore();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    if (!idToken) return;
    fetch('/api/orders', {
      headers: { Authorization: `Bearer ${idToken}` },
    })
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((d) => setOrders(d.orders || []))
      .catch(() => {});
  }, [idToken]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    const num = orderNumber.trim().toUpperCase();
    const em = email.trim();
    if (!num || !em) {
      setLookupError('Enter both your order number and checkout email.');
      return;
    }

    const res = await fetch(
      `/api/orders?orderNumber=${encodeURIComponent(num)}&email=${encodeURIComponent(em)}`
    );
    const data = await res.json();
    if (!res.ok || !data.orders || data.orders.length === 0) {
      setLookupError('No order found matching that order number and email.');
      return;
    }
    router.push(`/orders/${num}`);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-[#14221C]">
          Orders &amp; Live Tracking
        </h1>
        <p className="text-sm text-[#607067] mt-1">
          Track your 15-minute Gromuse grocery delivery in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#EAECE9] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-[#14221C] flex items-center gap-2">
            <Search className="w-5 h-5 text-[#114B3C]" />
            Track Order by Number
          </h2>
          <p className="text-xs text-[#607067]">
            Placed a guest order? Enter your Gromuse order number and email address to view live tracking status.
          </p>
          <form onSubmit={handleLookup} className="space-y-3">
            <div>
              <label
                htmlFor="lookupOrderNumber"
                className="block text-xs font-semibold text-[#14221C] mb-1"
              >
                Order Number
              </label>
              <input
                id="lookupOrderNumber"
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="GRM-261122-A1B2C3"
                className="w-full h-10 px-3.5 rounded-xl border border-[#DCE3DE] text-sm font-mono uppercase"
              />
            </div>
            <div>
              <label
                htmlFor="lookupEmail"
                className="block text-xs font-semibold text-[#14221C] mb-1"
              >
                Email Address
              </label>
              <input
                id="lookupEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full h-10 px-3.5 rounded-xl border border-[#DCE3DE] text-sm"
              />
            </div>
            {lookupError && <p className="text-xs text-red-600">{lookupError}</p>}
            <button
              type="submit"
              className="w-full h-11 rounded-full bg-[#114B3C] text-white text-sm font-bold hover:bg-[#0D3C30]"
            >
              Track Order
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#EAECE9] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-[#14221C] flex items-center gap-2">
            <Package className="w-5 h-5 text-[#114B3C]" />
            Your Recent Orders
          </h2>
          {orders.length === 0 ? (
            <p className="text-sm text-[#607067]">
              Sign in on your{' '}
              <Link href="/account" className="text-[#114B3C] font-semibold underline">
                Account page
              </Link>{' '}
              to see your full order history, or use the order lookup form on the left.
            </p>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => (
                <Link
                  key={ord.id}
                  href={`/orders/${ord.orderNumber}`}
                  className="block p-4 rounded-2xl border border-[#EAECE9] hover:border-[#114B3C] transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold font-mono text-[#14221C]">
                        {ord.orderNumber}
                      </p>
                      <p className="text-xs text-[#607067]">
                        {new Date(ord.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold tabular-nums">
                        {formatCurrency(ord.totalCents)}
                      </p>
                      <p className="text-xs font-semibold text-[#114B3C] capitalize">
                        {ord.orderStatus.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
