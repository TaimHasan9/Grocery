import React from 'react';
import { notFound } from 'next/navigation';
import { getAllProducts, getProductBySlug } from '@/src/db/queries';
import { ProductDetailClient } from '@/src/components/products/ProductDetailClient';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const sameCat = await getAllProducts({ categorySlug: product.categorySlug });
  const related = sameCat.filter((p) => p.id !== product.id).slice(0, 5);

  return <ProductDetailClient product={product} related={related} />;
}
