import { NextRequest } from 'next/server';
import { adminAuth } from './firebase-admin.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

const INITIAL_ADMIN_EMAIL = 'taimhasan491@gmail.com';

export function isConfiguredAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (normalized === INITIAL_ADMIN_EMAIL) return true;
  const envAdmins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return envAdmins.includes(normalized);
}

export async function getOrCreateDbUser(params: {
  uid: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}) {
  const isAdmin = isConfiguredAdminEmail(params.email);
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.uid, params.uid))
    .limit(1);

  if (existing.length > 0) {
    const current = existing[0];
    const nextRole = isAdmin ? 'admin' : current.role;
    const [updated] = await db
      .update(users)
      .set({
        email: params.email,
        name: params.name || current.name,
        avatarUrl: params.avatarUrl || current.avatarUrl,
        role: nextRole,
      })
      .where(eq(users.uid, params.uid))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(users)
    .values({
      uid: params.uid,
      email: params.email,
      name: params.name || params.email.split('@')[0] || 'Customer',
      avatarUrl: params.avatarUrl || '',
      role: isAdmin ? 'admin' : 'customer',
    })
    .onConflictDoUpdate({
      target: users.uid,
      set: {
        email: params.email,
      },
    })
    .returning();

  return created;
}

export async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const email = decoded.email || '';
    if (!email) return null;
    const dbUser = await getOrCreateDbUser({
      uid: decoded.uid,
      email,
      name: decoded.name || '',
      avatarUrl: decoded.picture || '',
    });
    return { decoded, dbUser };
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return null;
  }
}

export async function requireAdminUser(req: NextRequest) {
  const authResult = await getAuthenticatedUser(req);
  if (!authResult) {
    return { error: 'Unauthorized: Sign in required', status: 401 as const };
  }
  if (authResult.dbUser.role !== 'admin') {
    return { error: 'Forbidden: Admin privileges required', status: 403 as const };
  }
  return { user: authResult.dbUser, decoded: authResult.decoded };
}
