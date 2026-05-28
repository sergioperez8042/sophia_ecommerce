import { NextRequest, NextResponse } from 'next/server';
import { getValidSession, setSessionCookies } from '@/lib/auth-session';
import { getFirebaseRestConfig } from '@/lib/firestore-rest';

/**
 * POST /api/manager/change-password  { newPassword }
 *
 * Cambia la contraseña del gestor logueado vía Identity Toolkit REST
 * (`accounts:update`). Server-side → funciona desde Cuba (el SDK cliente
 * `updatePassword` está bloqueado allí). Devuelve id/refresh token nuevos
 * y reescribe las cookies de sesión.
 */
export const dynamic = 'force-dynamic';
const LOG = '[api/manager/change-password]';

export async function POST(request: NextRequest) {
  try {
    const session = await getValidSession(request);
    if (!session) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

    let body: { newPassword?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
    }
    if (!body.newPassword || body.newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 },
      );
    }

    const { apiKey } = getFirebaseRestConfig();
    if (!apiKey) {
      return NextResponse.json({ error: 'Configuración de Firebase incompleta.' }, { status: 500 });
    }

    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: session.idToken,
          password: body.newPassword,
          returnSecureToken: true,
        }),
        cache: 'no-store',
      },
    );
    if (!resp.ok) {
      const errJson = await resp.json().catch(() => ({}));
      const code = String(errJson?.error?.message ?? '');
      if (
        code.startsWith('TOKEN_EXPIRED') ||
        code.startsWith('CREDENTIAL_TOO_OLD_LOGIN_AGAIN') ||
        code.startsWith('INVALID_ID_TOKEN')
      ) {
        return NextResponse.json(
          { error: 'Por seguridad, cierra sesión y vuelve a entrar antes de cambiar la contraseña.' },
          { status: 401 },
        );
      }
      return NextResponse.json({ error: 'No se pudo cambiar la contraseña.' }, { status: 400 });
    }

    const json = await resp.json();
    const res = NextResponse.json({ success: true });
    if (json.idToken && json.refreshToken) {
      setSessionCookies(res, { idToken: json.idToken, refreshToken: json.refreshToken });
    } else if (session.refreshed && session.tokens) {
      setSessionCookies(res, session.tokens);
    }
    return res;
  } catch (err) {
    const e = err as { message?: string };
    console.error(`${LOG} UNHANDLED: ${e.message}`);
    return NextResponse.json({ error: 'Error al cambiar la contraseña.' }, { status: 500 });
  }
}
