import { NextRequest, NextResponse } from 'next/server';
import { getValidSession, getSessionUser, setSessionCookies, SessionUser } from '@/lib/auth-session';
import {
  getFirebaseRestConfig,
  firestoreBaseUrl,
  fsGetDoc,
  fieldsToObject,
  fsRunQuery,
  eqStringQuery,
} from '@/lib/firestore-rest';

/**
 * GET /api/manager/orders
 *
 * Devuelve `{ gestor, orders }` del gestor logueado, leyendo Firestore vía
 * REST server-side (funciona desde Cuba). Espeja `GestorService.getById`
 * + `OrderService.getByGestorId` (sort por createdAt desc). Usa el idToken
 * del propio gestor como Bearer → las security rules siguen aplicando.
 */
export const dynamic = 'force-dynamic';
const LOG = '[api/manager/orders]';

async function resolveGestorId(
  base: string,
  idToken: string,
  apiKey: string,
  user: SessionUser,
): Promise<string | null> {
  if (user.gestorId) return user.gestorId;
  // Fallback: buscar el gestor cuyo userId == uid
  const rows = await fsRunQuery(
    base,
    eqStringQuery('gestores', 'userId', user.id, 1),
    idToken,
    apiKey,
  );
  return rows[0]?.id ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getValidSession(request);
    if (!session) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

    const user = await getSessionUser(session);
    if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    if (user.role !== 'manager' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo gestores.' }, { status: 403 });
    }

    const { projectId, apiKey } = getFirebaseRestConfig();
    if (!projectId || !apiKey) {
      return NextResponse.json({ error: 'Configuración de Firebase incompleta.' }, { status: 500 });
    }
    const base = firestoreBaseUrl(projectId);

    const gestorId = await resolveGestorId(base, session.idToken, apiKey, user);
    let gestor: Record<string, unknown> | null = null;
    let orders: Array<{ id: string; [k: string]: unknown }> = [];

    if (gestorId) {
      const gdoc = await fsGetDoc(base, `gestores/${gestorId}`, session.idToken, apiKey);
      if (gdoc.ok && gdoc.fields) gestor = { id: gestorId, ...fieldsToObject(gdoc.fields) };

      orders = await fsRunQuery(
        base,
        eqStringQuery('orders', 'gestorId', gestorId),
        session.idToken,
        apiKey,
      );
      orders.sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
    }

    const res = NextResponse.json({ gestor, orders });
    if (session.refreshed && session.tokens) setSessionCookies(res, session.tokens);
    return res;
  } catch (err) {
    const e = err as { message?: string };
    console.error(`${LOG} UNHANDLED: ${e.message}`);
    return NextResponse.json({ error: 'Error al cargar pedidos.' }, { status: 500 });
  }
}
