'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Clock,
  Heart,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Truck,
  Zap,
} from 'lucide-react';
import { ProductCard } from '@/src/components/products/ProductCard';
import { useStore } from '@/src/context/StoreContext';
import { formatCurrency } from '@/src/lib/pricing';
import type { ProductWithCategory } from '@/src/db/queries';

export interface CategoryRecord {
  id: number;
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  accentColor: string;
  sortOrder: number;
}

interface HomeStorefrontProps {
  categories: CategoryRecord[];
  products: ProductWithCategory[];
}

const PROMO_CARDS = [
  {
    headline: 'Save',
    bigValue: '$29',
    desc: 'Enjoy Discount all types of Grocery & Frozen item',
    image: '/images/prod-whole-wheat-flour.jpg',
    bgBottom: 'bg-[#5A1335]',
    bgTop: 'bg-[#FDF4F7]',
    textColor: 'text-[#5A1335]',
    href: '/shop?category=snacks-breads',
  },
  {
    headline: 'Discount',
    bigValue: '30%',
    desc: 'Enjoy Discount all types of Grocery & Honey item',
    image: '/images/prod-honey-jar.jpg',
    bgBottom: 'bg-[#A64B2A]',
    bgTop: 'bg-[#FDF6F2]',
    textColor: 'text-[#A64B2A]',
    href: '/shop?sort=discount',
  },
  {
    headline: 'Up to',
    bigValue: '50%',
    desc: 'Enjoy Discount all types of Pantry & Spreads item',
    image: '/images/prod-peanut-butter.jpg',
    bgBottom: 'bg-[#15457A]',
    bgTop: 'bg-[#F2F7FC]',
    textColor: 'text-[#15457A]',
    href: '/shop?sort=discount',
  },
  {
    headline: 'Free',
    bigValue: 'SHIP',
    desc: 'Enjoy Free Express Delivery on baskets $50+',
    image: '/images/prod-sweet-corn-can.jpg',
    bgBottom: 'bg-[#531F6F]',
    bgTop: 'bg-[#F7F2FC]',
    textColor: 'text-[#531F6F]',
    href: '/shop',
  },
];

const FEATURED_STORES = [
  {
    name: 'Crush grocery',
    subtitle: 'Delivery in 12 minute',
    bg: 'bg-[#E95D2A]',
    badgeBg: 'bg-white text-[#E95D2A]',
    icon: ShoppingBag,
    href: '/shop?category=vegetables',
  },
  {
    name: 'Delivery market',
    subtitle: 'Delivery in 12 minute',
    bg: 'bg-[#1668B2]',
    badgeBg: 'bg-white text-[#1668B2]',
    icon: Truck,
    href: '/shop?category=fruits',
  },
  {
    name: 'Quality product',
    subtitle: 'Delivery in 12 minute',
    bg: 'bg-[#0D8A6E]',
    badgeBg: 'bg-white text-[#0D8A6E]',
    icon: ShieldCheck,
    href: '/shop?category=milk-dairy',
  },
];

export function HomeStorefront({ categories, products }: HomeStorefrontProps) {
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist, applyCoupon } = useStore();

  const [weeklyTab, setWeeklyTab] = useState<string>('all');
  const [countdownSeconds, setCountdownSeconds] = useState(13 * 3600 + 10 * 60 + 32);
  const [couponBannerMsg, setCouponBannerMsg] = useState<string | null>(null);

  const spotlightProduct = useMemo(() => {
    return (
      products.find((p) => p.sectionTags.includes('spotlight')) ||
      products.find((p) => p.discountPercent > 0) ||
      products[0]
    );
  }, [products]);

  const [selectedThumb, setSelectedThumb] = useState<string | null>(null);
  const activeThumb =
    selectedThumb || spotlightProduct?.imageUrl || '/images/prod-whole-wheat-flour.jpg';

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = String(Math.floor(countdownSeconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((countdownSeconds % 3600) / 60)).padStart(2, '0');
  const secs = String(countdownSeconds % 60).padStart(2, '0');

  const youMightNeed = useMemo(() => {
    const tagged = products.filter((p) => p.sectionTags.includes('you-might-need'));
    return (tagged.length >= 10 ? tagged : products).slice(0, 10);
  }, [products]);

  const weeklyBestSelling = useMemo(() => {
    if (weeklyTab === 'all') {
      const tagged = products.filter((p) => p.sectionTags.includes('weekly-best'));
      return (tagged.length >= 5 ? tagged : products).slice(0, 5);
    }
    return products.filter((p) => p.categorySlug === weeklyTab).slice(0, 5);
  }, [products, weeklyTab]);

  const justForYou = useMemo(() => {
    const tagged = products.filter((p) => p.sectionTags.includes('just-for-you'));
    return (tagged.length >= 5 ? tagged : products).slice(0, 5);
  }, [products]);

  const trendingProducts = useMemo(() => {
    const tagged = products.filter((p) => p.sectionTags.includes('trending'));
    return (tagged.length >= 5 ? tagged : products).slice(0, 5);
  }, [products]);

  const recommendedProducts = useMemo(() => {
    const tagged = products.filter((p) => p.sectionTags.includes('recommended'));
    return (tagged.length >= 5 ? tagged : products).slice(0, 5);
  }, [products]);

  const handleHealthCardClaim = async () => {
    const res = await applyCoupon('HEALTH5');
    if (res.ok) {
      setCouponBannerMsg('HEALTH5 (5% off) applied to your basket!');
      setTimeout(() => setCouponBannerMsg(null), 4000);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-5 space-y-12 sm:space-y-14">
      {/* 1. HERO BANNER */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[28px] sm:rounded-[34px] bg-[#114B3C] text-white"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-6 px-6 sm:px-10 lg:px-14 py-9 sm:py-12">
          <div className="lg:col-span-6 relative z-10">
            <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold leading-[1.12] tracking-tight text-balance">
              We bring the store to your door
            </h1>
            <p className="mt-4 text-sm sm:text-base text-[#D7E8DF] max-w-md leading-relaxed">
              Get organic produce and sustainably sourced groceries delivery at up to 4% off grocery.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#B2F565] text-[#114B3C] text-sm font-bold hover:bg-[#A3EB52] transition-colors shadow-sm"
              >
                Shop now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/orders"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full border border-white/25 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                Track delivery
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[560px] aspect-[16/10] rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/images/hero-grocery-tote.jpg"
                alt="Fresh organic vegetables, fruits, and artisan bread in a reusable Gromuse tote bag"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 560px"
                referrerPolicy="no-referrer"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* 2. CATEGORY NAVIGATION STRIP */}
      <section aria-label="Grocery categories">
        <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar pb-2 lg:grid lg:grid-cols-5 xl:grid-cols-9 lg:overflow-visible lg:pb-0">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group min-w-[180px] lg:min-w-0 bg-[#F4F6F4] hover:bg-[#EBF2EC] rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-2.5 xl:flex-col xl:items-stretch xl:justify-between border border-transparent hover:border-[#D5E4D8] transition-all"
            >
              <div className="min-w-0">
                <h2 className="text-[13px] font-bold leading-snug text-[#14221C] group-hover:text-[#114B3C]">
                  {cat.name}
                </h2>
                <p className="text-[11px] text-[#607067] mt-0.5 leading-tight">
                  {cat.subtitle}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-white relative shrink-0 overflow-hidden border border-[#EAECE9] xl:self-end">
                <Image
                  src={cat.imageUrl}
                  alt={cat.name}
                  fill
                  sizes="44px"
                  referrerPolicy="no-referrer"
                  className="object-contain p-1 mix-blend-multiply group-hover:scale-105 transition-transform"
                />
              </div>
            </Link>
          ))}

          <Link
            href="/shop"
            className="min-w-[100px] lg:min-w-0 bg-[#D9F8B6] hover:bg-[#B2F565] rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 text-[#114B3C] font-bold text-xs transition-colors shrink-0"
          >
            <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <ArrowRight className="w-4 h-4" />
            </span>
            <span>See all</span>
          </Link>
        </div>
      </section>

      {/* 3. YOU MIGHT NEED */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-[26px] font-bold text-[#14221C] tracking-tight">
            You might need
          </h2>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#D96B27] hover:text-[#B85417] whitespace-nowrap"
          >
            See more <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {youMightNeed.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. FEATURED STORE STRIP */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-[26px] font-bold text-[#14221C] tracking-tight">
            Featured store
          </h2>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#D96B27] hover:text-[#B85417] whitespace-nowrap"
          >
            Visit all stores <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURED_STORES.map((store) => {
            const Icon = store.icon;
            return (
              <Link
                key={store.name}
                href={store.href}
                className={`group ${store.bg} text-white rounded-3xl p-6 flex items-center justify-between gap-4 hover:-translate-y-0.5 transition-transform shadow-sm`}
              >
                <div>
                  <div
                    className={`w-11 h-11 rounded-2xl ${store.badgeBg} flex items-center justify-center mb-4`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold">{store.name}</h3>
                  <p className="mt-1 text-xs text-white/90 inline-flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-[#F8D24A] fill-[#F8D24A]" />
                    {store.subtitle}
                  </p>
                </div>
                <span className="w-10 h-10 rounded-full bg-white/15 group-hover:bg-white/25 flex items-center justify-center transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. SPOTLIGHT DEAL MODULE (matches 00:11–00:14) */}
      {spotlightProduct && (
        <section className="bg-white rounded-[28px] border border-[#EAECE9] p-6 sm:p-8 lg:p-10 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5">
              <div className="relative aspect-square max-w-[380px] mx-auto rounded-2xl bg-white border border-[#F0F2F0] overflow-hidden">
                {spotlightProduct.discountPercent > 0 && (
                  <div className="absolute top-3 left-3 z-10 w-16 h-16 rounded-full bg-[#114B3C] text-white flex flex-col items-center justify-center text-center shadow-md">
                    <span className="text-base font-extrabold leading-none text-[#B2F565]">
                      {spotlightProduct.discountPercent}%
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">
                      Discount
                    </span>
                  </div>
                )}
                <Image
                  src={activeThumb}
                  alt={spotlightProduct.name}
                  fill
                  sizes="380px"
                  referrerPolicy="no-referrer"
                  className="object-contain p-6"
                />
              </div>

              {/* Thumbnails */}
              <div className="mt-4 flex items-center justify-center gap-3">
                {(spotlightProduct.galleryUrls.length > 0
                  ? spotlightProduct.galleryUrls
                  : [spotlightProduct.imageUrl]
                ).map((thumbUrl, idx) => (
                  <button
                    key={`${thumbUrl}-${idx}`}
                    type="button"
                    onClick={() => setSelectedThumb(thumbUrl)}
                    aria-label={`View gallery image ${idx + 1}`}
                    className={`w-16 h-16 rounded-xl border relative overflow-hidden bg-white transition-all ${
                      activeThumb === thumbUrl
                        ? 'border-[#D96B27] ring-2 ring-[#D96B27]/20'
                        : 'border-[#EAECE9] hover:border-[#B7C4BC]'
                    }`}
                  >
                    <Image
                      src={thumbUrl}
                      alt={`${spotlightProduct.name} view ${idx + 1}`}
                      fill
                      sizes="64px"
                      referrerPolicy="no-referrer"
                      className="object-contain p-1.5"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#D96B27] tabular-nums">
                <Clock className="w-4 h-4" />
                <span>Offer ends in {hours} : {mins} : {secs}</span>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#607067] flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-[#114B3C]" />
                  {spotlightProduct.storeName}
                </p>
                <Link
                  href={`/products/${spotlightProduct.slug}`}
                  className="block mt-1 text-2xl sm:text-3xl font-extrabold text-[#14221C] hover:text-[#114B3C] transition-colors"
                >
                  {spotlightProduct.name}
                </Link>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center text-[#F59E0B]">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <span className="font-semibold text-[#14221C] tabular-nums">
                  {(spotlightProduct.ratingX10 / 10).toFixed(1)} Rating
                </span>
                <span className="text-[#607067] tabular-nums">
                  ({spotlightProduct.reviewCount} reviews)
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-[#14221C] tabular-nums">
                  {formatCurrency(spotlightProduct.priceCents)}
                </span>
                {spotlightProduct.originalPriceCents && (
                  <span className="text-base text-[#8C9991] line-through tabular-nums">
                    {formatCurrency(spotlightProduct.originalPriceCents)}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => void addToCart(spotlightProduct, 1)}
                  className="px-6 h-11 rounded-full border border-[#14221C] text-[#14221C] text-sm font-bold hover:bg-[#14221C] hover:text-white transition-colors inline-flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Add to basket
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await addToCart(spotlightProduct, 1);
                    router.push('/checkout');
                  }}
                  className="px-7 h-11 rounded-full bg-[#B2F565] text-[#114B3C] text-sm font-bold hover:bg-[#A3EB52] transition-colors"
                >
                  Buy now
                </button>
                <button
                  type="button"
                  onClick={() => void toggleWishlist(spotlightProduct)}
                  className="px-4 h-11 rounded-full border border-[#DCE3DE] text-xs font-bold text-[#14221C] hover:bg-[#F5F7F5] inline-flex items-center gap-1.5"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isInWishlist(spotlightProduct.id)
                        ? 'fill-[#D9383A] text-[#D9383A]'
                        : ''
                    }`}
                  />
                  {isInWishlist(spotlightProduct.id) ? 'Saved' : 'Add to Wishlist'}
                </button>
              </div>

              <div className="pt-3 border-t border-[#F0F2F0] space-y-1.5 text-xs text-[#607067]">
                <p>
                  <span className="font-semibold text-[#14221C]">SKU:</span>{' '}
                  <span className="font-mono">{spotlightProduct.sku}</span>
                  <span className="mx-2">·</span>
                  <span className="font-semibold text-[#14221C]">Category:</span>{' '}
                  <Link
                    href={`/categories/${spotlightProduct.categorySlug}`}
                    className="text-[#114B3C] underline"
                  >
                    {spotlightProduct.categoryName}
                  </Link>
                </p>
                <p className="text-sm text-[#4A5A52] leading-relaxed">
                  {spotlightProduct.description}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. 4 PROMO DISCOUNT CARDS */}
      <section aria-label="Featured promotions">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PROMO_CARDS.map((card) => (
            <Link
              key={`${card.headline}-${card.bigValue}`}
              href={card.href}
              className="group rounded-3xl overflow-hidden border border-[#EAECE9] bg-white flex flex-col justify-between hover:-translate-y-1 transition-transform shadow-xs"
            >
              <div className={`${card.bgTop} p-6 pb-4`}>
                <p className="text-lg font-bold text-[#14221C]">{card.headline}</p>
                <p className={`text-4xl font-extrabold mt-0.5 ${card.textColor}`}>
                  {card.bigValue}
                </p>
                <p className="mt-2 text-xs text-[#4A5A52] leading-relaxed">
                  {card.desc}
                </p>
              </div>
              <div className={`${card.bgBottom} px-6 pt-5 pb-6 flex justify-center relative`}>
                <div className="w-36 h-36 rounded-2xl bg-white p-2 relative overflow-hidden shadow-md group-hover:scale-105 transition-transform">
                  <Image
                    src={card.image}
                    alt={`${card.headline} ${card.bigValue}`}
                    fill
                    sizes="144px"
                    referrerPolicy="no-referrer"
                    className="object-contain p-2"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 7. WEEKLY BEST SELLING ITEMS WITH CATEGORY TABS */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <h2 className="text-2xl sm:text-[26px] font-bold text-[#14221C] tracking-tight">
            Weekly best selling items
          </h2>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#D96B27] hover:text-[#B85417] whitespace-nowrap"
          >
            See more <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-5">
          <button
            type="button"
            onClick={() => setWeeklyTab('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
              weeklyTab === 'all'
                ? 'bg-[#114B3C] text-white'
                : 'bg-[#F2F4F2] text-[#4A5A52] hover:bg-[#E4EAE6]'
            }`}
          >
            All Favorites
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setWeeklyTab(cat.slug)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
                weeklyTab === cat.slug
                  ? 'bg-[#114B3C] text-white'
                  : 'bg-[#F2F4F2] text-[#4A5A52] hover:bg-[#E4EAE6]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {weeklyBestSelling.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 8. PLUM DELIVERY COURIER BANNER */}
      <section className="rounded-[28px] sm:rounded-[34px] bg-[#5E1338] text-white overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-6 px-6 sm:px-10 lg:px-14 py-9 sm:py-10">
          <div className="lg:col-span-7">
            <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight text-balance">
              Stay Home and Get All Your Essentials From Our Market!
            </h2>
            <p className="mt-3 text-sm sm:text-base text-white/80 max-w-lg">
              Order fresh local produce, cold-chain dairy, and daily staples from any device — delivered straight to your doorstep in 15 minutes.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/shop"
                className="px-6 py-3 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-900 transition-colors inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#B2F565]" />
                Order Online Now
              </Link>
              <Link
                href="/account"
                className="px-6 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors"
              >
                Manage Account &amp; Addresses
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[400px] aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/images/promo-delivery-courier.jpg"
                alt="Gromuse grocery delivery courier holding a fresh crate of vegetables"
                fill
                sizes="400px"
                referrerPolicy="no-referrer"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 9. DUAL OFFER BANNERS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-3xl bg-[#14487C] text-white p-7 sm:p-8 flex items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B2F565]">
              <Truck className="w-4 h-4" /> Free delivery
            </span>
            <h3 className="mt-2 text-xl sm:text-2xl font-extrabold leading-snug max-w-xs">
              Get up to 50% off Delivery by 12:15pm · Fast and free
            </h3>
            <Link
              href="/shop"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#B2F565] hover:underline"
            >
              Free on orders $50+ <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <Truck className="w-10 h-10 text-[#B2F565]" />
          </div>
        </div>

        <div className="rounded-3xl bg-[#B45320] text-white p-7 sm:p-8 flex items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FDE68A]">
              <Sparkles className="w-4 h-4" /> Membership Card
            </span>
            <h3 className="mt-2 text-xl sm:text-2xl font-extrabold leading-snug max-w-xs">
              You can enjoy a 5% discount using our Health card
            </h3>
            <button
              type="button"
              onClick={() => void handleHealthCardClaim()}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#B45320] text-xs font-bold hover:bg-[#FEF3C7] transition-colors"
            >
              Apply HEALTH5 Coupon
            </button>
            {couponBannerMsg && (
              <p className="mt-2 text-xs text-[#FDE68A] font-medium">
                {couponBannerMsg}
              </p>
            )}
          </div>
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <Clock className="w-10 h-10 text-[#FDE68A]" />
          </div>
        </div>
      </section>

      {/* 10. JUST FOR YOU */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-[26px] font-bold text-[#14221C] tracking-tight">
            Just for you
          </h2>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#D96B27] hover:text-[#B85417]"
          >
            See more <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {justForYou.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 11. TRENDING PRODUCTS */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-[26px] font-bold text-[#14221C] tracking-tight">
            Trending Products
          </h2>
          <Link
            href="/shop?sort=discount"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#D96B27] hover:text-[#B85417]"
          >
            See more <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {trendingProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 12. RECOMMENDED PRODUCTS */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-[26px] font-bold text-[#14221C] tracking-tight">
            Recommended Products
          </h2>
          <Link
            href="/shop?sort=rating"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#D96B27] hover:text-[#B85417]"
          >
            See more <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {recommendedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
