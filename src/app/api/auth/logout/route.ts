import { NextResponse } from 'next/server';
import { clearSessionCookies } from '@/lib/auth-session';

/**
 * POST /api/auth/logout — limpia las cookies de sesión del gestor.
 */
export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.json({ success: true });
  clearSessionCookies(res);
  return res;
}
