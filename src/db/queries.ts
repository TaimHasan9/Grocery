import { asc, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { categories, coupons, products } from './schema.ts';
import { ensureDatabaseSeeded } from './seed.ts';

export interface ProductWithCategory {
  id: number;
  sku: string;
  name: string;
  slug: string;
  storeName: string;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  description: string;
  unitWeight: string;
  priceCents: number;
  originalPriceCents: number | null;
  discountPercent: number;
  stockQuantity: number;
  ratingX10: number;
  reviewCount: number;
  imageUrl: string;
  galleryUrls: string[];
  sectionTags: string[];
  isFeatured: boolean;
  isActive: boolean;
}

export async function getAllCategories() {
  try {
    await ensureDatabaseSeeded();
    return await db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.id));
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    throw new Error('Could not load categories. Please try again.', { cause: error });
  }
}

export async function getAllProducts(options?: {
  categorySlug?: string;
  search?: string;
  sort?: string;
  includeInactive?: boolean;
}): Promise<ProductWithCategory[]> {
  try {
    await ensureDatabaseSeeded();
    const rows = await db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        slug: products.slug,
        storeName: products.storeName,
        categoryId: products.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
        description: products.description,
        unitWeight: products.unitWeight,
        priceCents: products.priceCents,
        originalPriceCents: products.originalPriceCents,
        discountPercent: products.discountPercent,
        stockQuantity: products.stockQuantity,
        ratingX10: products.ratingX10,
        reviewCount: products.reviewCount,
        imageUrl: products.imageUrl,
        galleryUrls: products.galleryUrls,
        sectionTags: products.sectionTags,
        isFeatured: products.isFeatured,
        isActive: products.isActive,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(asc(products.id));

    let filtered = options?.includeInactive ? rows : rows.filter((r) => r.isActive);

    if (options?.categorySlug && options.categorySlug !== 'all') {
      filtered = filtered.filter((r) => r.categorySlug === options.categorySlug);
    }

    if (options?.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.storeName.toLowerCase().includes(q) ||
          r.categoryName.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
    }

    if (options?.sort === 'price-asc') {
      filtered.sort((a, b) => a.priceCents - b.priceCents);
    } else if (options?.sort === 'price-desc') {
      filtered.sort((a, b) => b.priceCents - a.priceCents);
    } else if (options?.sort === 'discount') {
      filtered.sort((a, b) => b.discountPercent - a.discountPercent);
    } else if (options?.sort === 'rating') {
      filtered.sort((a, b) => b.ratingX10 - a.ratingX10);
    }

    return filtered;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw new Error('Could not load products. Please try again.', { cause: error });
  }
}

export async function getProductBySlug(slug: string): Promise<ProductWithCategory | null> {
  try {
    await ensureDatabaseSeeded();
    const rows = await db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        slug: products.slug,
        storeName: products.storeName,
        categoryId: products.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
        description: products.description,
        unitWeight: products.unitWeight,
        priceCents: products.priceCents,
        originalPriceCents: products.originalPriceCents,
        discountPercent: products.discountPercent,
        stockQuantity: products.stockQuantity,
        ratingX10: products.ratingX10,
        reviewCount: products.reviewCount,
        imageUrl: products.imageUrl,
        galleryUrls: products.galleryUrls,
        sectionTags: products.sectionTags,
        isFeatured: products.isFeatured,
        isActive: products.isActive,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.slug, slug))
      .limit(1);

    return rows[0] ?? null;
  } catch (error) {
    console.error('Failed to fetch product by slug:', error);
    throw new Error('Could not load product details.', { cause: error });
  }
}

export async function getActiveCoupons() {
  try {
    await ensureDatabaseSeeded();
    return await db
      .select()
      .from(coupons)
      .where(eq(coupons.isActive, true))
      .orderBy(desc(coupons.discountValue));
  } catch (error) {
    console.error('Failed to fetch coupons:', error);
    throw new Error('Could not load available coupons.', { cause: error });
  }
}
