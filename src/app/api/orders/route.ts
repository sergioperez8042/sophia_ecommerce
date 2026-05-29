import { NextRequest, NextResponse } from 'next/server';
import {
  getFirebaseRestConfig,
  firestoreBaseUrl,
  objectToFields,
} from '@/lib/firestore-rest';

/**
 * POST /api/orders
 *
 * Crea un pedido server-side (Firestore REST). Motivo: el cliente está en
 * Cuba, donde el SDK de Firestore en el navegador NO falla rápido cuando
 * Google está bloqueado — se queda colgado reintentando, bloqueando el
 * envío del pedido por WhatsApp. Moviendo la escritura al servidor
 * (Vercel → Google) el navegador solo habla con sophiacatalog.com.
 *
 * El pedido lo crea un cliente ANÓNIMO (no hay login en el checkout). Para
 * que persista, la regla de Firestore de `orders` debe permitir create
 * público:  match /orders/{id} { allow create: if true; ... }
 * (read/update/delete siguen restringidos a gestores/admin). Mientras esa
 * regla no esté publicada, este endpoint responderá 403 — pero el envío por
 * WhatsApp ya no depende de él (es fire-and-forget en el cliente).
 *
 * Body: { items, subtotal, province, municipality, gestorId?, gestorName?,
 *         customerName?, customerEmail?, customerPhone?, notes? }
 * Response: { success, orderNumber, id } | { error }
 */
export const dynamic = 'force-dynamic';
const LOG = '[api/orders]';

interface OrderItemInput {
  productId?: string;
  name?: string;
  price?: number;
  quantity?: number;
  image?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// SPH-YYYYMMDD-HHMMSS — server-side, sin lectura previa (la regla de orders
// no permite read anónimo, así que no contamos los pedidos del día).
function generateOrderNumber(now: Date): string {
  const date = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`;
  const time = `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
  return `SPH-${date}-${time}`;
}

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

    let body: {
      items?: OrderItemInput[];
      subtotal?: number;
      province?: string;
      municipality?: string;
      gestorId?: string;
      gestorName?: string;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      notes?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'El pedido no tiene productos.' }, { status: 400 });
    }
    if (typeof body.subtotal !== 'number') {
      return NextResponse.json({ error: 'subtotal es requerido.' }, { status: 400 });
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const orderNumber = generateOrderNumber(now);

    const order = {
      orderNumber,
      items: body.items.map((it) => ({
        productId: it.productId ?? '',
        name: it.name ?? '',
        price: typeof it.price === 'number' ? it.price : 0,
        quantity: typeof it.quantity === 'number' ? it.quantity : 1,
        image: it.image ?? '',
      })),
      subtotal: body.subtotal,
      status: 'pending',
      province: body.province || 'Sin provincia',
      municipality: body.municipality || 'Sin municipio',
      gestorId: body.gestorId || '',
      gestorName: body.gestorName || '',
      customerName: (body.customerName || '').trim(),
      customerEmail: (body.customerEmail || '').trim().toLowerCase(),
      customerPhone: (body.customerPhone || '').trim(),
      notes: (body.notes || '').trim(),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Firestore REST createDocument (auto-id). Cliente anónimo → sin Bearer.
    const base = firestoreBaseUrl(projectId);
    const res = await fetch(`${base}/orders?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: objectToFields(order) }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error(`${LOG} create failed ${res.status}: ${detail}`);
      // 403 normalmente = la regla de orders aún exige auth. El envío por
      // WhatsApp en el cliente no depende de esto (fire-and-forget).
      return NextResponse.json(
        { error: 'No se pudo guardar el pedido en el sistema.', code: res.status },
        { status: res.status === 403 ? 403 : 500 },
      );
    }

    const created = await res.json();
    const id = (created.name as string | undefined)?.split('/').pop() ?? null;
    console.info(`${LOG} OK orderNumber=${orderNumber} id=${id} gestorId=${order.gestorId}`);
    return NextResponse.json({ success: true, orderNumber, id });
  } catch (err) {
    const e = err as { message?: string };
    console.error(`${LOG} UNHANDLED: ${e.message}`);
    return NextResponse.json({ error: 'Error al crear el pedido.' }, { status: 500 });
  }
}
