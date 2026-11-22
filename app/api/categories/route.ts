import { NextResponse } from 'next/server';
import { getAllCategories } from '@/src/db/queries';

export async function GET() {
  try {
    const categories = await getAllCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('GET /api/categories error:', error);
    return NextResponse.json(
      { error: 'Unable to load categories.' },
      { status: 500 }
    );
  }
}
