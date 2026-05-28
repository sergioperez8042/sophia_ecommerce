import { NextRequest, NextResponse } from 'next/server';
import { GestorService } from '@/lib/firestore-services';

/**
 * GET /api/gestor-lookup?province=&municipality=&consejo=
 *
 * Lookup del gestor que cubre una ubicación — EJECUTADO EN EL SERVIDOR.
 *
 * Por qué server-side: los clientes de Sophia están en Cuba, donde la
 * conexión DIRECTA del navegador a Firestore (firestore.googleapis.com)
 * es poco fiable / bloqueada por las restricciones de Google en la isla.
 * Cuando el `getDocs(gestores)` del cliente falla o vuelve vacío, el
 * lookup daba "no hay gestor en esta zona" AUNQUE sí lo hubiera — y peor,
 * el pedido por WhatsApp caía al número general en vez del gestor de zona.
 *
 * El catálogo ya funcionaba en Cuba porque sus productos se fetchean
 * server-side (Vercel → Firestore) y llegan en el HTML. Este endpoint hace
 * lo mismo para el gestor: el navegador cubano solo habla con
 * sophiacatalog.com (alcanzable), y Vercel hace la lectura a Firestore.
 *
 * Reusa `GestorService` (mismo matching normalizado que el admin) — cero
 * divergencia de lógica.
 *
 * Respuesta: { available, gestor: IGestor | null, nearby: [{consejo, gestorName}] }
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const province = sp.get('province')?.trim();
    const municipality = sp.get('municipality')?.trim();
    const consejo = sp.get('consejo')?.trim() || undefined;

    if (!province || !municipality) {
      return NextResponse.json(
        { error: 'province y municipality son requeridos.' },
        { status: 400 },
      );
    }

    const found = await GestorService.findByLocation(province, municipality, consejo);
    if (found) {
      return NextResponse.json({ available: true, gestor: found, nearby: [] });
    }

    // Sin match exacto: si la provincia usa consejos, sugerimos consejos
    // cercanos del mismo municipio que SÍ tienen cobertura.
    const nearby = consejo
      ? await GestorService.getCoveredConsejosInMunicipality(province, municipality)
      : [];
    return NextResponse.json({ available: false, gestor: null, nearby });
  } catch (err) {
    const e = err as { message?: string };
    console.error('[api/gestor-lookup]', e.message);
    return NextResponse.json(
      { available: false, gestor: null, nearby: [], error: e.message ?? 'lookup error' },
      { status: 500 },
    );
  }
}
