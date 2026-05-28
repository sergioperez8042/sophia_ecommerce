import { NextRequest, NextResponse } from 'next/server';
import { getValidSession, getSessionUser, setSessionCookies } from '@/lib/auth-session';

/**
 * GET /api/auth/session
 *
 * Hidrata el estado de auth desde la cookie httpOnly. Refresca el idToken
 * si expiró. Devuelve `{ user }` o `{ user: null }` (nunca 401, para que el
 * cliente trate "sin sesión" como un estado normal, no un error).
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getValidSession(request);
    if (!session) return NextResponse.json({ user: null });

    const user = await getSessionUser(session);
    const res = NextResponse.json({ user: user ?? null });
    if (session.refreshed && session.tokens) setSessionCookies(res, session.tokens);
    return res;
  } catch {
    return NextResponse.json({ user: null });
  }
}
