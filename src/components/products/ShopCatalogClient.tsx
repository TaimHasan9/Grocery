'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from './ProductCard';
import type { ProductWithCategory } from '@/src/db/queries';
import type { CategoryRecord } from '@/src/components/home/HomeStorefront';

interface ShopCatalogClientProps {
  categories: CategoryRecord[];
  initialProducts: ProductWithCategory[];
  initialCategory?: string;
  initialSearch?: string;
  initialSort?: string;
  pageTitle?: string;
}

const PROMO_STRIP = [
  {
    headline: 'Save',
    bigValue: '$29',
    desc: 'Enjoy Discount all types of Grocery & Frozen item',
    image: '/images/prod-whole-wheat-flour.jpg',
    bgBottom: 'bg-[#5A1335]',
    bgTop: 'bg-[#FDF4F7]',
    textColor: 'text-[#5A1335]',
  },
  {
    headline: 'Discount',
    bigValue: '30%',
    desc: 'Enjoy Discount all types of Grocery & Honey item',
    image: '/images/prod-honey-jar.jpg',
    bgBottom: 'bg-[#A64B2A]',
    bgTop: 'bg-[#FDF6F2]',
    textColor: 'text-[#A64B2A]',
  },
  {
    headline: 'Up to',
    bigValue: '50%',
    desc: 'Enjoy Discount all types of Pantry & Spreads item',
    image: '/images/prod-peanut-butter.jpg',
    bgBottom: 'bg-[#15457A]',
    bgTop: 'bg-[#F2F7FC]',
    textColor: 'text-[#15457A]',
  },
  {
    headline: 'Free',
    bigValue: 'SHIP',
    desc: 'Enjoy Free Express Delivery on baskets $50+',
    image: '/images/prod-sweet-corn-can.jpg',
    bgBottom: 'bg-[#531F6F]',
    bgTop: 'bg-[#F7F2FC]',
    textColor: 'text-[#531F6F]',
  },
];

export function ShopCatalogClient({
  categories,
  initialProducts,
  initialCategory = 'all',
  initialSearch = '',
  initialSort = 'featured',
  pageTitle = 'All category',
}: ShopCatalogClientProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [priceRange, setPriceRange] = useState<'all' | 'under10' | '10to20' | 'over20'>('all');
  const [onlyDiscounted, setOnlyDiscounted] = useState(initialSort === 'discount');
  const [minRating, setMinRating] = useState<'all' | '4.8'>('all');
  const [sortBy, setSortBy] = useState(initialSort);

  const filteredProducts = useMemo(() => {
    let list = [...initialProducts];

    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.categorySlug === selectedCategory);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.storeName.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (priceRange === 'under10') {
      list = list.filter((p) => p.priceCents < 1000);
    } else if (priceRange === '10to20') {
      list = list.filter((p) => p.priceCents >= 1000 && p.priceCents <= 2000);
    } else if (priceRange === 'over20') {
      list = list.filter((p) => p.priceCents > 2000);
    }

    if (onlyDiscounted) {
      list = list.filter((p) => p.discountPercent > 0);
    }

    if (minRating === '4.8') {
      list = list.filter((p) => p.ratingX10 >= 48);
    }

    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.priceCents - b.priceCents);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.priceCents - a.priceCents);
    } else if (sortBy === 'discount') {
      list.sort((a, b) => b.discountPercent - a.discountPercent);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.ratingX10 - a.ratingX10);
    }

    return list;
  }, [initialProducts, selectedCategory, searchTerm, priceRange, onlyDiscounted, minRating, sortBy]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchTerm('');
    setPriceRange('all');
    setOnlyDiscounted(false);
    setMinRating('all');
    setSortBy('featured');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 space-y-10">
      {/* Top Promo Banner Cards matching video 00:30 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {PROMO_STRIP.map((card) => (
          <button
            key={`${card.headline}-${card.bigValue}`}
            type="button"
            onClick={() => setOnlyDiscounted(true)}
            className="text-left group rounded-3xl overflow-hidden border border-[#EAECE9] bg-white flex flex-col justify-between hover:-translate-y-0.5 transition-transform shadow-xs"
          >
            <div className={`${card.bgTop} p-5 pb-3`}>
              <p className="text-base font-bold text-[#14221C]">{card.headline}</p>
              <p className={`text-3xl font-extrabold mt-0.5 ${card.textColor}`}>
                {card.bigValue}
              </p>
              <p className="mt-1.5 text-xs text-[#4A5A52] leading-relaxed">
                {card.desc}
              </p>
            </div>
            <div className={`${card.bgBottom} px-5 pt-4 pb-5 flex justify-center`}>
              <div className="w-28 h-28 rounded-2xl bg-white relative overflow-hidden shadow-md">
                <Image
                  src={card.image}
                  alt={card.headline}
                  fill
                  sizes="112px"
                  referrerPolicy="no-referrer"
                  className="object-contain p-2"
                />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Heading & Filter Bar matching "Gromuse / All category" */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <nav aria-label="Breadcrumb" className="text-sm text-[#607067] mb-1">
              <Link href="/" className="hover:text-[#114B3C] font-medium">
                Gromuse
              </Link>
              <span className="mx-2">/</span>
              <span className="text-[#14221C] font-semibold">{pageTitle}</span>
            </nav>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14221C] tracking-tight">
              Gromuse / {pageTitle}{' '}
              <span className="text-base font-medium text-[#607067] tabular-nums">
                ({filteredProducts.length} items)
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="shop-sort-select" className="text-xs font-semibold text-[#607067]">
              Sort by
            </label>
            <select
              id="shop-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 px-4 rounded-full bg-white border border-[#DCE3DE] text-sm font-medium text-[#14221C] focus:outline-none focus:border-[#114B3C]"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="discount">Biggest Discount</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 pb-6 border-b border-[#EAECE9]">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
              selectedCategory === 'all'
                ? 'bg-[#114B3C] text-white'
                : 'bg-[#F2F4F2] text-[#14221C] hover:bg-[#E4EAE6]'
            }`}
          >
            All Categories
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
                selectedCategory === cat.slug
                  ? 'bg-[#114B3C] text-white'
                  : 'bg-[#F2F4F2] text-[#14221C] hover:bg-[#E4EAE6]'
              }`}
            >
              {cat.name}
            </button>
          ))}

          <select
            aria-label="Filter by price range"
            value={priceRange}
            onChange={(e) =>
              setPriceRange(e.target.value as 'all' | 'under10' | '10to20' | 'over20')
            }
            className="h-9 px-3.5 rounded-full bg-[#F2F4F2] text-xs font-bold text-[#14221C] border border-transparent focus:border-[#114B3C] focus:outline-none"
          >
            <option value="all">Price: Any</option>
            <option value="under10">Under $10</option>
            <option value="10to20">$10 – $20</option>
            <option value="over20">Over $20</option>
          </select>

          <button
            type="button"
            onClick={() => setOnlyDiscounted((v) => !v)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
              onlyDiscounted
                ? 'bg-[#B2F565] text-[#114B3C]'
                : 'bg-[#F2F4F2] text-[#14221C] hover:bg-[#E4EAE6]'
            }`}
          >
            Offer &amp; Discount
          </button>

          <button
            type="button"
            onClick={() => setMinRating((r) => (r === '4.8' ? 'all' : '4.8'))}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
              minRating === '4.8'
                ? 'bg-[#B2F565] text-[#114B3C]'
                : 'bg-[#F2F4F2] text-[#14221C] hover:bg-[#E4EAE6]'
            }`}
          >
            4.8+ Rating
          </button>

          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#E8F2EC] text-[#114B3C] text-xs font-bold"
            >
              Search: &ldquo;{searchTerm}&rdquo;
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EAECE9] p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#F2F6F3] text-[#114B3C] flex items-center justify-center mx-auto mb-3">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#14221C]">
            No groceries match your filters
          </h2>
          <p className="text-sm text-[#607067] mt-1">
            Try clearing one or more filters to browse all 32 fresh items.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 px-6 py-2.5 rounded-full bg-[#114B3C] text-white text-sm font-semibold hover:bg-[#0D3C30]"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
