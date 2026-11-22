import React from 'react';
import { notFound } from 'next/navigation';
import { getAllCategories, getAllProducts } from '@/src/db/queries';
import { ShopCatalogClient } from '@/src/components/products/ShopCatalogClient';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [categories, products] = await Promise.all([
    getAllCategories(),
    getAllProducts(),
  ]);

  const category = categories.find((c) => c.slug === slug);
  if (!category) {
    notFound();
  }

  return (
    <ShopCatalogClient
      categories={categories}
      initialProducts={products}
      initialCategory={category.slug}
      pageTitle={category.name}
    />
  );
}
