import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/src/db/index';
import { orders } from '@/src/db/schema';
import { requireAdminUser } from '@/src/lib/auth-server';
import { orderStatusUpdateSchema } from '@/src/lib/validations';

export async function PATCH(req: NextRequest) {
  const gate = await requireAdminUser(req);
  if ('error' in gate) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    const parsed = orderStatusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid status value.' }, { status: 400 });
    }

    const [updated] = await db
      .update(orders)
      .set({
        orderStatus: parsed.data.orderStatus,
        ...(parsed.data.paymentStatus ? { paymentStatus: parsed.data.paymentStatus } : {}),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error('PATCH /api/admin/orders error:', error);
    return NextResponse.json({ error: 'Unable to update order status.' }, { status: 500 });
  }
}
