"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';

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
        setLocationState(JSON.parse(saved));
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
      hasFullLocation:
        isLoaded &&
        location !== null &&
        !!location.consejoPopular,
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
