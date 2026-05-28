import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseAuth, unauthorizedResponse } from '@/lib/api-auth';

/**
 * POST /api/managers/create-account
 *
 * Crea (o re-enlaza) una cuenta de Firebase Auth para un gestor existente.
 *
 * IMPLEMENTACIÓN VIA REST (sin Firebase Admin SDK):
 *   El flow anterior usaba `firebase-admin` (service account), que requería
 *   las env vars FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY configuradas
 *   en el server. Como NO están en Vercel (ni en local), el Admin SDK caía
 *   a "application default credentials" y fallaba con "Could not load the
 *   default credentials" — el endpoint nunca funcionó en producción.
 *
 *   Esta versión NO necesita service account. Usa:
 *     1. La API key pública (NEXT_PUBLIC_FIREBASE_API_KEY) + Identity
 *        Toolkit REST para crear/resolver el usuario de Auth.
 *     2. El idToken del ADMIN que llama (Bearer) para escribir Firestore
 *        vía REST — las security rules `isAdmin()` permiten al admin
 *        escribir users/* y gestores/*. Mismo patrón que los scripts de
 *        seed/migración que ya funcionan contra producción.
 *
 * Body: { gestorId, name, email, password }
 * Auth: Bearer <Firebase ID token del admin>
 * Response: { success, userId, createdNew, role } | { error }
 */
const LOG_PREFIX = '[api/managers/create-account]';

function getConfig() {
  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  return { projectId, apiKey };
}

// ── Firestore REST value (de)serialization ──────────────────────────────────
type FsValue = Record<string, unknown>;
function toFsValue(value: unknown): FsValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number')
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value))
    return { arrayValue: { values: value.map(toFsValue) } };
  if (typeof value === 'object') {
    const fields: Record<string, FsValue> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) fields[k] = toFsValue(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}
function fromFsValue(v: FsValue | undefined): unknown {
  if (!v) return undefined;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) {
    const arr = (v.arrayValue as { values?: FsValue[] })?.values ?? [];
    return arr.map(fromFsValue);
  }
  if ('mapValue' in v) {
    const o: Record<string, unknown> = {};
    const fields = (v.mapValue as { fields?: Record<string, FsValue> })?.fields ?? {};
    for (const [k, val] of Object.entries(fields)) o[k] = fromFsValue(val);
    return o;
  }
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, apiKey } = getConfig();
    if (!projectId || !apiKey) {
      console.error(`${LOG_PREFIX} misconfig: projectId/apiKey ausentes`);
      return NextResponse.json(
        { error: 'Configuración de Firebase incompleta en el servidor.' },
        { status: 500 },
      );
    }
    const fsBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

    // 1) Verifica que el caller esté autenticado (jose, sin service account)
    const caller = await verifyFirebaseAuth(request);
    if (!caller) {
      console.warn(`${LOG_PREFIX} unauthorized: missing/invalid Firebase ID token`);
      return unauthorizedResponse();
    }
    // El idToken crudo del admin — lo reusamos para escribir Firestore vía REST
    const adminToken = request.headers.get('authorization')!.slice(7);

    // 2) Verifica que el caller sea admin (lee su doc users/{uid} con SU token)
    const callerResp = await fetch(`${fsBase}/users/${caller.uid}?key=${apiKey}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!callerResp.ok) {
      console.warn(`${LOG_PREFIX} forbidden: no se pudo leer users/${caller.uid} (${callerResp.status})`);
      return NextResponse.json(
        { error: 'Solo administradores pueden crear cuentas de gestor.' },
        { status: 403 },
      );
    }
    const callerDoc = await callerResp.json();
    const callerRole = fromFsValue(callerDoc.fields?.role);
    if (callerRole !== 'admin') {
      console.warn(`${LOG_PREFIX} forbidden: caller uid=${caller.uid} role=${callerRole ?? 'none'}`);
      return NextResponse.json(
        { error: 'Solo administradores pueden crear cuentas de gestor.' },
        { status: 403 },
      );
    }

    // 3) Parse + valida payload
    let body: { gestorId?: string; name?: string; email?: string; password?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
    }
    const { gestorId, name, email, password } = body;
    if (!gestorId || !name || !email || !password) {
      return NextResponse.json(
        { error: 'Faltan campos: gestorId, name, email, password son requeridos.' },
        { status: 400 },
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 },
      );
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // 4) Verifica que el gestor exista
    const gestorRef = `${fsBase}/gestores/${gestorId}`;
    const gestorResp = await fetch(`${gestorRef}?key=${apiKey}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (gestorResp.status === 404) {
      return NextResponse.json({ error: `El gestor con id ${gestorId} no existe.` }, { status: 404 });
    }
    if (!gestorResp.ok) {
      return NextResponse.json(
        { error: 'No se pudo leer el gestor.', detail: await gestorResp.text() },
        { status: 500 },
      );
    }

    // 5) Crea o resuelve el usuario de Auth vía Identity Toolkit REST.
    //    Primero intenta signUp (cuenta nueva). Si el email ya existe,
    //    intenta signIn con la password dada para recuperar el uid.
    let uid: string;
    let createdNew = false;
    const signUpResp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password, returnSecureToken: true }),
      },
    );
    if (signUpResp.ok) {
      uid = (await signUpResp.json()).localId;
      createdNew = true;
    } else {
      const errJson = await signUpResp.json().catch(() => ({}));
      const code = errJson?.error?.message ?? '';
      if (code.startsWith('EMAIL_EXISTS')) {
        // El email ya tiene cuenta. Recuperamos el uid autenticando con la
        // password dada (si coincide). Si no coincide, no podemos re-enlazar
        // sin Admin SDK → pedimos la contraseña correcta o un email distinto.
        const signInResp = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password, returnSecureToken: true }),
          },
        );
        if (!signInResp.ok) {
          return NextResponse.json(
            {
              error:
                'Ese email ya tiene una cuenta con OTRA contraseña. Usa la contraseña correcta de esa cuenta, o un email distinto para el gestor.',
              code: 'EMAIL_EXISTS_WRONG_PASSWORD',
            },
            { status: 400 },
          );
        }
        uid = (await signInResp.json()).localId;
      } else {
        console.error(`${LOG_PREFIX} signUp failed: ${code}`);
        return NextResponse.json(
          { error: 'No se pudo crear el usuario en Firebase Auth.', code },
          { status: 400 },
        );
      }
    }

    // 6) Determina el role seguro: si el user ya existe con role admin, NO
    //    lo degradamos a manager.
    const existingUserResp = await fetch(`${fsBase}/users/${uid}?key=${apiKey}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const userExists = existingUserResp.ok;
    let existingRole: unknown = null;
    if (userExists) {
      existingRole = fromFsValue((await existingUserResp.json()).fields?.role);
    }
    const safeRole = existingRole === 'admin' ? 'admin' : 'manager';

    // 7) Escribe users/{uid} (merge via updateMask) con el token del admin.
    const userFields: Record<string, unknown> = {
      name: cleanName,
      email: cleanEmail,
      role: safeRole,
      gestorId,
    };
    if (!userExists) userFields.createdAt = new Date();
    const userMask = Object.keys(userFields)
      .map((f) => `updateMask.fieldPaths=${f}`)
      .join('&');
    const writeUserResp = await fetch(`${fsBase}/users/${uid}?key=${apiKey}&${userMask}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        fields: Object.fromEntries(Object.entries(userFields).map(([k, v]) => [k, toFsValue(v)])),
      }),
    });
    if (!writeUserResp.ok) {
      return NextResponse.json(
        {
          error: 'No se pudo escribir el doc del usuario (revisa las reglas de Firestore para admin).',
          detail: await writeUserResp.text(),
        },
        { status: 500 },
      );
    }

    // 8) Enlaza gestores/{gestorId}.userId + email (merge via updateMask).
    const writeGestorResp = await fetch(
      `${gestorRef}?key=${apiKey}&updateMask.fieldPaths=userId&updateMask.fieldPaths=email`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ fields: { userId: toFsValue(uid), email: toFsValue(cleanEmail) } }),
      },
    );
    if (!writeGestorResp.ok) {
      return NextResponse.json(
        { error: 'Cuenta creada pero no se pudo enlazar con el gestor.', detail: await writeGestorResp.text() },
        { status: 500 },
      );
    }

    console.info(
      `${LOG_PREFIX} OK: gestorId=${gestorId} uid=${uid} createdNew=${createdNew} role=${safeRole} caller=${caller.uid}`,
    );
    return NextResponse.json({ success: true, userId: uid, createdNew, role: safeRole });
  } catch (err) {
    const e = err as { message?: string; stack?: string };
    console.error(`${LOG_PREFIX} UNHANDLED: ${e.message}\n${e.stack ?? ''}`);
    return NextResponse.json(
      { error: 'Excepción no controlada en el endpoint.', detail: e.message ?? String(err) },
      { status: 500 },
    );
  }
}
