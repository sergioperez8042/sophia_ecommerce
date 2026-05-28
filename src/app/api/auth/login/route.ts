import { NextRequest, NextResponse } from 'next/server';
import {
  getFirebaseRestConfig,
  firestoreBaseUrl,
  fsGetDoc,
  fieldsToObject,
  objectToFields,
} from '@/lib/firestore-rest';
import { setSessionCookies } from '@/lib/auth-session';

/**
 * POST /api/auth/login  { email, password }
 *
 * Login server-side vía Identity Toolkit REST. Sirve a usuarios en Cuba,
 * donde `signInWithEmailAndPassword` del SDK cliente (→ `*.googleapis.com`)
 * está bloqueado. Setea cookies httpOnly con id/refresh token y devuelve
 * el perfil de `users/{uid}`.
 *
 * Response: { user } | { error }
 */
export const dynamic = 'force-dynamic';
const LOG = '[api/auth/login]';

const SIGNIN_ERRORS: Record<string, string> = {
  EMAIL_NOT_FOUND: 'Usuario no encontrado',
  INVALID_PASSWORD: 'Contraseña incorrecta',
  INVALID_LOGIN_CREDENTIALS: 'Credenciales inválidas',
  INVALID_EMAIL: 'Email inválido',
  USER_DISABLED: 'Usuario deshabilitado',
  TOO_MANY_ATTEMPTS_TRY_LATER: 'Demasiados intentos. Intenta más tarde',
};

export async function POST(request: NextRequest) {
  try {
    const { projectId, apiKey } = getFirebaseRestConfig();
    if (!projectId || !apiKey) {
      console.error(`${LOG} misconfig: projectId/apiKey ausentes`);
      return NextResponse.json(
        { error: 'Configuración de Firebase incompleta en el servidor.' },
        { status: 500 },
      );
    }

    let body: { email?: string; password?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
    }
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos.' }, { status: 400 });
    }

    // 1) signInWithPassword REST (server → Google; funciona desde Cuba)
    const signInResp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
        cache: 'no-store',
      },
    );
    if (!signInResp.ok) {
      const errJson = await signInResp.json().catch(() => ({}));
      const code: string = errJson?.error?.message ?? '';
      const key = Object.keys(SIGNIN_ERRORS).find((k) => code.startsWith(k));
      return NextResponse.json(
        { error: key ? SIGNIN_ERRORS[key] : 'Error al iniciar sesión' },
        { status: 401 },
      );
    }
    const signIn = await signInResp.json();
    const uid: string = signIn.localId;
    const idToken: string = signIn.idToken;
    const refreshToken: string = signIn.refreshToken;

    // 2) Lee el perfil users/{uid}. Si no existe, lo crea como client
    //    (paridad con el comportamiento previo de AuthContext.login).
    const base = firestoreBaseUrl(projectId);
    const userDoc = await fsGetDoc(base, `users/${uid}`, idToken, apiKey);

    let user: Record<string, unknown>;
    if (userDoc.ok && userDoc.fields) {
      const d = fieldsToObject(userDoc.fields);
      user = {
        id: uid,
        name: d.name ?? email.split('@')[0],
        email: d.email ?? email,
        role: d.role ?? 'client',
        phone: d.phone,
        avatar: d.avatar,
        managerCode: d.managerCode,
        zone: d.zone,
        gestorId: d.gestorId,
        createdAt: d.createdAt,
      };
    } else {
      const profile = {
        name: signIn.displayName || email.split('@')[0],
        email,
        role: 'client',
        createdAt: new Date(),
      };
      const mask = Object.keys(profile)
        .map((f) => `updateMask.fieldPaths=${f}`)
        .join('&');
      await fetch(`${base}/users/${uid}?key=${apiKey}&${mask}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ fields: objectToFields(profile) }),
      });
      user = {
        id: uid,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        createdAt: profile.createdAt.toISOString(),
      };
    }

    const res = NextResponse.json({ user });
    setSessionCookies(res, { idToken, refreshToken });
    return res;
  } catch (err) {
    const e = err as { message?: string };
    console.error(`${LOG} UNHANDLED: ${e.message}`);
    return NextResponse.json({ error: 'Error al iniciar sesión.' }, { status: 500 });
  }
}
