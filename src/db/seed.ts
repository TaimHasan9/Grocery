import { count } from 'drizzle-orm';
import { db } from './index.ts';
import { categories, coupons, products } from './schema.ts';
import { SEED_CATEGORIES, SEED_COUPONS, SEED_PRODUCTS } from '../data/seed.ts';

let seedPromise: Promise<void> | null = null;

export async function ensureDatabaseSeeded(): Promise<void> {
  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = (async () => {
    try {
      const [{ value: categoryCount }] = await db
        .select({ value: count() })
        .from(categories);

      if (Number(categoryCount) === 0) {
        await db
          .insert(categories)
          .values(SEED_CATEGORIES)
          .onConflictDoNothing({ target: categories.slug });
      }

      const allCats = await db.select().from(categories);
      const catIdBySlug = new Map(allCats.map((c) => [c.slug, c.id]));

      const [{ value: productCount }] = await db
        .select({ value: count() })
        .from(products);

      if (Number(productCount) === 0) {
        const productRows = SEED_PRODUCTS.map((p) => {
          const categoryId = catIdBySlug.get(p.categorySlug) ?? allCats[0]?.id;
          if (!categoryId) return null;
          return {
            sku: p.sku,
            name: p.name,
            slug: p.slug,
            storeName: p.storeName,
            categoryId,
            description: p.description,
            unitWeight: p.unitWeight,
            priceCents: p.priceCents,
            originalPriceCents: p.originalPriceCents,
            discountPercent: p.discountPercent,
            stockQuantity: p.stockQuantity,
            ratingX10: p.ratingX10,
            reviewCount: p.reviewCount,
            imageUrl: p.imageUrl,
            galleryUrls: p.galleryUrls,
            sectionTags: p.sectionTags,
            isFeatured: p.isFeatured,
            isActive: true,
          };
        }).filter((row): row is NonNullable<typeof row> => row !== null);

        if (productRows.length > 0) {
          await db
            .insert(products)
            .values(productRows)
            .onConflictDoNothing({ target: products.slug });
        }
      }

      const [{ value: couponCount }] = await db
        .select({ value: count() })
        .from(coupons);

      if (Number(couponCount) === 0) {
        await db
          .insert(coupons)
          .values(SEED_COUPONS)
          .onConflictDoNothing({ target: coupons.code });
      }
    } catch (error) {
      seedPromise = null;
      console.error('Database seeding failed:', error);
      throw new Error('Failed to initialize grocery catalog.', { cause: error });
    }
  })();

  return seedPromise;
}
