import type { IGestor } from '@/entities/all';

/**
 * Cliente del lookup de gestor. Llama al endpoint server-side
 * `/api/gestor-lookup` en vez de leer Firestore directo desde el navegador.
 *
 * Motivo: los usuarios están en Cuba, donde la conexión directa del
 * navegador a Firestore es poco fiable/bloqueada. Pasando por el servidor
 * (Vercel → Firestore) el lookup funciona desde Cuba — el navegador solo
 * habla con sophiacatalog.com, que sí es alcanzable.
 */

export interface GestorLookupResult {
  available: boolean;
  gestor: IGestor | null;
  nearby: Array<{ consejo: string; gestorName: string }>;
}

export async function lookupGestorByLocation(
  province: string,
  municipality: string,
  consejo?: string,
): Promise<GestorLookupResult> {
  const params = new URLSearchParams({ province, municipality });
  if (consejo) params.set('consejo', consejo);

  const res = await fetch(`/api/gestor-lookup?${params.toString()}`, {
    // El resultado depende de los datos en Firestore (cambian vía admin),
    // así que no cacheamos a nivel de fetch del navegador.
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`gestor-lookup failed: ${res.status}`);
  }
  return res.json();
}
