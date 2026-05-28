import { NextRequest, NextResponse } from 'next/server';
import { getValidSession, getSessionUser, setSessionCookies } from '@/lib/auth-session';
import {
  getFirebaseRestConfig,
  firestoreBaseUrl,
  fsGetDoc,
  fsPatchDoc,
  fieldsToObject,
  fsRunQuery,
  eqStringQuery,
} from '@/lib/firestore-rest';

/**
 * PATCH /api/manager/orders/[id]/status  { status }
 *
 * Cambia el estado de un pedido. Valida que el pedido pertenezca al gestor
 * logueado (salvo admin). Espeja `OrderService.updateStatus`.
 */
export const dynamic = 'force-dynamic';
const LOG = '[api/manager/orders/status]';
const VALID_STATUSES = ['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'];

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;

    const session = await getValidSession(request);
    if (!session) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    const user = await getSessionUser(session);
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    }

    let body: { status?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
    }
    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 });
    }

    const { projectId, apiKey } = getFirebaseRestConfig();
    if (!projectId || !apiKey) {
      return NextResponse.json({ error: 'Configuración de Firebase incompleta.' }, { status: 500 });
    }
    const base = firestoreBaseUrl(projectId);

    const odoc = await fsGetDoc(base, `orders/${id}`, session.idToken, apiKey);
    if (!odoc.ok || !odoc.fields) {
      return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
    }

    // Los gestores solo pueden tocar SUS pedidos; admin puede cualquiera.
    if (user.role === 'manager') {
      const orderGestorId = fieldsToObject(odoc.fields).gestorId;
      let gestorId = user.gestorId;
      if (!gestorId) {
        const rows = await fsRunQuery(
          base,
          eqStringQuery('gestores', 'userId', user.id, 1),
          session.idToken,
          apiKey,
        );
        gestorId = rows[0]?.id as string | undefined;
      }
      if (!gestorId || orderGestorId !== gestorId) {
        return NextResponse.json({ error: 'Ese pedido no te pertenece.' }, { status: 403 });
      }
    }

    const patch = await fsPatchDoc(
      base,
      `orders/${id}`,
      { status: body.status, updatedAt: new Date().toISOString() },
      session.idToken,
      apiKey,
    );
    if (!patch.ok) {
      return NextResponse.json(
        { error: 'No se pudo actualizar el pedido.', detail: patch.detail },
        { status: 500 },
      );
    }

    const res = NextResponse.json({ success: true });
    if (session.refreshed && session.tokens) setSessionCookies(res, session.tokens);
    return res;
  } catch (err) {
    const e = err as { message?: string };
    console.error(`${LOG} UNHANDLED: ${e.message}`);
    return NextResponse.json({ error: 'Error al actualizar el pedido.' }, { status: 500 });
  }
}
