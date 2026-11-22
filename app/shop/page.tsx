import React from 'react';
import { getAllCategories, getAllProducts } from '@/src/db/queries';
import { ShopCatalogClient } from '@/src/components/products/ShopCatalogClient';

export const dynamic = 'force-dynamic';

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const [categories, products] = await Promise.all([
    getAllCategories(),
    getAllProducts(),
  ]);

  const activeCategoryObj = categories.find((c) => c.slug === params.category);

  return (
    <ShopCatalogClient
      categories={categories}
      initialProducts={products}
      initialCategory={params.category || 'all'}
      initialSearch={params.search || ''}
      initialSort={params.sort || 'featured'}
      pageTitle={activeCategoryObj ? activeCategoryObj.name : 'All category'}
    />
  );
}
