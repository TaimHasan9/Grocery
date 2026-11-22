'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Heart } from 'lucide-react';
import { useStore } from '@/src/context/StoreContext';
import { ProductCard } from '@/src/components/products/ProductCard';

export default function WishlistPage() {
  const { wishlistProducts } = useStore();

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-[#14221C] tracking-tight">
          Your Saved Wishlist
        </h1>
        <p className="text-sm text-[#607067] mt-1">
          {wishlistProducts.length}{' '}
          {wishlistProducts.length === 1 ? 'grocery item' : 'grocery items'} saved for later
        </p>
      </div>

      {wishlistProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EAECE9] p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF0F0] text-[#D9383A] flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#14221C]">No saved items yet</h2>
          <p className="text-sm text-[#607067] mt-1 max-w-md mx-auto">
            Tap the heart icon on any product card to save organic favorites to your wishlist.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#114B3C] text-white text-sm font-bold hover:bg-[#0D3C30]"
          >
            Explore Groceries <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {wishlistProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
