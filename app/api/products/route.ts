import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts } from '@/src/db/queries';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const sort = searchParams.get('sort') || undefined;

    const items = await getAllProducts({ categorySlug: category, search, sort });
    return NextResponse.json({ products: items });
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json(
      { error: 'Unable to load products right now.' },
      { status: 500 }
    );
  }
}
