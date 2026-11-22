'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Truck,
} from 'lucide-react';
import { useStore } from '@/src/context/StoreContext';
import { formatCurrency } from '@/src/lib/pricing';
import { ProductCard } from './ProductCard';
import type { ProductWithCategory } from '@/src/db/queries';

interface ProductDetailClientProps {
  product: ProductWithCategory;
  related: ProductWithCategory[];
}

export function ProductDetailClient({ product, related }: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist } = useStore();

  const gallery =
    product.galleryUrls && product.galleryUrls.length > 0
      ? product.galleryUrls
      : [product.imageUrl];

  const [selectedImage, setSelectedImage] = useState(gallery[0] || product.imageUrl);
  const [qty, setQty] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const wished = isInWishlist(product.id);
  const outOfStock = product.stockQuantity <= 0;

  const handleAdd = async () => {
    if (outOfStock) return;
    await addToCart(product, qty);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const handleBuyNow = async () => {
    if (outOfStock) return;
    await addToCart(product, qty);
    router.push('/checkout');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 space-y-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-[#607067] flex flex-wrap items-center gap-2">
        <Link href="/" className="hover:text-[#114B3C] font-medium">
          Gromuse
        </Link>
        <span>/</span>
        <Link
          href={`/categories/${product.categorySlug}`}
          className="hover:text-[#114B3C] font-medium"
        >
          {product.categoryName}
        </Link>
        <span>/</span>
        <span className="text-[#14221C] font-semibold">{product.name}</span>
      </nav>

      {/* Main Purchase Module */}
      <section className="bg-white rounded-[28px] border border-[#EAECE9] p-6 sm:p-8 lg:p-10 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Gallery Left */}
          <div className="lg:col-span-5">
            <div className="relative aspect-square rounded-2xl bg-white border border-[#F0F2F0] overflow-hidden">
              {product.discountPercent > 0 && (
                <span className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-[#114B3C] text-[#B2F565] text-xs font-bold tabular-nums">
                  {product.discountPercent}% OFF
                </span>
              )}
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 480px"
                referrerPolicy="no-referrer"
                className="object-contain p-8"
              />
            </div>

            {gallery.length > 1 && (
              <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-1">
                {gallery.map((url, idx) => (
                  <button
                    key={`${url}-${idx}`}
                    type="button"
                    onClick={() => setSelectedImage(url)}
                    aria-label={`Select thumbnail ${idx + 1}`}
                    className={`w-20 h-20 rounded-xl border relative shrink-0 bg-white overflow-hidden transition-all ${
                      selectedImage === url
                        ? 'border-[#114B3C] ring-2 ring-[#114B3C]/20'
                        : 'border-[#EAECE9] hover:border-[#9EB2A6]'
                    }`}
                  >
                    <Image
                      src={url}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      fill
                      sizes="80px"
                      referrerPolicy="no-referrer"
                      className="object-contain p-2"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info & Purchase Right */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <p className="text-xs font-semibold text-[#607067] inline-flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[#114B3C]" />
                {product.storeName} · {product.unitWeight}
              </p>
              <h1 className="mt-1.5 text-3xl sm:text-4xl font-extrabold text-[#14221C] tracking-tight">
                {product.name}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-[#F59E0B]">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <span className="ml-1 font-bold text-[#14221C] tabular-nums">
                  {(product.ratingX10 / 10).toFixed(1)}
                </span>
                <span className="text-[#607067] tabular-nums">
                  ({product.reviewCount} reviews)
                </span>
              </div>

              <span className="text-[#DCE3DE]">|</span>

              <span
                className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                  outOfStock
                    ? 'text-red-600'
                    : product.stockQuantity <= 12
                      ? 'text-[#B45320]'
                      : 'text-[#114B3C]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {outOfStock
                  ? 'Out of stock'
                  : `In stock (${product.stockQuantity} available)`}
              </span>
            </div>

            <div className="flex items-baseline gap-3 py-2">
              <span className="text-4xl font-extrabold text-[#14221C] tabular-nums">
                {formatCurrency(product.priceCents)}
              </span>
              {product.originalPriceCents &&
                product.originalPriceCents > product.priceCents && (
                  <span className="text-lg text-[#8C9991] line-through tabular-nums">
                    {formatCurrency(product.originalPriceCents)}
                  </span>
                )}
            </div>

            <p className="text-base text-[#4A5A52] leading-relaxed max-w-2xl">
              {product.description}
            </p>

            {/* Quantity & CTA Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <div className="inline-flex items-center rounded-full border border-[#DCE3DE] bg-[#F8FAF8] h-12 px-2 gap-3">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-8 h-8 rounded-full bg-white border border-[#E2EAE4] flex items-center justify-center text-[#14221C] hover:bg-[#EDF5EF]"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-base font-bold tabular-nums min-w-[24px] text-center">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQty((q) => Math.min(Math.max(1, product.stockQuantity), q + 1))
                  }
                  aria-label="Increase quantity"
                  className="w-8 h-8 rounded-full bg-white border border-[#E2EAE4] flex items-center justify-center text-[#14221C] hover:bg-[#EDF5EF]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={outOfStock}
                onClick={() => void handleAdd()}
                className="px-7 h-12 rounded-full bg-[#114B3C] text-white text-sm font-bold hover:bg-[#0D3C30] disabled:opacity-50 transition-colors inline-flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                {addedFeedback ? 'Added to Cart!' : 'Add to Cart'}
              </button>

              <button
                type="button"
                disabled={outOfStock}
                onClick={() => void handleBuyNow()}
                className="px-7 h-12 rounded-full bg-[#B2F565] text-[#114B3C] text-sm font-bold hover:bg-[#A3EB52] disabled:opacity-50 transition-colors"
              >
                Buy Now
              </button>

              <button
                type="button"
                onClick={() => void toggleWishlist(product)}
                aria-label="Toggle wishlist"
                className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors ${
                  wished
                    ? 'border-[#F5C6C7] bg-[#FFEAEA] text-[#D9383A]'
                    : 'border-[#DCE3DE] text-[#4A5A52] hover:bg-[#F5F7F5]'
                }`}
              >
                <Heart className={`w-5 h-5 ${wished ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Metadata & Guarantees */}
            <div className="pt-5 border-t border-[#F0F2F0] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#4A5A52]">
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#F7FAF7]">
                <Truck className="w-4 h-4 text-[#114B3C] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#14221C]">15-Minute Express Delivery</p>
                  <p className="mt-0.5">Free delivery on orders above $50.00.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#F7FAF7]">
                <ShieldCheck className="w-4 h-4 text-[#114B3C] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#14221C]">Quality &amp; Freshness Guarantee</p>
                  <p className="mt-0.5">
                    SKU <span className="font-mono">{product.sku}</span> · Cold-chain verified
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#14221C]">Related products</h2>
            <Link
              href={`/categories/${product.categorySlug}`}
              className="text-sm font-semibold text-[#D96B27] hover:underline"
            >
              View all {product.categoryName} →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
