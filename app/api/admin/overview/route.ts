import { NextRequest, NextResponse } from 'next/server';
import { desc, sql } from 'drizzle-orm';
import { db } from '@/src/db/index';
import { categories, coupons, orders, products, users } from '@/src/db/schema';
import { getAllCategories, getAllProducts } from '@/src/db/queries';
import { requireAdminUser } from '@/src/lib/auth-server';

export async function GET(req: NextRequest) {
  const gate = await requireAdminUser(req);
  if ('error' in gate) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const [allProducts, allCategories, allOrders, allUsers, allCoupons] = await Promise.all([
      getAllProducts({ includeInactive: true }),
      getAllCategories(),
      db.select().from(orders).orderBy(desc(orders.createdAt)),
      db.select().from(users).orderBy(desc(users.createdAt)),
      db.select().from(coupons).orderBy(desc(coupons.createdAt)),
    ]);

    const totalRevenueCents = allOrders
      .filter((o) => o.orderStatus !== 'cancelled')
      .reduce((sum, o) => sum + o.totalCents, 0);

    const lowStockProducts = allProducts.filter((p) => p.stockQuantity <= 15);

    const [{ totalOrderCount }] = await db
      .select({ totalOrderCount: sql<number>`count(*)::int` })
      .from(orders);

    return NextResponse.json({
      stats: {
        totalOrders: totalOrderCount,
        totalProducts: allProducts.length,
        totalCustomers: allUsers.length,
        totalRevenueCents,
        lowStockCount: lowStockProducts.length,
      },
      products: allProducts,
      categories: allCategories,
      orders: allOrders,
      customers: allUsers,
      coupons: allCoupons,
    });
  } catch (error) {
    console.error('GET /api/admin/overview error:', error);
    return NextResponse.json({ error: 'Unable to load admin overview.' }, { status: 500 });
  }
}
