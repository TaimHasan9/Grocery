import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/src/db/index';
import { categories } from '@/src/db/schema';
import { requireAdminUser } from '@/src/lib/auth-server';
import { slugify } from '@/src/lib/pricing';

const categorySchema = z.object({
  name: z.string().trim().min(2),
  subtitle: z.string().trim().min(2).default('Local market'),
  description: z.string().trim().default(''),
  imageUrl: z.string().trim().min(1).default('/images/prod-broccoli.jpg'),
});

export async function POST(req: NextRequest) {
  const gate = await requireAdminUser(req);
  if ('error' in gate) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid category payload.' }, { status: 400 });
    }

    const [created] = await db
      .insert(categories)
      .values({
        name: parsed.data.name,
        slug: slugify(parsed.data.name),
        subtitle: parsed.data.subtitle,
        description: parsed.data.description,
        imageUrl: parsed.data.imageUrl,
      })
      .returning();

    return NextResponse.json({ category: created }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/categories error:', error);
    return NextResponse.json({ error: 'Unable to create category.' }, { status: 500 });
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
      return NextResponse.json({ error: 'Invalid category ID.' }, { status: 400 });
    }
    await db.delete(categories).where(eq(categories.id, id));
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('DELETE /api/admin/categories error:', error);
    return NextResponse.json(
      { error: 'Category cannot be deleted while products reference it.' },
      { status: 400 }
    );
  }
}
