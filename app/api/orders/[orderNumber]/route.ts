import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/src/db/index';
import { orderItems, orders } from '@/src/db/schema';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await context.params;
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        couponCode: order.couponCode,
        subtotalCents: order.subtotalCents,
        discountCents: order.discountCents,
        deliveryFeeCents: order.deliveryFeeCents,
        totalCents: order.totalCents,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items,
      },
    });
  } catch (error) {
    console.error('GET /api/orders/[orderNumber] error:', error);
    return NextResponse.json({ error: 'Unable to load order.' }, { status: 500 });
  }
}
