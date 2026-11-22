'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, googleAuthProvider } from '@/src/lib/firebase';
import {
  ApplicableCoupon,
  OrderTotals,
  calculateOrderTotals,
} from '@/src/lib/pricing';
import type { ProductWithCategory } from '@/src/db/queries';

export interface CartItem {
  productId: number;
  sku: string;
  name: string;
  slug: string;
  storeName: string;
  categoryName: string;
  unitWeight: string;
  priceCents: number;
  originalPriceCents: number | null;
  discountPercent: number;
  stockQuantity: number;
  imageUrl: string;
  quantity: number;
}

export interface DbUser {
  id: number;
  uid: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  avatarUrl: string;
}

interface StoreContextValue {
  cart: CartItem[];
  cartCount: number;
  wishlistIds: number[];
  wishlistProducts: ProductWithCategory[];
  appliedCoupon: ApplicableCoupon | null;
  totals: OrderTotals;
  hydrated: boolean;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  deliveryLocation: string;
  setDeliveryLocation: (loc: string) => void;
  sessionId: string;
  firebaseUser: FirebaseUser | null;
  dbUser: DbUser | null;
  idToken: string | null;
  authLoading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  addToCart: (product: ProductWithCategory | CartItem, qty?: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleWishlist: (product: ProductWithCategory) => Promise<boolean>;
  applyCoupon: (code: string) => Promise<{ ok: boolean; error?: string }>;
  removeCoupon: () => void;
  getItemQuantity: (productId: number) => number;
  isInWishlist: (productId: number) => boolean;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_STORAGE_KEY = 'gromuse_cart_v1';
const WISHLIST_STORAGE_KEY = 'gromuse_wishlist_v1';
const SESSION_STORAGE_KEY = 'gromuse_session_v1';
const LOCATION_STORAGE_KEY = 'gromuse_location_v1';
const COUPON_STORAGE_KEY = 'gromuse_coupon_v1';

function createSessionToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `grm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<ProductWithCategory[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<ApplicableCoupon | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryLocation, setDeliveryLocationState] = useState('Downtown Market · 15 min');
  const [sessionId, setSessionId] = useState('');
  const [hydrated, setHydrated] = useState(false);

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Hydrate local persistence immediately on mount
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        let sid = window.localStorage.getItem(SESSION_STORAGE_KEY);
        if (!sid || sid.length < 8) {
          sid = createSessionToken();
          window.localStorage.setItem(SESSION_STORAGE_KEY, sid);
        }
        setSessionId(sid);

        const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed)) setCart(parsed);
        }

        const savedWish = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
        if (savedWish) {
          const parsed = JSON.parse(savedWish);
          if (Array.isArray(parsed)) setWishlistProducts(parsed);
        }

        const savedLoc = window.localStorage.getItem(LOCATION_STORAGE_KEY);
        if (savedLoc) setDeliveryLocationState(savedLoc);

        const savedCoupon = window.localStorage.getItem(COUPON_STORAGE_KEY);
        if (savedCoupon) setAppliedCoupon(JSON.parse(savedCoupon));
      } catch {
        // Ignore storage parsing errors
      } finally {
        setHydrated(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Persist cart/wishlist/coupon locally whenever updated post-hydration
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore quota
    }
  }, [cart, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistProducts));
    } catch {
      // ignore quota
    }
  }, [wishlistProducts, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (appliedCoupon) {
        window.localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
      } else {
        window.localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [appliedCoupon, hydrated]);

  const setDeliveryLocation = useCallback((loc: string) => {
    setDeliveryLocationState(loc);
    try {
      window.localStorage.setItem(LOCATION_STORAGE_KEY, loc);
    } catch {
      // ignore
    }
  }, []);

  const syncServerAuth = useCallback(
    async (user: FirebaseUser | null, sid: string) => {
      if (!user) {
        setIdToken(null);
        setDbUser(null);
        setAuthLoading(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        setIdToken(token);
        const headers: Record<string, string> = {
          Authorization: `Bearer ${token}`,
        };
        if (sid) headers['x-gromuse-session'] = sid;

        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers,
        });
        if (res.ok) {
          const data = await res.json();
          setDbUser(data.user ?? null);
        }
      } catch (err) {
        console.error('Auth sync error:', err);
      } finally {
        setAuthLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      const currentSid =
        sessionId ||
        (typeof window !== 'undefined'
          ? window.localStorage.getItem(SESSION_STORAGE_KEY) || ''
          : '');
      void syncServerAuth(user, currentSid);
    });
    return () => unsub();
  }, [sessionId, syncServerAuth]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      await syncServerAuth(cred.user, sessionId);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Unable to sign in with Google right now.';
      setAuthError(msg);
    }
  }, [sessionId, syncServerAuth]);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
    setDbUser(null);
    setIdToken(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!firebaseUser) return;
    await syncServerAuth(firebaseUser, sessionId);
  }, [firebaseUser, sessionId, syncServerAuth]);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (sessionId) h['x-gromuse-session'] = sessionId;
    if (idToken) h.Authorization = `Bearer ${idToken}`;
    return h;
  }, [sessionId, idToken]);

  const syncCartItemRemote = useCallback(
    async (productId: number, quantity: number) => {
      if (!sessionId && !idToken) return;
      try {
        await fetch('/api/cart', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ productId, quantity }),
        });
      } catch {
        // local state remains intact
      }
    },
    [sessionId, idToken, getAuthHeaders]
  );

  const addToCart = useCallback(
    async (product: ProductWithCategory | CartItem, qty: number = 1) => {
      const productId = 'productId' in product ? product.productId : product.id;
      let nextQuantity = qty;
      setCart((prev) => {
        const idx = prev.findIndex((item) => item.productId === productId);
        if (idx >= 0) {
          nextQuantity = Math.min(product.stockQuantity || 99, prev[idx].quantity + qty);
          const updated = [...prev];
          updated[idx] = { ...updated[idx], quantity: nextQuantity };
          return updated;
        }
        nextQuantity = Math.max(1, Math.min(product.stockQuantity || 99, qty));
        const newItem: CartItem = {
          productId,
          sku: product.sku,
          name: product.name,
          slug: product.slug,
          storeName: product.storeName,
          categoryName: product.categoryName,
          unitWeight: product.unitWeight,
          priceCents: product.priceCents,
          originalPriceCents: product.originalPriceCents,
          discountPercent: product.discountPercent,
          stockQuantity: product.stockQuantity,
          imageUrl: product.imageUrl,
          quantity: nextQuantity,
        };
        return [...prev, newItem];
      });
      await syncCartItemRemote(productId, nextQuantity);
    },
    [syncCartItemRemote]
  );

  const updateQuantity = useCallback(
    async (productId: number, quantity: number) => {
      const cleanQty = Math.max(0, Math.floor(quantity));
      setCart((prev) => {
        if (cleanQty <= 0) {
          return prev.filter((item) => item.productId !== productId);
        }
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.min(item.stockQuantity || 99, cleanQty) }
            : item
        );
      });
      await syncCartItemRemote(productId, cleanQty);
    },
    [syncCartItemRemote]
  );

  const removeFromCart = useCallback(
    async (productId: number) => {
      setCart((prev) => prev.filter((item) => item.productId !== productId));
      await syncCartItemRemote(productId, 0);
    },
    [syncCartItemRemote]
  );

  const clearCart = useCallback(async () => {
    setCart([]);
    setAppliedCoupon(null);
    if (sessionId || idToken) {
      try {
        await fetch('/api/cart', {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
      } catch {
        // ignore
      }
    }
  }, [sessionId, idToken, getAuthHeaders]);

  const toggleWishlist = useCallback(
    async (product: ProductWithCategory): Promise<boolean> => {
      let saved = false;
      setWishlistProducts((prev) => {
        const exists = prev.some((p) => p.id === product.id);
        if (exists) {
          saved = false;
          return prev.filter((p) => p.id !== product.id);
        }
        saved = true;
        return [product, ...prev];
      });
      if (sessionId || idToken) {
        try {
          await fetch('/api/wishlist', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ productId: product.id }),
          });
        } catch {
          // ignore
        }
      }
      return saved;
    },
    [sessionId, idToken, getAuthHeaders]
  );

  const totals = useMemo(
    () => calculateOrderTotals(cart, appliedCoupon),
    [cart, appliedCoupon]
  );

  const applyCoupon = useCallback(
    async (code: string): Promise<{ ok: boolean; error?: string }> => {
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) return { ok: false, error: 'Enter a coupon code.' };
      try {
        const res = await fetch('/api/coupons/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: cleanCode,
            subtotalCents: totals.subtotalCents,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { ok: false, error: data.error || 'Coupon is invalid.' };
        }
        setAppliedCoupon({
          code: data.coupon.code,
          discountType: data.coupon.discountType,
          discountValue: data.coupon.discountValue,
          minOrderCents: data.coupon.minOrderCents,
          isActive: true,
        });
        return { ok: true };
      } catch {
        return { ok: false, error: 'Unable to validate coupon.' };
      }
    },
    [totals.subtotalCents]
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const wishlistIds = useMemo(
    () => wishlistProducts.map((p) => p.id),
    [wishlistProducts]
  );

  const getItemQuantity = useCallback(
    (productId: number) =>
      cart.find((item) => item.productId === productId)?.quantity ?? 0,
    [cart]
  );

  const isInWishlist = useCallback(
    (productId: number) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const value: StoreContextValue = {
    cart,
    cartCount,
    wishlistIds,
    wishlistProducts,
    appliedCoupon,
    totals,
    hydrated,
    isCartOpen,
    setIsCartOpen,
    deliveryLocation,
    setDeliveryLocation,
    sessionId,
    firebaseUser,
    dbUser,
    idToken,
    authLoading,
    authError,
    signInWithGoogle,
    signOutUser,
    refreshProfile,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    toggleWishlist,
    applyCoupon,
    removeCoupon,
    getItemQuantity,
    isInWishlist,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used inside StoreProvider');
  }
  return ctx;
}
