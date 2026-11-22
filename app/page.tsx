import React from 'react';
import { getAllCategories, getAllProducts } from '@/src/db/queries';
import { HomeStorefront } from '@/src/components/home/HomeStorefront';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    getAllCategories(),
    getAllProducts(),
  ]);

  return <HomeStorefront categories={categories} products={products} />;
}
