import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/src/db/index';
import { categories, products, wishlists } from '@/src/db/schema';
import { ensureDatabaseSeeded } from '@/src/db/seed';
import { getAuthenticatedUser } from '@/src/lib/auth-server';

const wishlistToggleSchema = z.object({
  productId: z.coerce.number().int().positive(),
});

function getSessionId(req: NextRequest): string | null {
  const sid = req.headers.get('x-gromuse-session')?.trim();
  if (!sid || sid.length < 8 || sid.length > 128) return null;
  return sid;
}

async function fetchWishlist(userId: number | null, sessionId: string | null) {
  if (!userId && !sessionId) return [];
  const condition = userId
    ? eq(wishlists.userId, userId)
    : eq(wishlists.sessionId, sessionId!);

  return await db
    .select({
      id: wishlists.id,
      productId: products.id,
      sku: products.sku,
      name: products.name,
      slug: products.slug,
      storeName: products.storeName,
      categoryName: categories.name,
      categorySlug: categories.slug,
      unitWeight: products.unitWeight,
      priceCents: products.priceCents,
      originalPriceCents: products.originalPriceCents,
      discountPercent: products.discountPercent,
      stockQuantity: products.stockQuantity,
      ratingX10: products.ratingX10,
      reviewCount: products.reviewCount,
      imageUrl: products.imageUrl,
    })
    .from(wishlists)
    .innerJoin(products, eq(wishlists.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(condition);
}

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const auth = await getAuthenticatedUser(req);
    const sessionId = getSessionId(req);
    const items = await fetchWishlist(auth?.dbUser.id ?? null, sessionId);
    return NextResponse.json({ items });
  } catch (error) {
    console.error('GET /api/wishlist error:', error);
    return NextResponse.json({ error: 'Unable to load wishlist.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const auth = await getAuthenticatedUser(req);
    const sessionId = getSessionId(req);
    if (!auth && !sessionId) {
      return NextResponse.json({ error: 'Missing session identifier.' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = wishlistToggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid product ID.' }, { status: 400 });
    }

    const { productId } = parsed.data;
    const ownerFilter = auth
      ? and(eq(wishlists.userId, auth.dbUser.id), eq(wishlists.productId, productId))
      : and(eq(wishlists.sessionId, sessionId!), eq(wishlists.productId, productId));

    const existing = await db.select().from(wishlists).where(ownerFilter).limit(1);
    let saved = false;
    if (existing.length > 0) {
      await db.delete(wishlists).where(eq(wishlists.id, existing[0].id));
      saved = false;
    } else {
      await db.insert(wishlists).values({
        userId: auth?.dbUser.id ?? null,
        sessionId: auth ? null : sessionId,
        productId,
      });
      saved = true;
    }

    const items = await fetchWishlist(auth?.dbUser.id ?? null, sessionId);
    return NextResponse.json({ saved, items });
  } catch (error) {
    console.error('POST /api/wishlist error:', error);
    return NextResponse.json({ error: 'Unable to update wishlist.' }, { status: 500 });
  }
}
