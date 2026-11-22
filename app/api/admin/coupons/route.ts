import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/src/db/index';
import { coupons } from '@/src/db/schema';
import { requireAdminUser } from '@/src/lib/auth-server';
import { couponInputSchema } from '@/src/lib/validations';

export async function POST(req: NextRequest) {
  const gate = await requireAdminUser(req);
  if ('error' in gate) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const body = await req.json();
    const parsed = couponInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid coupon payload.' },
        { status: 400 }
      );
    }

    const [created] = await db.insert(coupons).values(parsed.data).returning();
    return NextResponse.json({ coupon: created }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/coupons error:', error);
    return NextResponse.json({ error: 'Unable to create coupon.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const gate = await requireAdminUser(req);
  if ('error' in gate) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'Coupon ID is required.' }, { status: 400 });
    }
    const [updated] = await db
      .update(coupons)
      .set({ isActive: Boolean(body.isActive) })
      .where(eq(coupons.id, id))
      .returning();

    return NextResponse.json({ coupon: updated });
  } catch (error) {
    console.error('PATCH /api/admin/coupons error:', error);
    return NextResponse.json({ error: 'Unable to update coupon.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const gate = await requireAdminUser(req);
  if ('error' in gate) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid coupon ID.' }, { status: 400 });
    }
    await db.delete(coupons).where(eq(coupons.id, id));
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('DELETE /api/admin/coupons error:', error);
    return NextResponse.json({ error: 'Unable to delete coupon.' }, { status: 500 });
  }
}
