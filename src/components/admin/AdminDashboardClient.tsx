'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import {
  AlertTriangle,
  Boxes,
  DollarSign,
  FolderTree,
  Package,
  Plus,
  ShieldCheck,
  Tag,
  Trash2,
  Users,
} from 'lucide-react';
import { useStore } from '@/src/context/StoreContext';
import { formatCurrency } from '@/src/lib/pricing';
import type { ProductWithCategory } from '@/src/db/queries';

interface AdminStats {
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  totalRevenueCents: number;
  lowStockCount: number;
}

interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  subtitle: string;
  imageUrl: string;
}

interface AdminOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  totalCents: number;
  createdAt: string;
}

interface AdminCoupon {
  id: number;
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  minOrderCents: number;
  usedCount: number;
  isActive: boolean;
}

interface AdminCustomer {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

type AdminTab = 'overview' | 'products' | 'categories' | 'orders' | 'coupons' | 'customers';

export function AdminDashboardClient() {
  const { firebaseUser, dbUser, idToken, authLoading, signInWithGoogle } = useStore();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [loadingData, setLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);

  // New Product Form
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCatId, setNewProdCatId] = useState<number>(1);
  const [newProdPrice, setNewProdPrice] = useState('9.99');
  const [newProdWeight, setNewProdWeight] = useState('500 gm.');
  const [newProdStock, setNewProdStock] = useState('40');
  const [newProdImage, setNewProdImage] = useState('/images/prod-tomatoes.jpg');
  const [newProdDesc, setNewProdDesc] = useState(
    'Freshly harvested organic grocery staple prepared daily for Gromuse delivery.'
  );

  // New Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatSub, setNewCatSub] = useState('Local market');

  // New Coupon Form
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percent' | 'fixed'>('percent');
  const [newCouponVal, setNewCouponVal] = useState('15');
  const [newCouponMin, setNewCouponMin] = useState('20');

  const fetchOverview = useCallback(async () => {
    if (!idToken || dbUser?.role !== 'admin') return;
    setLoadingData(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to load dashboard.');
        return;
      }
      setStats(data.stats);
      setProducts(data.products || []);
      setCategories(data.categories || []);
      if (data.categories?.[0]?.id) {
        setNewProdCatId(data.categories[0].id);
      }
      setOrders(data.orders || []);
      setCoupons(data.coupons || []);
      setCustomers(data.customers || []);
    } catch {
      setErrorMsg('Unable to fetch admin dashboard data.');
    } finally {
      setLoadingData(false);
    }
  }, [idToken, dbUser?.role]);

  useEffect(() => {
    if (!idToken || dbUser?.role !== 'admin') return;
    let cancelled = false;
    fetch('/api/admin/overview', {
      headers: { Authorization: `Bearer ${idToken}` },
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setErrorMsg(data.error || 'Failed to load dashboard.');
          return;
        }
        setStats(data.stats);
        setProducts(data.products || []);
        setCategories(data.categories || []);
        if (data.categories?.[0]?.id) {
          setNewProdCatId(data.categories[0].id);
        }
        setOrders(data.orders || []);
        setCoupons(data.coupons || []);
        setCustomers(data.customers || []);
      })
      .catch(() => {
        if (!cancelled) setErrorMsg('Unable to fetch admin dashboard data.');
      });
    return () => {
      cancelled = true;
    };
  }, [idToken, dbUser?.role]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken) return;
    setErrorMsg(null);
    const priceCents = Math.round(parseFloat(newProdPrice || '0') * 100);
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        name: newProdName,
        sku: newProdSku || `GRM-${Date.now().toString().slice(-5)}`,
        categoryId: newProdCatId,
        priceCents,
        unitWeight: newProdWeight,
        stockQuantity: Number(newProdStock),
        imageUrl: newProdImage,
        description: newProdDesc,
        storeName: 'Gromuse Fresh',
        sectionTags: ['just-for-you'],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || 'Could not create product.');
      return;
    }
    setNewProdName('');
    setNewProdSku('');
    await fetchOverview();
  };

  const handleUpdateStock = async (id: number, stockQuantity: number) => {
    if (!idToken) return;
    await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ id, stockQuantity: Math.max(0, stockQuantity) }),
    });
    await fetchOverview();
  };

  const handleDeleteProduct = async (id: number) => {
    if (!idToken) return;
    const res = await fetch(`/api/admin/products?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${idToken}` },
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || 'Cannot delete product.');
      return;
    }
    await fetchOverview();
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken || !newCatName.trim()) return;
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ name: newCatName, subtitle: newCatSub }),
    });
    if (res.ok) {
      setNewCatName('');
      await fetchOverview();
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!idToken) return;
    const res = await fetch(`/api/admin/categories?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${idToken}` },
    });
    const data = await res.json();
    if (!res.ok) setErrorMsg(data.error || 'Cannot delete category.');
    else await fetchOverview();
  };

  const handleOrderStatusChange = async (
    orderId: number,
    orderStatus: string,
    paymentStatus: string
  ) => {
    if (!idToken) return;
    await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ id: orderId, orderStatus, paymentStatus }),
    });
    await fetchOverview();
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken) return;
    const discountValue =
      newCouponType === 'percent'
        ? Number(newCouponVal)
        : Math.round(parseFloat(newCouponVal || '0') * 100);
    const minOrderCents = Math.round(parseFloat(newCouponMin || '0') * 100);

    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        code: newCouponCode.toUpperCase(),
        description: newCouponDesc || `${newCouponCode.toUpperCase()} promotional offer`,
        discountType: newCouponType,
        discountValue,
        minOrderCents,
        isActive: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || 'Unable to create coupon.');
      return;
    }
    setNewCouponCode('');
    setNewCouponDesc('');
    await fetchOverview();
  };

  const handleToggleCoupon = async (id: number, isActive: boolean) => {
    if (!idToken) return;
    await fetch('/api/admin/coupons', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ id, isActive }),
    });
    await fetchOverview();
  };

  const handleDeleteCoupon = async (id: number) => {
    if (!idToken) return;
    await fetch(`/api/admin/coupons?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${idToken}` },
    });
    await fetchOverview();
  };

  if (authLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-10">
        <div className="bg-white rounded-3xl border border-[#EAECE9] p-12 text-center text-sm text-[#607067]">
          Verifying admin session...
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-10">
        <div className="max-w-lg mx-auto bg-white rounded-3xl border border-[#EAECE9] p-8 sm:p-10 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#EEF6F0] text-[#114B3C] flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#14221C]">
            Gromuse Store Admin Login
          </h1>
          <p className="text-sm text-[#607067] mt-2 leading-relaxed">
            Sign in with an authorized administrator Google account to manage products, inventory, categories, orders, and coupons.
          </p>
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="mt-6 w-full h-12 rounded-full bg-[#114B3C] text-white text-sm font-bold hover:bg-[#0D3C30] transition-colors"
          >
            Sign in with Google Admin Account
          </button>
        </div>
      </div>
    );
  }

  if (dbUser && dbUser.role !== 'admin') {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-10">
        <div className="max-w-lg mx-auto bg-white rounded-3xl border border-[#EAECE9] p-8 text-center">
          <ShieldCheck className="w-10 h-10 text-amber-600 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-[#14221C]">
            Administrator Access Required
          </h1>
          <p className="text-sm text-[#607067] mt-2">
            You are signed in as <span className="font-semibold">{dbUser.email}</span> (customer role). Add this email to <code className="font-mono text-xs">ADMIN_EMAILS</code> in environment secrets to grant admin dashboard access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#14221C] tracking-tight">
            Gromuse Admin Dashboard
          </h1>
          <p className="text-sm text-[#607067] mt-1">
            Signed in as {dbUser?.email} · Live PostgreSQL Store Operations
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchOverview()}
          className="px-5 h-10 rounded-full bg-[#114B3C] text-white text-xs font-bold hover:bg-[#0D3C30]"
        >
          {loadingData ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Overview KPIs */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl border border-[#EAECE9] p-5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#607067]">
              <span>Total Revenue</span>
              <DollarSign className="w-4 h-4 text-[#114B3C]" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[#14221C] tabular-nums">
              {formatCurrency(stats.totalRevenueCents)}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#EAECE9] p-5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#607067]">
              <span>Total Orders</span>
              <Package className="w-4 h-4 text-[#114B3C]" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[#14221C] tabular-nums">
              {stats.totalOrders}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#EAECE9] p-5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#607067]">
              <span>Total Products</span>
              <Boxes className="w-4 h-4 text-[#114B3C]" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[#14221C] tabular-nums">
              {stats.totalProducts}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#EAECE9] p-5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#607067]">
              <span>Customers</span>
              <Users className="w-4 h-4 text-[#114B3C]" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[#14221C] tabular-nums">
              {stats.totalCustomers}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#EAECE9] p-5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#607067]">
              <span>Low Stock (&le;15)</span>
              <AlertTriangle className="w-4 h-4 text-[#B45320]" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[#B45320] tabular-nums">
              {stats.lowStockCount}
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(
          [
            { id: 'overview', label: 'Overview' },
            { id: 'products', label: 'Products & Inventory' },
            { id: 'categories', label: 'Categories' },
            { id: 'orders', label: 'Orders' },
            { id: 'coupons', label: 'Coupons' },
            { id: 'customers', label: 'Customers' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
              tab === item.id
                ? 'bg-[#114B3C] text-white'
                : 'bg-white border border-[#EAECE9] text-[#4A5A52] hover:bg-[#F4F7F5]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-[#EAECE9] p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#14221C]">Recent Orders</h2>
            {orders.length === 0 ? (
              <p className="text-sm text-[#607067]">No orders placed yet.</p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 6).map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-2xl bg-[#F8FAF8] flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold font-mono text-[#14221C]">
                        {ord.orderNumber}
                      </p>
                      <p className="text-[#607067]">
                        {ord.customerName} · {ord.orderStatus}
                      </p>
                    </div>
                    <span className="font-bold tabular-nums text-sm">
                      {formatCurrency(ord.totalCents)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-[#EAECE9] p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#14221C]">Inventory Watchlist</h2>
            <div className="space-y-2.5">
              {products.slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-[#F8FAF8] flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-[#14221C]">{p.name}</span>
                  <span className="tabular-nums font-bold text-[#114B3C]">
                    {p.stockQuantity} in stock
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-6">
          <form
            onSubmit={handleCreateProduct}
            className="bg-white rounded-3xl border border-[#EAECE9] p-6 space-y-4"
          >
            <h2 className="text-lg font-bold text-[#14221C] flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#114B3C]" />
              Add New Product
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                required
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                placeholder="Product name"
                className="h-10 px-3.5 rounded-xl border border-[#DCE3DE] text-sm"
              />
              <input
                value={newProdSku}
                onChange={(e) => setNewProdSku(e.target.value)}
                placeholder="SKU (optional)"
                className="h-10 px-3.5 rounded-xl border border-[#DCE3DE] text-sm"
              />
              <select
                value={newProdCatId}
                onChange={(e) => setNewProdCatId(Number(e.target.value))}
                className="h-10 px-3.5 rounded-xl border border-[#DCE3DE] text-sm bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                required
                value={newProdPrice}
                onChange={(e) => setNewProdPrice(e.target.value)}
                placeholder="Price ($)"
                className="h-10 px-3.5 rounded-xl border border-[#DCE3DE] text-sm"
              />
              <input
                required
                value={newProdWeight}
                onChange={(e) => setNewProdWeight(e.target.value)}
                placeholder="Weight (e.g. 500 gm.)"
                className="h-10 px-3.5 rounded-xl border border-[#DCE3DE] text-sm"
              />
              <input
                required
                type="number"
                value={newProdStock}
                onChange={(e) => setNewProdStock(e.target.value)}
                placeholder="Stock qty"
                className="h-10 px-3.5 rounded-xl border border-[#DCE3DE] text-sm"
              />
              <input
                required
                value={newProdImage}
                onChange={(e) => setNewProdImage(e.target.value)}
                placeholder="Image URL"
                className="h-10 px-3.5 rounded-xl border border-[#DCE3DE] text-sm sm:col-span-2"
              />
            </div>
            <textarea
              rows={2}
              value={newProdDesc}
              onChange={(e) => setNewProdDesc(e.target.value)}
              className="w-full p-3 rounded-xl border border-[#DCE3DE] text-sm"
            />
            <button
              type="submit"
              className="px-6 h-10 rounded-full bg-[#B2F565] text-[#114B3C] text-xs font-bold hover:bg-[#A3EB52]"
            >
              Create Product
            </button>
          </form>

          <div className="bg-white rounded-3xl border border-[#EAECE9] overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7FAF7] text-xs font-bold text-[#607067] border-b border-[#EAECE9]">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Inventory</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F3F1]">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg border border-[#EAECE9] relative shrink-0 overflow-hidden bg-white">
                          <Image
                            src={p.imageUrl}
                            alt={p.name}
                            fill
                            sizes="40px"
                            referrerPolicy="no-referrer"
                            className="object-contain p-1"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-[#14221C]">{p.name}</p>
                          <p className="text-xs text-[#607067] font-mono">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-[#4A5A52]">{p.categoryName}</td>
                    <td className="p-4 font-bold tabular-nums">
                      {formatCurrency(p.priceCents)}
                    </td>
                    <td className="p-4">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleUpdateStock(p.id, p.stockQuantity - 5)}
                          className="px-2 py-1 rounded bg-[#F2F4F2] text-xs font-bold"
                        >
                          -5
                        </button>
                        <span className="tabular-nums font-bold min-w-[30px] text-center">
                          {p.stockQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleUpdateStock(p.id, p.stockQuantity + 5)}
                          className="px-2 py-1 rounded bg-[#E7F6D5] text-[#114B3C] text-xs font-bold"
                        >
                          +5
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => void handleDeleteProduct(p.id)}
                        aria-label={`Delete ${p.name}`}
                        className="p-2 rounded-lg text-[#85948C] hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateCategory}
            className="lg:col-span-4 bg-white rounded-3xl border border-[#EAECE9] p-6 space-y-4"
          >
            <h2 className="text-lg font-bold text-[#14221C] flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-[#114B3C]" />
              New Category
            </h2>
            <input
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Category name"
              className="w-full h-10 px-3.5 rounded-xl border border-[#DCE3DE] text-sm"
            />
            <input
              value={newCatSub}
              onChange={(e) => setNewCatSub(e.target.value)}
              placeholder="Subtitle (e.g. Organic Farm)"
              className="w-full h-10 px-3.5 rounded-xl border border-[#DCE3DE] text-sm"
            />
            <button
              type="submit"
              className="px-6 h-10 rounded-full bg-[#114B3C] text-white text-xs font-bold"
            >
              Add Category
            </button>
          </form>

          <div className="lg:col-span-8 bg-white rounded-3xl border border-[#EAECE9] divide-y divide-[#F0F3F1]">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#14221C]">{cat.name}</p>
                  <p className="text-xs text-[#607067]">
                    {cat.subtitle} · /{cat.slug}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeleteCategory(cat.id)}
                  className="p-2 text-[#85948C] hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="bg-white rounded-3xl border border-[#EAECE9] overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7FAF7] text-xs font-bold text-[#607067] border-b border-[#EAECE9]">
              <tr>
                <th className="p-4">Order</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Total</th>
                <th className="p-4">Order Status</th>
                <th className="p-4">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F3F1]">
              {orders.map((ord) => (
                <tr key={ord.id}>
                  <td className="p-4 font-mono font-bold text-xs">{ord.orderNumber}</td>
                  <td className="p-4 text-xs">
                    <p className="font-semibold text-[#14221C]">{ord.customerName}</p>
                    <p className="text-[#607067]">{ord.customerEmail}</p>
                  </td>
                  <td className="p-4 font-bold tabular-nums">
                    {formatCurrency(ord.totalCents)}
                  </td>
                  <td className="p-4">
                    <select
                      aria-label={`Order status for ${ord.orderNumber}`}
                      value={ord.orderStatus}
                      onChange={(e) =>
                        void handleOrderStatusChange(
                          ord.id,
                          e.target.value,
                          ord.paymentStatus
                        )
                      }
                      className="h-9 px-3 rounded-xl border border-[#DCE3DE] text-xs font-semibold bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="packed">Packed</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <select
                      aria-label={`Payment status for ${ord.orderNumber}`}
                      value={ord.paymentStatus}
                      onChange={(e) =>
                        void handleOrderStatusChange(
                          ord.id,
                          ord.orderStatus,
                          e.target.value
                        )
                      }
                      className="h-9 px-3 rounded-xl border border-[#DCE3DE] text-xs font-semibold bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateCoupon}
            className="lg:col-span-4 bg-white rounded-3xl border border-[#EAECE9] p-6 space-y-3"
          >
            <h2 className="text-lg font-bold text-[#14221C] flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#114B3C]" />
              Create Coupon
            </h2>
            <input
              required
              value={newCouponCode}
              onChange={(e) => setNewCouponCode(e.target.value)}
              placeholder="Code (e.g. SPRING20)"
              className="w-full h-10 px-3.5 rounded-xl border border-[#DCE3DE] text-sm uppercase"
            />
            <input
              value={newCouponDesc}
              onChange={(e) => setNewCouponDesc(e.target.value)}
              placeholder="Description"
              className="w-full h-10 px-3.5 rounded-xl border border-[#DCE3DE] text-sm"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <select
                value={newCouponType}
                onChange={(e) => setNewCouponType(e.target.value as 'percent' | 'fixed')}
                className="h-10 px-3 rounded-xl border border-[#DCE3DE] text-sm bg-white"
              >
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed ($)</option>
              </select>
              <input
                required
                value={newCouponVal}
                onChange={(e) => setNewCouponVal(e.target.value)}
                placeholder="Value"
                className="h-10 px-3 rounded-xl border border-[#DCE3DE] text-sm"
              />
            </div>
            <input
              value={newCouponMin}
              onChange={(e) => setNewCouponMin(e.target.value)}
              placeholder="Min order ($)"
              className="w-full h-10 px-3.5 rounded-xl border border-[#DCE3DE] text-sm"
            />
            <button
              type="submit"
              className="w-full h-10 rounded-full bg-[#B2F565] text-[#114B3C] text-xs font-bold"
            >
              Add Coupon
            </button>
          </form>

          <div className="lg:col-span-8 bg-white rounded-3xl border border-[#EAECE9] divide-y divide-[#F0F3F1]">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <p className="font-mono font-bold text-[#14221C]">{c.code}</p>
                  <p className="text-xs text-[#607067]">
                    {c.description} · Used {c.usedCount} times
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleToggleCoupon(c.id, !c.isActive)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                      c.isActive
                        ? 'bg-[#E7F6D5] text-[#114B3C]'
                        : 'bg-[#F2F4F2] text-[#607067]'
                    }`}
                  >
                    {c.isActive ? 'Active' : 'Paused'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteCoupon(c.id)}
                    className="p-2 text-[#85948C] hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'customers' && (
        <div className="bg-white rounded-3xl border border-[#EAECE9] overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7FAF7] text-xs font-bold text-[#607067] border-b border-[#EAECE9]">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F3F1]">
              {customers.map((u) => (
                <tr key={u.id}>
                  <td className="p-4 font-semibold">{u.name || 'Customer'}</td>
                  <td className="p-4 text-xs text-[#4A5A52]">{u.email}</td>
                  <td className="p-4 text-xs font-bold uppercase text-[#114B3C]">
                    {u.role}
                  </td>
                  <td className="p-4 text-xs text-[#607067]">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
