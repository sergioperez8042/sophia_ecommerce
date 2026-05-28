"use client";

import { useEffect, useState } from "react";
import { lookupGestorByLocation } from "@/lib/gestor-lookup-client";
import type { IGestor } from "@/entities/all";

/**
 * Subset de LocationData que el hook necesita. Aceptamos `null` para que el
 * caller pueda pasar `useLocation().location` directamente sin pre-validar.
 */
export interface GestorLocationInput {
  province?: string;
  municipality?: string;
  consejoPopular?: string;
}

export interface UseGestorByLocationResult {
  /** Gestor resuelto o `null` si la ubicación no está cubierta */
  gestor: IGestor | null;
  /** True mientras la búsqueda en Firestore está en curso */
  loading: boolean;
}

/**
 * Resuelve el gestor que cubre la ubicación del cliente.
 *
 * Antes este `useEffect` vivía duplicado en `CartDrawer` y `app/cart/page`.
 * Encapsular aquí el cancellation token y el manejo de error garantiza que
 * los dos consumers se comporten idénticos — incluyendo la regla del
 * contrato de `GestorService.findByLocation`:
 *   - La Habana sin consejo → null
 *   - Consejo no cubierto    → null (sin fallback al municipio)
 *   - Provincia sin consejos → match por municipio
 *
 * El cancellation token protege contra el caso en el que el usuario cambia
 * de ubicación mientras una petición previa está en vuelo: la respuesta
 * vieja se descarta.
 *
 * Para un caso más rico (devolver "sugerencias cercanas" cuando no hay
 * cobertura), el `LocationPopup` mantiene su propia lógica con un tagged
 * union `GestorStatus` — ese flujo es exploratorio y no encaja en este hook.
 */
export function useGestorByLocation(
  location: GestorLocationInput | null,
): UseGestorByLocationResult {
  const [gestor, setGestor] = useState<IGestor | null>(null);
  const [loading, setLoading] = useState(false);

  // Sólo dependemos de los 3 valores primitivos. Si el caller pasa un objeto
  // `location` con identidad nueva cada render (sin memo), el efecto NO
  // re-corre — sólo si cambia alguno de los strings.
  const province = location?.province;
  const municipality = location?.municipality;
  const consejoPopular = location?.consejoPopular;

  useEffect(() => {
    if (!province || !municipality) {
      setGestor(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { gestor: found } = await lookupGestorByLocation(
          province,
          municipality,
          consejoPopular,
        );
        if (cancelled) return;
        setGestor(found);
      } catch {
        if (cancelled) return;
        setGestor(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [province, municipality, consejoPopular]);

  return { gestor, loading };
}
