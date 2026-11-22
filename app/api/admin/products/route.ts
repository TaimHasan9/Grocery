import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/src/db/index';
import { products } from '@/src/db/schema';
import { requireAdminUser } from '@/src/lib/auth-server';
import { slugify } from '@/src/lib/pricing';
import { productInputSchema } from '@/src/lib/validations';

export async function POST(req: NextRequest) {
  const gate = await requireAdminUser(req);
  if ('error' in gate) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const body = await req.json();
    const parsed = productInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid product payload.' },
        { status: 400 }
      );
    }

    const baseSlug = slugify(parsed.data.name);
    const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const [created] = await db
      .insert(products)
      .values({
        sku: parsed.data.sku,
        name: parsed.data.name,
        slug: uniqueSlug,
        storeName: parsed.data.storeName,
        categoryId: parsed.data.categoryId,
        description: parsed.data.description,
        unitWeight: parsed.data.unitWeight,
        priceCents: parsed.data.priceCents,
        originalPriceCents: parsed.data.originalPriceCents ?? null,
        discountPercent: parsed.data.discountPercent,
        stockQuantity: parsed.data.stockQuantity,
        imageUrl: parsed.data.imageUrl,
        galleryUrls: [parsed.data.imageUrl],
        sectionTags: parsed.data.sectionTags,
        isFeatured: parsed.data.isFeatured,
        isActive: parsed.data.isActive,
      })
      .returning();

    return NextResponse.json({ product: created }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/products error:', error);
    return NextResponse.json({ error: 'Unable to create product.' }, { status: 500 });
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
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    const parsed = productInputSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid product update.' },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(products)
      .set(parsed.data)
      .where(eq(products.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    return NextResponse.json({ product: updated });
  } catch (error) {
    console.error('PATCH /api/admin/products error:', error);
    return NextResponse.json({ error: 'Unable to update product.' }, { status: 500 });
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
      return NextResponse.json({ error: 'Invalid product ID.' }, { status: 400 });
    }

    await db.delete(products).where(eq(products.id, id));
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('DELETE /api/admin/products error:', error);
    return NextResponse.json(
      { error: 'Unable to delete product (it may be referenced by existing orders).' },
      { status: 400 }
    );
  }
}
