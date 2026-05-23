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

/**
 * Versión del schema persistido. Si en el futuro añadimos campos requeridos
 * a LocationData (p.ej. coordenadas, código postal) o cambiamos la forma de
 * algún campo, incrementamos esta constante y la lectura descarta las
 * entradas con versión distinta. Evita corromper sesiones cuando el shape
 * evoluciona.
 *
 * Historial:
 *   v0 (implícito): { municipality } — pre-rollout. Se descarta en hidrate.
 *   v1: { v: 1, province, municipality, consejoPopular? } — actual.
 */
const STORAGE_SCHEMA_VERSION = 1;

type StoredLocation = LocationData & { v: number };

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<LocationData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount.
  // Validación en este orden: (1) parse OK, (2) versión actual, (3) shape
  // completo. Cualquier fallo descarta la entrada y deja al usuario en
  // estado limpio — el LocationPopup auto-abre por hasFullLocation=false.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<StoredLocation>;
        const isValid =
          parsed &&
          parsed.v === STORAGE_SCHEMA_VERSION &&
          typeof parsed.province === 'string' &&
          typeof parsed.municipality === 'string';
        if (isValid) {
          setLocationState({
            province: parsed.province!,
            municipality: parsed.municipality!,
            consejoPopular: parsed.consejoPopular,
          });
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // localStorage no disponible o JSON malformado — fallback silencioso
    }
    setIsLoaded(true);
  }, []);

  const setLocation = useCallback((loc: LocationData) => {
    setLocationState(loc);
    try {
      const stored: StoredLocation = { ...loc, v: STORAGE_SCHEMA_VERSION };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
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
