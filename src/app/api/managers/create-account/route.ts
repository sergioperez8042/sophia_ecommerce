import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseAuth, unauthorizedResponse } from '@/lib/api-auth';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin-sdk';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/managers/create-account
 *
 * Crea (o re-enlaza si ya existe) una cuenta de Firebase Auth para un
 * gestor existente. Lo hace ÍNTEGRAMENTE server-side con Firebase Admin
 * SDK, lo que bypassea las security rules de Firestore — el control de
 * acceso lo hace este endpoint verificando que el caller es admin.
 *
 * Sustituye al flow viejo `GestorAccountService.createAccount` que
 * intentaba 3 escrituras client-side (createUserWithEmailAndPassword
 * + setDoc users + updateDoc gestores) y fallaba intermitentemente con
 * 'Missing or insufficient permissions' por culpa de las rules.
 *
 * Body: { gestorId, name, email, password }
 * Auth: Bearer <Firebase ID token del admin>
 * Response: { userId } | { error }
 */
const LOG_PREFIX = '[api/managers/create-account]';

export async function POST(request: NextRequest) {
  try {
  // 1) Verifica que el caller esté autenticado
  const caller = await verifyFirebaseAuth(request);
  if (!caller) {
    console.warn(`${LOG_PREFIX} unauthorized: missing/invalid Firebase ID token`);
    return unauthorizedResponse();
  }

  // 2) Verifica que el caller sea admin (lee su doc users/{uid})
  const adminFirestore = getAdminFirestore();
  const callerDoc = await adminFirestore
    .collection('users')
    .doc(caller.uid)
    .get();
  if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
    console.warn(
      `${LOG_PREFIX} forbidden: caller uid=${caller.uid} role=${callerDoc.data()?.role ?? 'none'}`,
    );
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
    console.warn(`${LOG_PREFIX} bad-request: invalid JSON body`);
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
  const gestorRef = adminFirestore.collection('gestores').doc(gestorId);
  const gestorSnap = await gestorRef.get();
  if (!gestorSnap.exists) {
    return NextResponse.json(
      { error: `El gestor con id ${gestorId} no existe.` },
      { status: 404 },
    );
  }

  const adminAuth = getAdminAuth();

  // 5) Resuelve el Auth user: crear o reusar si el email ya existe.
  //    En el flow viejo el cliente hacía signIn con la password, lo cual
  //    sobrescribía la sesión y obligaba a recordar la password del user
  //    existente. Con Admin SDK basta con `getUserByEmail` — no necesita
  //    autenticar al user existente.
  let uid: string;
  let createdNew = false;
  try {
    const existing = await adminAuth.getUserByEmail(cleanEmail);
    uid = existing.uid;
    // Si nos pidieron una password distinta, la actualizamos (admin
    // puede resetear la password de un user via Admin SDK).
    try {
      await adminAuth.updateUser(uid, { password, displayName: cleanName });
    } catch (updateErr) {
      // No fatal: dejamos la password vieja si update falla.
      console.warn('updateUser falló:', updateErr);
    }
  } catch (err) {
    const e = err as { code?: string };
    if (e.code === 'auth/user-not-found') {
      try {
        const newUser = await adminAuth.createUser({
          email: cleanEmail,
          password,
          displayName: cleanName,
        });
        uid = newUser.uid;
        createdNew = true;
      } catch (createErr) {
        const ce = createErr as { code?: string; message?: string };
        console.error(
          `${LOG_PREFIX} auth createUser failed: code=${ce.code} msg=${ce.message}`,
        );
        return NextResponse.json(
          {
            error: 'No se pudo crear el usuario en Firebase Auth.',
            code: ce.code,
            detail: ce.message,
          },
          { status: 400 },
        );
      }
    } else {
      const ge = err as { code?: string; message?: string };
      console.error(
        `${LOG_PREFIX} auth getUserByEmail failed: code=${ge.code} msg=${ge.message}`,
      );
      return NextResponse.json(
        {
          error: 'Error consultando Firebase Auth.',
          code: ge.code,
          detail: ge.message,
        },
        { status: 500 },
      );
    }
  }

  // 6) Escribir users/{uid} y actualizar gestores/{gestorId} en una sola
  //    transacción (batch). Si una falla, la otra revierte.
  //
  //    Para users/{uid}: usamos merge para no destruir campos extra
  //    (ej. si por alguna razón el doc ya existe con info adicional).
  //    PERO si el user existente ya tiene role: 'admin', NO sobrescribimos
  //    su role — eso degradaría al admin a manager.
  const usersRef = adminFirestore.collection('users').doc(uid);
  const existingUserDoc = await usersRef.get();
  const existingRole = existingUserDoc.exists ? existingUserDoc.data()?.role : null;
  const safeRole = existingRole === 'admin' ? 'admin' : 'manager';

  const batch = adminFirestore.batch();
  batch.set(
    usersRef,
    {
      name: cleanName,
      email: cleanEmail,
      role: safeRole,
      gestorId,
      ...(existingUserDoc.exists
        ? {}
        : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true },
  );
  batch.update(gestorRef, {
    userId: uid,
    email: cleanEmail,
  });

  try {
    await batch.commit();
  } catch (err) {
    const e = err as { code?: string; message?: string };
    console.error(
      `${LOG_PREFIX} firestore batch commit failed: code=${e.code} msg=${e.message} gestorId=${gestorId} uid=${uid}`,
    );
    return NextResponse.json(
      {
        error: 'No se pudo enlazar la cuenta con el gestor en Firestore.',
        code: e.code,
        detail: e.message,
      },
      { status: 500 },
    );
  }

  console.info(
    `${LOG_PREFIX} OK: gestorId=${gestorId} uid=${uid} createdNew=${createdNew} role=${safeRole} caller=${caller.uid}`,
  );

  return NextResponse.json({
    success: true,
    userId: uid,
    createdNew,
    role: safeRole,
  });
  } catch (err) {
    // Top-level catch: cualquier excepción no manejada (Admin SDK no
    // inicializado por env vars faltantes en local, crash de Firestore,
    // network timeout, etc.) cae aquí. Sin esto, Next.js devolvía un 500
    // sin body y el cliente solo veía "Error 500 al crear la cuenta" sin
    // pista de qué pasó.
    const e = err as { code?: string; message?: string; stack?: string };
    console.error(
      `${LOG_PREFIX} UNHANDLED: code=${e.code} msg=${e.message}\n${e.stack ?? ''}`,
    );
    // Detectar env vars faltantes para dar un mensaje útil en local
    const hasAdminCreds = !!(
      process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL
    );
    const hint = !hasAdminCreds
      ? ' [LOCAL: faltan FIREBASE_PRIVATE_KEY/FIREBASE_CLIENT_EMAIL en .env.local — pruébalo en producción]'
      : '';
    return NextResponse.json(
      {
        error: 'Excepción no controlada en el endpoint.' + hint,
        code: e.code ?? 'unknown',
        detail: e.message ?? String(err),
      },
      { status: 500 },
    );
  }
}
