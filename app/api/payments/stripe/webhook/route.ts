import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/src/db/index';
import { orders, payments } from '@/src/db/schema';

function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string
): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(',').map((kv) => {
      const idx = kv.indexOf('=');
      return idx === -1 ? [kv, ''] : [kv.slice(0, idx), kv.slice(idx + 1)];
    })
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  const sigBuf = Buffer.from(signature, 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'STRIPE_WEBHOOK_SECRET is not configured.' },
        { status: 503 }
      );
    }

    const rawBody = await req.text();
    const sigHeader = req.headers.get('stripe-signature');
    if (!verifyStripeSignature(rawBody, sigHeader, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid Stripe webhook signature.' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object;
      const orderNumber = session?.client_reference_id;
      if (orderNumber && session?.payment_status === 'paid') {
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.orderNumber, orderNumber))
          .limit(1);

        if (order) {
          await db
            .update(orders)
            .set({
              paymentStatus: 'paid',
              orderStatus: 'confirmed',
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id));

          await db
            .update(payments)
            .set({
              status: 'paid',
              rawPayload: session,
            })
            .where(eq(payments.orderId, order.id));
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
