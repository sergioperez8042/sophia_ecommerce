"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LocationData {
  province: string;
  municipality: string;
}

interface LocationContextType {
  location: LocationData | null;
  setLocation: (location: LocationData) => void;
  clearLocation: () => void;
  hasLocation: boolean;
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

  const setLocation = (loc: LocationData) => {
    setLocationState(loc);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    } catch {
      // ignore
    }
  };

  const clearLocation = () => {
    setLocationState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        setLocation,
        clearLocation,
        hasLocation: isLoaded && location !== null,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
