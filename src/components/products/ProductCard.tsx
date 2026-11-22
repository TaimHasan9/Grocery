'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Heart, Minus, Plus, ShoppingBasket } from 'lucide-react';
import { useStore } from '@/src/context/StoreContext';
import { formatCurrency, formatPriceParts } from '@/src/lib/pricing';
import type { ProductWithCategory } from '@/src/db/queries';

interface ProductCardProps {
  product: ProductWithCategory;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, updateQuantity, getItemQuantity, toggleWishlist, isInWishlist } =
    useStore();
  const [imgError, setImgError] = useState(false);

  const qty = getItemQuantity(product.id);
  const wished = isInWishlist(product.id);
  const priceParts = formatPriceParts(product.priceCents);
  const outOfStock = product.stockQuantity <= 0;

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      className="group bg-white rounded-2xl border border-[#EAECE9] p-3.5 sm:p-4 flex flex-col justify-between hover:shadow-[0_10px_28px_-12px_rgba(17,75,60,0.16)] transition-shadow"
    >
      <div>
        {/* Top Image Box */}
        <div className="relative aspect-square rounded-xl bg-[#FAFBF9] overflow-hidden mb-3">
          {product.discountPercent > 0 && (
            <span className="absolute top-1.5 left-1.5 z-10 px-2 py-0.5 rounded-md bg-[#114B3C] text-[#B2F565] text-[11px] font-bold tabular-nums">
              -{product.discountPercent}%
            </span>
          )}

          <button
            type="button"
            onClick={() => void toggleWishlist(product)}
            aria-label={
              wished
                ? `Remove ${product.name} from wishlist`
                : `Add ${product.name} to wishlist`
            }
            className={`absolute top-1.5 right-1.5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              wished
                ? 'bg-[#FFEAEA] text-[#D9383A]'
                : 'bg-[#F5F7F5]/90 text-[#607067] hover:text-[#114B3C] hover:bg-[#EAF1EC]'
            }`}
          >
            <Heart className={`w-4 h-4 ${wished ? 'fill-current' : ''}`} />
          </button>

          <Link
            href={`/products/${product.slug}`}
            className="block w-full h-full relative"
          >
            {!imgError ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 240px"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="object-contain p-3 mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#F4F7F5] text-[#114B3C] p-3 text-center">
                <ShoppingBasket className="w-8 h-8 mb-1 opacity-60" />
                <span className="text-xs font-medium">{product.name}</span>
              </div>
            )}
          </Link>
        </div>

        {/* Centered Typography Matching Reference Video */}
        <div className="text-center px-1">
          <Link
            href={`/products/${product.slug}`}
            className="block text-[15px] font-bold text-[#14221C] hover:text-[#114B3C] leading-snug line-clamp-1"
          >
            {product.name}
          </Link>
          <p className="text-xs font-medium text-[#4A5A52] mt-0.5 line-clamp-1">
            ({product.storeName})
          </p>
          <p className="text-[11px] text-[#78877F] mt-1">{product.unitWeight}</p>

          <div className="mt-2 flex items-baseline justify-center gap-1.5">
            <span className="text-xl font-extrabold text-[#14221C] tabular-nums tracking-tight">
              {priceParts.whole}
              <span className="text-xs font-bold align-top ml-0.5">
                .{priceParts.decimals}$
              </span>
            </span>
            {product.originalPriceCents &&
              product.originalPriceCents > product.priceCents && (
                <span className="text-xs text-[#8C9991] line-through tabular-nums">
                  {formatCurrency(product.originalPriceCents)}
                </span>
              )}
          </div>
        </div>
      </div>

      {/* Bottom Interactive + / Lime Stepper */}
      <div className="mt-3.5">
        {outOfStock ? (
          <div className="w-full h-10 rounded-full bg-[#F4F5F4] text-[#85948C] text-xs font-semibold flex items-center justify-center">
            Out of Stock
          </div>
        ) : qty === 0 ? (
          <button
            type="button"
            onClick={() => void addToCart(product, 1)}
            aria-label={`Add ${product.name} to cart`}
            className="w-full h-10 rounded-full bg-[#F2F4F2] hover:bg-[#B2F565] text-[#14221C] hover:text-[#114B3C] flex items-center justify-center transition-colors font-semibold"
          >
            <Plus className="w-5 h-5 stroke-[2.2]" />
          </button>
        ) : (
          <div className="w-full h-10 rounded-full bg-[#B2F565] text-[#114B3C] px-2 flex items-center justify-between shadow-xs">
            <button
              type="button"
              onClick={() => void updateQuantity(product.id, qty - 1)}
              aria-label={`Decrease ${product.name} quantity`}
              className="w-7 h-7 rounded-full bg-white/80 hover:bg-white text-[#114B3C] flex items-center justify-center transition-colors"
            >
              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <span
              data-testid={`product-qty-${product.id}`}
              className="text-sm font-bold tabular-nums"
            >
              {qty}
            </span>
            <button
              type="button"
              onClick={() => void updateQuantity(product.id, qty + 1)}
              aria-label={`Increase ${product.name} quantity`}
              className="w-7 h-7 rounded-full bg-[#114B3C] hover:bg-[#0D3C30] text-white flex items-center justify-center transition-colors"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    </motion.article>
  );
}
