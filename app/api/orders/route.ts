import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/src/db/index';
import {
  cartItems,
  coupons,
  orderItems,
  orders,
  payments,
  products,
} from '@/src/db/schema';
import { ensureDatabaseSeeded } from '@/src/db/seed';
import { getAuthenticatedUser } from '@/src/lib/auth-server';
import { calculateOrderTotals, isCouponValid } from '@/src/lib/pricing';
import { checkoutSchema } from '@/src/lib/validations';

const createOrderRequestSchema = checkoutSchema.extend({
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().positive().max(99),
      })
    )
    .min(1, 'Your cart is empty.'),
});

function generateOrderNumber(): string {
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `GRM-${datePart}-${random}`;
}

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const auth = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const orderNumberParam = searchParams.get('orderNumber')?.trim();
    const emailParam = searchParams.get('email')?.trim().toLowerCase();

    if (auth) {
      const userOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, auth.dbUser.id))
        .orderBy(desc(orders.createdAt));

      const orderIds = userOrders.map((o) => o.id);
      const items =
        orderIds.length > 0
          ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
          : [];

      const itemsByOrder = new Map<number, typeof items>();
      for (const it of items) {
        const list = itemsByOrder.get(it.orderId) ?? [];
        list.push(it);
        itemsByOrder.set(it.orderId, list);
      }

      return NextResponse.json({
        orders: userOrders.map((o) => ({ ...o, items: itemsByOrder.get(o.id) ?? [] })),
      });
    }

    if (orderNumberParam && emailParam) {
      const [found] = await db
        .select()
        .from(orders)
        .where(eq(orders.orderNumber, orderNumberParam))
        .limit(1);

      if (!found || found.customerEmail.toLowerCase() !== emailParam) {
        return NextResponse.json({ orders: [] });
      }
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, found.id));

      return NextResponse.json({ orders: [{ ...found, items }] });
    }

    return NextResponse.json({ orders: [] });
  } catch (error) {
    console.error('GET /api/orders error:', error);
    return NextResponse.json({ error: 'Unable to load orders.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const auth = await getAuthenticatedUser(req);
    const sessionId = req.headers.get('x-gromuse-session')?.trim();

    const body = await req.json();
    const parsed = createOrderRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Please check your checkout details.' },
        { status: 400 }
      );
    }

    const input = parsed.data;

    if (input.paymentMethod === 'stripe' && !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        {
          error:
            'Online card payments require STRIPE_SECRET_KEY on the server. Please configure Stripe keys in environment secrets or choose Cash on Delivery.',
          code: 'STRIPE_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    const productIds = input.items.map((i) => i.productId);
    const dbProducts = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    const lineItems: {
      product: typeof dbProducts[number];
      quantity: number;
      lineTotalCents: number;
    }[] = [];

    for (const reqItem of input.items) {
      const product = productMap.get(reqItem.productId);
      if (!product || !product.isActive) {
        return NextResponse.json(
          { error: 'One or more products in your cart are no longer available.' },
          { status: 400 }
        );
      }
      if (product.stockQuantity < reqItem.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name} (${product.stockQuantity} available).`,
          },
          { status: 400 }
        );
      }
      lineItems.push({
        product,
        quantity: reqItem.quantity,
        lineTotalCents: product.priceCents * reqItem.quantity,
      });
    }

    const preliminarySubtotal = lineItems.reduce((s, li) => s + li.lineTotalCents, 0);

    let appliedCoupon = null;
    if (input.couponCode) {
      const code = input.couponCode.toUpperCase();
      const [foundCoupon] = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, code))
        .limit(1);
      const couponCheck = isCouponValid(foundCoupon, preliminarySubtotal);
      if (!couponCheck.valid || !foundCoupon) {
        return NextResponse.json(
          { error: couponCheck.reason || 'Invalid coupon code.' },
          { status: 400 }
        );
      }
      appliedCoupon = foundCoupon;
    }

    const totals = calculateOrderTotals(
      lineItems.map((li) => ({
        priceCents: li.product.priceCents,
        quantity: li.quantity,
      })),
      appliedCoupon
    );

    const orderNumber = generateOrderNumber();

    const createdOrder = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber,
          userId: auth?.dbUser.id ?? null,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          shippingAddress: {
            label: 'Delivery',
            recipientName: input.customerName,
            phone: input.customerPhone,
            street: input.street,
            city: input.city,
            postalCode: input.postalCode,
          },
          paymentMethod: input.paymentMethod,
          paymentStatus: 'pending',
          orderStatus: input.paymentMethod === 'cod' ? 'confirmed' : 'pending',
          couponCode: appliedCoupon ? appliedCoupon.code : null,
          subtotalCents: totals.subtotalCents,
          discountCents: totals.discountCents,
          deliveryFeeCents: totals.deliveryFeeCents,
          totalCents: totals.totalCents,
          notes: input.notes || '',
        })
        .returning();

      await tx.insert(orderItems).values(
        lineItems.map((li) => ({
          orderId: order.id,
          productId: li.product.id,
          productName: li.product.name,
          productImage: li.product.imageUrl,
          unitWeight: li.product.unitWeight,
          unitPriceCents: li.product.priceCents,
          quantity: li.quantity,
          lineTotalCents: li.lineTotalCents,
        }))
      );

      for (const li of lineItems) {
        await tx
          .update(products)
          .set({
            stockQuantity: sql`GREATEST(0, ${products.stockQuantity} - ${li.quantity})`,
          })
          .where(eq(products.id, li.product.id));
      }

      if (appliedCoupon) {
        await tx
          .update(coupons)
          .set({ usedCount: sql`${coupons.usedCount} + 1` })
          .where(eq(coupons.id, appliedCoupon.id));
      }

      await tx.insert(payments).values({
        orderId: order.id,
        provider: input.paymentMethod,
        amountCents: totals.totalCents,
        currency: 'usd',
        status: 'pending',
        rawPayload: {
          mode: input.paymentMethod === 'cod' ? 'cash_on_delivery' : 'stripe_checkout',
        },
      });

      if (auth) {
        await tx.delete(cartItems).where(eq(cartItems.userId, auth.dbUser.id));
      } else if (sessionId) {
        await tx.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
      }

      return order;
    });

    // If Stripe is configured and requested, create a Stripe Checkout Session via Stripe REST API
    if (input.paymentMethod === 'stripe' && process.env.STRIPE_SECRET_KEY) {
      const origin = process.env.APP_URL || req.nextUrl.origin;
      const params = new URLSearchParams();
      params.append('mode', 'payment');
      params.append('success_url', `${origin}/orders/${createdOrder.orderNumber}?checkout=success`);
      params.append('cancel_url', `${origin}/checkout?cancelled=true`);
      params.append('client_reference_id', createdOrder.orderNumber);
      params.append('customer_email', createdOrder.customerEmail);
      params.append('line_items[0][price_data][currency]', 'usd');
      params.append('line_items[0][price_data][product_data][name]', `Gromuse Order ${createdOrder.orderNumber}`);
      params.append('line_items[0][price_data][unit_amount]', String(createdOrder.totalCents));
      params.append('line_items[0][quantity]', '1');

      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const stripeJson = await stripeRes.json();
      if (!stripeRes.ok || !stripeJson.url) {
        console.error('Stripe session creation failed:', stripeJson);
        return NextResponse.json(
          { error: 'Unable to initialize Stripe payment session.' },
          { status: 502 }
        );
      }

      await db
        .update(payments)
        .set({ providerSessionId: stripeJson.id })
        .where(eq(payments.orderId, createdOrder.id));

      return NextResponse.json(
        {
          order: createdOrder,
          checkoutUrl: stripeJson.url,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        order: createdOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json(
      { error: 'Unable to place your order. Please try again.' },
      { status: 500 }
    );
  }
}
