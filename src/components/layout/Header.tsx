'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  Heart,
  MapPin,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingBasket,
  ShoppingCart,
  User,
  X,
  Zap,
} from 'lucide-react';
import { useStore } from '@/src/context/StoreContext';
import { formatCurrency } from '@/src/lib/pricing';
import type { ProductWithCategory } from '@/src/db/queries';

const NAV_CATEGORIES = [
  { name: 'Vegetables', slug: 'vegetables' },
  { name: 'Fruits', slug: 'fruits' },
  { name: 'Snacks & Breads', slug: 'snacks-breads' },
  { name: 'Chicken & Meat', slug: 'chicken-meat' },
  { name: 'Fish', slug: 'fish' },
  { name: 'Milk & Dairy', slug: 'milk-dairy' },
  { name: 'Drinks', slug: 'drinks' },
  { name: 'Household', slug: 'household' },
];

const DELIVERY_ZONES = [
  'Downtown Market · 15 min',
  'Northside Heights · 18 min',
  'Greenfield Park · 15 min',
  'Harbor District · 20 min',
];

export function Header() {
  const router = useRouter();
  const {
    cartCount,
    wishlistIds,
    setIsCartOpen,
    deliveryLocation,
    setDeliveryLocation,
    dbUser,
    firebaseUser,
  } = useStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [customLocation, setCustomLocation] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ProductWithCategory[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestions((data.products || []).slice(0, 6));
        }
      } catch {
        // ignore abort
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target as Node)
      ) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFocused(false);
    const q = searchQuery.trim();
    router.push(q ? `/shop?search=${encodeURIComponent(q)}` : '/shop');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#114B3C] text-white border-b border-white/10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-16 md:h-[72px] flex items-center justify-between gap-3 md:gap-6">
          {/* Left: Hamburger + Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
              className="p-2 -ml-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link
              href="/"
              className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group"
            >
              <span className="w-9 h-9 rounded-xl bg-[#B2F565] text-[#114B3C] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <ShoppingBasket className="w-5 h-5 stroke-[2.25]" />
              </span>
              <span className="text-xl font-bold tracking-tight text-white">
                Gromuse
              </span>
            </Link>
          </div>

          {/* Center: Search Bar with Autocomplete Suggestions (Desktop/Tablet) */}
          <div
            ref={searchWrapperRef}
            className="hidden md:block relative flex-1 max-w-xl"
          >
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="search"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (val.trim().length < 2) setSuggestions([]);
                }}
                placeholder="Search for Grocery, Stores, Vegetable or Meat"
                aria-label="Search groceries"
                className="w-full h-11 pl-5 pr-12 rounded-full bg-white text-[#14221C] placeholder:text-[#6B7B73] text-sm focus:outline-none focus:ring-2 focus:ring-[#B2F565]"
              />
              <button
                type="submit"
                aria-label="Submit search"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-[#114B3C] hover:bg-[#F2F5F3] transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            <AnimatePresence>
              {searchFocused && searchQuery.trim().length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 mt-2 bg-white text-[#14221C] rounded-2xl shadow-xl border border-[#E4EAE6] overflow-hidden z-50"
                >
                  {searching ? (
                    <div className="p-4 text-sm text-[#607067]">
                      Searching groceries...
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="p-4 text-sm text-[#607067]">
                      No groceries matched &ldquo;{searchQuery}&rdquo;. Press Enter to browse all items.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#F1F4F2]">
                      {suggestions.map((item) => (
                        <Link
                          key={item.id}
                          href={`/products/${item.slug}`}
                          onClick={() => setSearchFocused(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F6F9F7] transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-white border border-[#EAECE9] relative shrink-0 overflow-hidden">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              sizes="40px"
                              referrerPolicy="no-referrer"
                              className="object-contain p-1"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{item.name}</p>
                            <p className="text-xs text-[#607067]">
                              {item.categoryName} · {item.unitWeight}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-[#114B3C] tabular-nums">
                            {formatCurrency(item.priceCents)}
                          </span>
                        </Link>
                      ))}
                      <button
                        type="button"
                        onClick={handleSearchSubmit}
                        className="w-full py-2.5 text-xs font-semibold text-[#114B3C] bg-[#F4F8F5] hover:bg-[#EAF2EC] transition-colors"
                      >
                        View all search results for &ldquo;{searchQuery}&rdquo; →
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Delivery promise, Wishlist, Cart, Account */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setLocationOpen(true)}
              aria-label="Change delivery location"
              className="hidden xl:flex items-center gap-1.5 text-xs font-medium text-white/95 hover:text-[#B2F565] transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/10 whitespace-nowrap"
            >
              <Zap className="w-4 h-4 text-[#F8D24A] fill-[#F8D24A]" />
              <span>Order now and get it within</span>
              <span className="font-bold text-[#F8D24A]">15 min!</span>
            </button>

            <Link
              href="/wishlist"
              aria-label={`Wishlist (${wishlistIds.length} items)`}
              className="relative w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <Heart className="w-4 h-4" />
              {wishlistIds.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#B2F565] text-[#114B3C] text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {wishlistIds.length}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Open shopping cart (${cartCount} items)`}
              className="relative w-10 h-10 rounded-full bg-white text-[#114B3C] hover:bg-[#B2F565] flex items-center justify-center transition-colors shadow-sm"
            >
              <ShoppingCart className="w-4 h-4 stroke-[2.2]" />
              <span
                data-testid="header-cart-count"
                className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 rounded-full bg-[#F8D24A] text-[#14221C] text-[11px] font-bold flex items-center justify-center tabular-nums shadow-xs"
              >
                {cartCount}
              </span>
            </button>

            <Link
              href="/account"
              aria-label="Customer account"
              className="w-10 h-10 rounded-full bg-[#E6EFEA] text-[#114B3C] hover:ring-2 hover:ring-[#B2F565] flex items-center justify-center overflow-hidden transition-all shrink-0"
            >
              {firebaseUser?.photoURL ? (
                <Image
                  src={firebaseUser.photoURL}
                  alt={dbUser?.name || 'Account'}
                  width={40}
                  height={40}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 stroke-[2.2]" />
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar (compact inside header container on small screens) */}
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Grocery, Vegetables or Meat..."
              aria-label="Search groceries on mobile"
              className="w-full h-9 pl-4 pr-10 rounded-full bg-white text-[#14221C] placeholder:text-[#6B7B73] text-xs focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Submit mobile search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#114B3C]"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </header>

      {/* Navigation Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-xs"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="relative z-10 w-80 max-w-[85vw] bg-white text-[#14221C] h-full flex flex-col shadow-2xl"
            >
              <div className="p-5 bg-[#114B3C] text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-[#B2F565] text-[#114B3C] flex items-center justify-center">
                    <ShoppingBasket className="w-4 h-4" />
                  </span>
                  <span className="text-lg font-bold">Gromuse</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-1.5 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 border-b border-[#EAECE9] bg-[#F7FAF7]">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setLocationOpen(true);
                  }}
                  className="w-full flex items-center gap-2 text-left text-xs font-medium text-[#114B3C]"
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="truncate">{deliveryLocation}</span>
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#607067] mb-2.5 px-2">
                    Shop
                  </p>
                  <ul className="space-y-1">
                    <li>
                      <Link
                        href="/"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#F2F6F3]"
                      >
                        Home Storefront
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/shop"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#F2F6F3]"
                      >
                        All Grocery Products
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/cart"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#F2F6F3]"
                      >
                        Shopping Cart ({cartCount})
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/wishlist"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#F2F6F3]"
                      >
                        Wishlist ({wishlistIds.length})
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#607067] mb-2.5 px-2">
                    Categories
                  </p>
                  <ul className="space-y-1">
                    {NAV_CATEGORIES.map((cat) => (
                      <li key={cat.slug}>
                        <Link
                          href={`/categories/${cat.slug}`}
                          onClick={() => setMenuOpen(false)}
                          className="block px-3 py-2 rounded-lg text-sm text-[#2A3B33] hover:bg-[#F2F6F3]"
                        >
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#607067] mb-2.5 px-2">
                    Account & Support
                  </p>
                  <ul className="space-y-1">
                    <li>
                      <Link
                        href="/account"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-[#F2F6F3]"
                      >
                        <User className="w-4 h-4 text-[#114B3C]" />
                        Customer Account
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/orders"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-[#F2F6F3]"
                      >
                        <Package className="w-4 h-4 text-[#114B3C]" />
                        Orders & Tracking
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#114B3C] hover:bg-[#EEF6F0]"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/about"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2 rounded-lg text-sm hover:bg-[#F2F6F3]"
                      >
                        About Gromuse
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/contact"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2 rounded-lg text-sm hover:bg-[#F2F6F3]"
                      >
                        Contact & Help Center
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/faq"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2 rounded-lg text-sm hover:bg-[#F2F6F3]"
                      >
                        FAQ
                      </Link>
                    </li>
                  </ul>
                </div>
              </nav>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Delivery Location Modal */}
      <AnimatePresence>
        {locationOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLocationOpen(false)}
              className="fixed inset-0 bg-black/45"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative z-10 w-full max-w-md bg-white text-[#14221C] rounded-2xl p-6 shadow-xl border border-[#EAECE9]"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Select Delivery Zone</h2>
                <button
                  type="button"
                  onClick={() => setLocationOpen(false)}
                  aria-label="Close delivery location dialog"
                  className="p-1.5 rounded-lg hover:bg-[#F2F5F3]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-[#607067] mb-4">
                Choose your nearest Gromuse local fulfillment hub for 15-minute delivery.
              </p>
              <div className="space-y-2 mb-4">
                {DELIVERY_ZONES.map((zone) => (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => {
                      setDeliveryLocation(zone);
                      setLocationOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                      deliveryLocation === zone
                        ? 'border-[#114B3C] bg-[#F2F8F4] text-[#114B3C]'
                        : 'border-[#EAECE9] hover:bg-[#F8FAF8]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#114B3C]" />
                      {zone}
                    </span>
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customLocation.trim()) {
                    setDeliveryLocation(`${customLocation.trim()} · 15-20 min`);
                    setCustomLocation('');
                    setLocationOpen(false);
                  }
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="Enter neighborhood or postal code..."
                  className="flex-1 h-10 px-3 rounded-xl border border-[#DCE3DE] text-sm focus:outline-none focus:border-[#114B3C]"
                />
                <button
                  type="submit"
                  className="px-4 h-10 rounded-xl bg-[#114B3C] text-white text-sm font-semibold hover:bg-[#0D3C30]"
                >
                  Save
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
