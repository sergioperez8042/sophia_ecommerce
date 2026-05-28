/**
 * Sesión de gestor server-side (sin Admin SDK).
 *
 * El SDK cliente de Firebase Auth pega directo a `*.googleapis.com`, que
 * está bloqueado desde Cuba. Por eso el login de gestores ocurre en el
 * servidor (Identity Toolkit REST) y la sesión se mantiene en cookies
 * httpOnly con el `idToken` (~1h) + `refreshToken`. Estos helpers leen,
 * verifican y refrescan esa sesión, y resuelven el perfil del usuario
 * leyendo `users/{uid}` vía Firestore REST con el propio idToken.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from './firebase-admin';
import {
  getFirebaseRestConfig,
  firestoreBaseUrl,
  fsGetDoc,
  fieldsToObject,
} from './firestore-rest';

const ID_COOKIE = 'sophia_fb_id';
const REFRESH_COOKIE = 'sophia_fb_refresh';

const baseCookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export interface SessionTokens {
  idToken: string;
  refreshToken: string;
}

export function setSessionCookies(res: NextResponse, t: SessionTokens): void {
  res.cookies.set(ID_COOKIE, t.idToken, { ...baseCookieOpts, maxAge: 60 * 60 }); // 1h
  res.cookies.set(REFRESH_COOKIE, t.refreshToken, {
    ...baseCookieOpts,
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });
}

export function clearSessionCookies(res: NextResponse): void {
  res.cookies.set(ID_COOKIE, '', { ...baseCookieOpts, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, '', { ...baseCookieOpts, maxAge: 0 });
}

/** Intercambia el refresh token por un idToken nuevo (server → Google). */
async function refreshIdToken(
  refreshToken: string,
  apiKey: string,
): Promise<SessionTokens | null> {
  const res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json = await res.json();
  if (!json.id_token || !json.refresh_token) return null;
  return { idToken: json.id_token, refreshToken: json.refresh_token };
}

export interface ValidSession {
  uid: string;
  idToken: string;
  /** Presente solo si se refrescó: el caller debe `setSessionCookies(res, tokens)`. */
  tokens?: SessionTokens;
  refreshed: boolean;
}

/**
 * Devuelve una sesión válida (idToken verificado con jose). Si el idToken
 * expiró pero hay refresh token, lo refresca. Si `refreshed === true`, el
 * caller DEBE reescribir las cookies con `setSessionCookies(res, tokens!)`.
 */
export async function getValidSession(req: NextRequest): Promise<ValidSession | null> {
  const idToken = req.cookies.get(ID_COOKIE)?.value;
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;

  if (idToken) {
    const payload = await verifyFirebaseToken(idToken);
    if (payload) return { uid: payload.uid, idToken, refreshed: false };
  }

  if (refreshToken) {
    const { apiKey } = getFirebaseRestConfig();
    if (!apiKey) return null;
    const tokens = await refreshIdToken(refreshToken, apiKey);
    if (tokens) {
      const payload = await verifyFirebaseToken(tokens.idToken);
      if (payload) return { uid: payload.uid, idToken: tokens.idToken, tokens, refreshed: true };
    }
  }

  return null;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatar?: string;
  managerCode?: string;
  zone?: string;
  gestorId?: string;
  createdAt?: string;
}

/** Lee `users/{uid}` vía Firestore REST con el idToken del propio usuario. */
export async function getSessionUser(session: ValidSession): Promise<SessionUser | null> {
  const { projectId, apiKey } = getFirebaseRestConfig();
  if (!projectId || !apiKey) return null;

  const base = firestoreBaseUrl(projectId);
  const doc = await fsGetDoc(base, `users/${session.uid}`, session.idToken, apiKey);
  if (!doc.ok || !doc.fields) return null;

  const d = fieldsToObject(doc.fields);
  return {
    id: session.uid,
    name: String(d.name ?? ''),
    email: String(d.email ?? ''),
    role: String(d.role ?? 'client'),
    phone: d.phone as string | undefined,
    avatar: d.avatar as string | undefined,
    managerCode: d.managerCode as string | undefined,
    zone: d.zone as string | undefined,
    gestorId: d.gestorId as string | undefined,
    createdAt: d.createdAt as string | undefined,
  };
}
