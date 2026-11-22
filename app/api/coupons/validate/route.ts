import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/src/db/index';
import { coupons } from '@/src/db/schema';
import { ensureDatabaseSeeded } from '@/src/db/seed';
import { calculateCouponDiscountCents, isCouponValid } from '@/src/lib/pricing';
import { z } from 'zod';

const validateBodySchema = z.object({
  code: z.string().trim().min(1),
  subtotalCents: z.number().int().nonnegative(),
});

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const json = await req.json();
    const parsed = validateBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please enter a valid coupon code.' },
        { status: 400 }
      );
    }

    const code = parsed.data.code.toUpperCase();
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code))
      .limit(1);

    const check = isCouponValid(coupon, parsed.data.subtotalCents);
    if (!check.valid || !coupon) {
      return NextResponse.json(
        { error: check.reason || 'Invalid coupon code.' },
        { status: 400 }
      );
    }

    const discountCents = calculateCouponDiscountCents(
      parsed.data.subtotalCents,
      coupon
    );

    return NextResponse.json({
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderCents: coupon.minOrderCents,
      },
      discountCents,
    });
  } catch (error) {
    console.error('POST /api/coupons/validate error:', error);
    return NextResponse.json(
      { error: 'Unable to validate coupon.' },
      { status: 500 }
    );
  }
}
