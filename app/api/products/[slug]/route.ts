import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, getProductBySlug } from '@/src/db/queries';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const product = await getProductBySlug(slug);
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }
    const allInCategory = await getAllProducts({ categorySlug: product.categorySlug });
    const related = allInCategory.filter((p) => p.id !== product.id).slice(0, 5);
    return NextResponse.json({ product, related });
  } catch (error) {
    console.error('GET /api/products/[slug] error:', error);
    return NextResponse.json(
      { error: 'Unable to load product details.' },
      { status: 500 }
    );
  }
}
