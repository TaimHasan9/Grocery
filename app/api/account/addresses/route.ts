import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/src/db/index';
import { addresses } from '@/src/db/schema';
import { getAuthenticatedUser } from '@/src/lib/auth-server';
import { addressSchema } from '@/src/lib/validations';

export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const list = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, auth.dbUser.id))
    .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));

  return NextResponse.json({ addresses: list });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid address data.' },
        { status: 400 }
      );
    }

    if (parsed.data.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, auth.dbUser.id));
    }

    const [created] = await db
      .insert(addresses)
      .values({
        userId: auth.dbUser.id,
        ...parsed.data,
      })
      .returning();

    return NextResponse.json({ address: created }, { status: 201 });
  } catch (error) {
    console.error('POST /api/account/addresses error:', error);
    return NextResponse.json({ error: 'Unable to save address.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid address ID.' }, { status: 400 });
    }

    await db
      .delete(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, auth.dbUser.id)));

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('DELETE /api/account/addresses error:', error);
    return NextResponse.json({ error: 'Unable to delete address.' }, { status: 500 });
  }
}
