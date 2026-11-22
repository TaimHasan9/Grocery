'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  LogOut,
  MapPin,
  Package,
  Plus,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react';
import { useStore } from '@/src/context/StoreContext';
import { formatCurrency } from '@/src/lib/pricing';
import { addressSchema } from '@/src/lib/validations';
import { z } from 'zod';

type AddressValues = z.infer<typeof addressSchema>;

interface SavedAddress extends AddressValues {
  id: number;
}

interface OrderSummary {
  id: number;
  orderNumber: string;
  orderStatus: string;
  paymentMethod: string;
  totalCents: number;
  createdAt: string;
}

export default function AccountPage() {
  const {
    firebaseUser,
    dbUser,
    idToken,
    authLoading,
    authError,
    signInWithGoogle,
    signOutUser,
    refreshProfile,
  } = useStore();

  const [profileDraft, setProfileDraft] = useState<{
    name?: string;
    phone?: string;
  }>({});
  const profileName = profileDraft.name ?? dbUser?.name ?? '';
  const profilePhone = profileDraft.phone ?? dbUser?.phone ?? '';
  const [profileSaved, setProfileSaved] = useState(false);

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof addressSchema>, unknown, AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: 'Home',
      recipientName: '',
      phone: '',
      street: '',
      city: '',
      postalCode: '',
      isDefault: false,
    },
  });

  const loadAccountData = useCallback(async () => {
    if (!idToken) return;
    try {
      const [addrRes, ordRes] = await Promise.all([
        fetch('/api/account/addresses', {
          headers: { Authorization: `Bearer ${idToken}` },
        }),
        fetch('/api/orders', {
          headers: { Authorization: `Bearer ${idToken}` },
        }),
      ]);
      if (addrRes.ok) {
        const d = await addrRes.json();
        setAddresses(d.addresses || []);
      }
      if (ordRes.ok) {
        const d = await ordRes.json();
        setOrders(d.orders || []);
      }
    } catch {
      // ignore
    }
  }, [idToken]);

  useEffect(() => {
    if (!idToken) return;
    let cancelled = false;
    Promise.all([
      fetch('/api/account/addresses', {
        headers: { Authorization: `Bearer ${idToken}` },
      }).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/orders', {
        headers: { Authorization: `Bearer ${idToken}` },
      }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([addrData, ordData]) => {
        if (cancelled) return;
        if (addrData) setAddresses(addrData.addresses || []);
        if (ordData) setOrders(ordData.orders || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [idToken]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken) return;
    const res = await fetch('/api/auth/session', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ name: profileName, phone: profilePhone }),
    });
    if (res.ok) {
      await refreshProfile();
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }
  };

  const onAddAddress = async (values: AddressValues) => {
    if (!idToken) return;
    const res = await fetch('/api/account/addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      reset();
      await loadAccountData();
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!idToken) return;
    await fetch(`/api/account/addresses?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${idToken}` },
    });
    await loadAccountData();
  };

  if (authLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-10">
        <div className="bg-white rounded-3xl border border-[#EAECE9] p-12 text-center text-sm text-[#607067]">
          Loading your Gromuse account...
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-10">
        <div className="max-w-lg mx-auto bg-white rounded-3xl border border-[#EAECE9] p-8 sm:p-10 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#EEF6F0] text-[#114B3C] flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#14221C]">
            Sign in or Register with Gromuse
          </h1>
          <p className="text-sm text-[#607067] mt-2 leading-relaxed">
            Sign in securely with Google to manage your delivery addresses, save your basket across devices, and track every grocery order live.
          </p>
          {authError && (
            <p className="mt-4 text-xs text-red-600 bg-red-50 p-3 rounded-xl">
              {authError}
            </p>
          )}
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="mt-6 w-full h-12 rounded-full bg-[#114B3C] text-white text-sm font-bold hover:bg-[#0D3C30] transition-colors"
          >
            Continue with Google
          </button>
          <p className="mt-4 text-xs text-[#607067]">
            Looking for a guest order?{' '}
            <Link href="/orders" className="text-[#114B3C] font-semibold underline">
              Track your order by number
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#14221C]">
            Welcome, {dbUser?.name || firebaseUser.displayName || 'Shopper'}
          </h1>
          <p className="text-sm text-[#607067] mt-1">{firebaseUser.email}</p>
        </div>
        <div className="flex items-center gap-3">
          {dbUser?.role === 'admin' && (
            <Link
              href="/admin"
              className="px-5 h-10 rounded-full bg-[#B2F565] text-[#114B3C] text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#A3EB52]"
            >
              <ShieldCheck className="w-4 h-4" />
              Open Admin Dashboard
            </Link>
          )}
          <button
            type="button"
            onClick={() => void signOutUser()}
            className="px-5 h-10 rounded-full border border-[#DCE3DE] text-xs font-bold text-[#14221C] hover:bg-[#F5F7F5] inline-flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Profile + Saved Addresses */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleSaveProfile}
            className="bg-white rounded-3xl border border-[#EAECE9] p-6 space-y-4"
          >
            <h2 className="text-lg font-bold text-[#14221C]">Customer Profile</h2>
            <div>
              <label
                htmlFor="profileName"
                className="block text-xs font-semibold text-[#14221C] mb-1"
              >
                Full Name
              </label>
              <input
                id="profileName"
                type="text"
                value={profileName}
                onChange={(e) =>
                  setProfileDraft((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full h-10 px-3.5 rounded-xl border border-[#DCE3DE] text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="profilePhone"
                className="block text-xs font-semibold text-[#14221C] mb-1"
              >
                Phone Number
              </label>
              <input
                id="profilePhone"
                type="tel"
                value={profilePhone}
                onChange={(e) =>
                  setProfileDraft((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+1 (555) 000-0000"
                className="w-full h-10 px-3.5 rounded-xl border border-[#DCE3DE] text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-5 h-10 rounded-full bg-[#114B3C] text-white text-xs font-bold hover:bg-[#0D3C30]"
            >
              Save Profile
            </button>
            {profileSaved && (
              <p className="text-xs text-[#114B3C] font-semibold">Profile updated!</p>
            )}
          </form>

          <div className="bg-white rounded-3xl border border-[#EAECE9] p-6 space-y-5">
            <h2 className="text-lg font-bold text-[#14221C] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#114B3C]" />
              Saved Delivery Addresses
            </h2>

            {addresses.length === 0 ? (
              <p className="text-xs text-[#607067]">No saved addresses yet.</p>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-4 rounded-2xl bg-[#F8FAF8] border border-[#E6ECE7] flex items-start justify-between gap-3"
                  >
                    <div className="text-xs space-y-0.5">
                      <p className="font-bold text-[#14221C] text-sm">
                        {addr.label} · {addr.recipientName}
                      </p>
                      <p className="text-[#4A5A52]">
                        {addr.street}, {addr.city} {addr.postalCode}
                      </p>
                      <p className="text-[#607067]">{addr.phone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeleteAddress(addr.id)}
                      aria-label={`Delete ${addr.label} address`}
                      className="p-1.5 text-[#85948C] hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={handleSubmit(onAddAddress)}
              className="pt-4 border-t border-[#F0F3F1] space-y-3"
            >
              <p className="text-xs font-bold text-[#14221C] flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add New Address
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  {...register('label')}
                  placeholder="Label (Home/Work)"
                  className="h-9 px-3 rounded-xl border border-[#DCE3DE] text-xs"
                />
                <input
                  {...register('recipientName')}
                  placeholder="Recipient name"
                  className="h-9 px-3 rounded-xl border border-[#DCE3DE] text-xs"
                />
              </div>
              <input
                {...register('phone')}
                placeholder="Phone number"
                className="w-full h-9 px-3 rounded-xl border border-[#DCE3DE] text-xs"
              />
              <input
                {...register('street')}
                placeholder="Street address"
                className="w-full h-9 px-3 rounded-xl border border-[#DCE3DE] text-xs"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  {...register('city')}
                  placeholder="City"
                  className="h-9 px-3 rounded-xl border border-[#DCE3DE] text-xs"
                />
                <input
                  {...register('postalCode')}
                  placeholder="Postal code"
                  className="h-9 px-3 rounded-xl border border-[#DCE3DE] text-xs"
                />
              </div>
              {(errors.street || errors.recipientName || errors.phone) && (
                <p className="text-xs text-red-600">
                  Please fill in recipient name, phone, street, city, and postal code.
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 h-9 rounded-full bg-[#B2F565] text-[#114B3C] text-xs font-bold hover:bg-[#A3EB52]"
              >
                Save Address
              </button>
            </form>
          </div>
        </div>

        {/* Order History */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#EAECE9] p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#14221C] flex items-center gap-2">
              <Package className="w-5 h-5 text-[#114B3C]" />
              Your Order History
            </h2>
            <Link href="/orders" className="text-xs font-semibold text-[#114B3C] underline">
              Order Tracker
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="p-8 text-center bg-[#F8FAF8] rounded-2xl">
              <p className="text-sm text-[#607067]">You have not placed any orders yet.</p>
              <Link
                href="/shop"
                className="mt-4 inline-flex px-5 py-2.5 rounded-full bg-[#114B3C] text-white text-xs font-bold"
              >
                Browse Fresh Groceries
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => (
                <Link
                  key={ord.id}
                  href={`/orders/${ord.orderNumber}`}
                  className="block p-4 rounded-2xl border border-[#EAECE9] hover:border-[#114B3C] transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-[#14221C] font-mono">
                        {ord.orderNumber}
                      </p>
                      <p className="text-xs text-[#607067] mt-0.5">
                        {new Date(ord.createdAt).toLocaleDateString()} ·{' '}
                        {ord.paymentMethod.toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-[#14221C] tabular-nums">
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
