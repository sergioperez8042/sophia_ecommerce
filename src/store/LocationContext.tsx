"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { requiresConsejoPopular } from '@/data/localities';

/**
 * Ubicación granular del cliente. El consejoPopular es opcional por
 * backward compatibility — sesiones antiguas guardadas solo tenían province
 * y municipality. Cuando el usuario re-abra la app después del rollout de
 * consejos, el popup le pedirá el consejo si no lo tiene guardado.
 */
interface LocationData {
  province: string;
  municipality: string;
  consejoPopular?: string;
}

interface LocationContextType {
  location: LocationData | null;
  setLocation: (location: LocationData) => void;
  clearLocation: () => void;
  hasLocation: boolean;
  /** True si la location guardada tiene los 3 niveles completos (no solo province+municipio) */
  hasFullLocation: boolean;
}

const STORAGE_KEY = 'sophia_location';

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<LocationData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<LocationData>;
        // Guard contra shape legacy: antes del rollout de provincia (Nov 2025)
        // se guardaba solo { municipality }. Si carga un objeto incompleto,
        // forzamos re-confirmación con el LocationPopup (que auto-abre por
        // hasFullLocation=false). NO inferimos `province` desde `municipality`
        // — podría haber municipios ambiguos y meter al usuario en la
        // provincia equivocada.
        if (parsed && parsed.province && parsed.municipality) {
          setLocationState(parsed as LocationData);
        } else {
          // Limpiar la entrada inválida para no quedar en bucle
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  const setLocation = useCallback((loc: LocationData) => {
    setLocationState(loc);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    } catch {
      // ignore
    }
  }, []);

  const clearLocation = useCallback(() => {
    setLocationState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Sin este memo, el provider entrega un objeto literal nuevo cada render,
  // forzando re-render a todos los consumers (cart, drawer, popup) en cascada.
  const value = useMemo(
    () => ({
      location,
      setLocation,
      clearLocation,
      hasLocation: isLoaded && location !== null,
      // "Completa" significa que el flujo de selección está terminado para
      // esa provincia — no que TODOS los campos estén poblados. Matanzas
      // tiene usesConsejos:false, así que provincia+municipio ya es completo;
      // exigir consejoPopular reabriría el popup en cada visita.
      hasFullLocation:
        isLoaded &&
        location !== null &&
        (!requiresConsejoPopular(location.province) || !!location.consejoPopular),
    }),
    [location, setLocation, clearLocation, isLoaded]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
