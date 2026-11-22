import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/src/db/index';
import { cartItems, users, wishlists } from '@/src/db/schema';
import { getAuthenticatedUser } from '@/src/lib/auth-server';

export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({ user: auth.dbUser });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = req.headers.get('x-gromuse-session')?.trim();
    if (sessionId && sessionId.length >= 8) {
      const guestCart = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.sessionId, sessionId));

      for (const item of guestCart) {
        await db
          .update(cartItems)
          .set({ userId: auth.dbUser.id, sessionId: null })
          .where(eq(cartItems.id, item.id));
      }

      const guestWish = await db
        .select()
        .from(wishlists)
        .where(eq(wishlists.sessionId, sessionId));

      for (const w of guestWish) {
        await db
          .update(wishlists)
          .set({ userId: auth.dbUser.id, sessionId: null })
          .where(eq(wishlists.id, w.id));
      }
    }

    return NextResponse.json({ user: auth.dbUser });
  } catch (error) {
    console.error('POST /api/auth/session error:', error);
    return NextResponse.json({ error: 'Unable to sync session.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : undefined;
    const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 24) : undefined;

    const [updated] = await db
      .update(users)
      .set({
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
      })
      .where(eq(users.id, auth.dbUser.id))
      .returning();

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('PATCH /api/auth/session error:', error);
    return NextResponse.json({ error: 'Unable to update profile.' }, { status: 500 });
  }
}
