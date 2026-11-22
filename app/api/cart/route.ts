import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/src/db/index';
import { cartItems, categories, products } from '@/src/db/schema';
import { ensureDatabaseSeeded } from '@/src/db/seed';
import { getAuthenticatedUser } from '@/src/lib/auth-server';

const cartMutationSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(0).max(99),
});

function getSessionId(req: NextRequest): string | null {
  const sid = req.headers.get('x-gromuse-session')?.trim();
  if (!sid || sid.length < 8 || sid.length > 128) return null;
  return sid;
}

async function fetchHydratedCart(userId: number | null, sessionId: string | null) {
  if (!userId && !sessionId) return [];
  const condition = userId
    ? eq(cartItems.userId, userId)
    : eq(cartItems.sessionId, sessionId!);

  return await db
    .select({
      id: cartItems.id,
      productId: products.id,
      sku: products.sku,
      name: products.name,
      slug: products.slug,
      storeName: products.storeName,
      categoryName: categories.name,
      unitWeight: products.unitWeight,
      priceCents: products.priceCents,
      originalPriceCents: products.originalPriceCents,
      discountPercent: products.discountPercent,
      stockQuantity: products.stockQuantity,
      imageUrl: products.imageUrl,
      quantity: cartItems.quantity,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(condition);
}

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const auth = await getAuthenticatedUser(req);
    const sessionId = getSessionId(req);
    const items = await fetchHydratedCart(auth?.dbUser.id ?? null, sessionId);
    return NextResponse.json({ items });
  } catch (error) {
    console.error('GET /api/cart error:', error);
    return NextResponse.json({ error: 'Unable to load cart.' }, { status: 500 });
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
    const parsed = cartMutationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid cart item payload.' }, { status: 400 });
    }

    const { productId, quantity } = parsed.data;
    const ownerFilter = auth
      ? and(eq(cartItems.userId, auth.dbUser.id), eq(cartItems.productId, productId))
      : and(eq(cartItems.sessionId, sessionId!), eq(cartItems.productId, productId));

    const existing = await db.select().from(cartItems).where(ownerFilter).limit(1);

    if (quantity <= 0) {
      if (existing.length > 0) {
        await db.delete(cartItems).where(eq(cartItems.id, existing[0].id));
      }
    } else if (existing.length > 0) {
      await db
        .update(cartItems)
        .set({ quantity, updatedAt: new Date() })
        .where(eq(cartItems.id, existing[0].id));
    } else {
      await db.insert(cartItems).values({
        userId: auth?.dbUser.id ?? null,
        sessionId: auth ? null : sessionId,
        productId,
        quantity,
      });
    }

    const items = await fetchHydratedCart(auth?.dbUser.id ?? null, sessionId);
    return NextResponse.json({ items });
  } catch (error) {
    console.error('POST /api/cart error:', error);
    return NextResponse.json({ error: 'Unable to update cart.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    const sessionId = getSessionId(req);
    if (!auth && !sessionId) {
      return NextResponse.json({ items: [] });
    }
    const condition = auth
      ? eq(cartItems.userId, auth.dbUser.id)
      : eq(cartItems.sessionId, sessionId!);
    await db.delete(cartItems).where(condition);
    return NextResponse.json({ items: [] });
  } catch (error) {
    console.error('DELETE /api/cart error:', error);
    return NextResponse.json({ error: 'Unable to clear cart.' }, { status: 500 });
  }
}
