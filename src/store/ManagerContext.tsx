"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useState, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types
export interface Manager {
  id: string;
  name: string;
  email: string;
  phone: string;
  code: string; // Código único del gestor
  avatar?: string;
  zone?: string; // Zona de gestión
}

interface ManagerState {
  manager: Manager | null;
  availableManagers: Manager[];
  isLoaded: boolean;
  isLoadingManagers: boolean;
}

type ManagerAction =
  | { type: 'LOAD_MANAGER'; payload: Manager | null }
  | { type: 'SET_MANAGER'; payload: Manager }
  | { type: 'CLEAR_MANAGER' }
  | { type: 'SET_AVAILABLE_MANAGERS'; payload: Manager[] }
  | { type: 'SET_LOADING_MANAGERS'; payload: boolean };

interface ManagerContextType {
  manager: Manager | null;
  availableManagers: Manager[];
  isLoaded: boolean;
  isLoadingManagers: boolean;
  setManager: (manager: Manager) => void;
  clearManager: () => void;
  isManagerLoggedIn: boolean;
  refreshManagers: () => Promise<void>;
}

const STORAGE_KEY = 'sophia_manager';
const USERS_COLLECTION = 'users';

// Helper to check if Firebase is configured
const isFirebaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
};

// Reducer
function managerReducer(state: ManagerState, action: ManagerAction): ManagerState {
  switch (action.type) {
    case 'LOAD_MANAGER':
      return { ...state, manager: action.payload, isLoaded: true };

    case 'SET_MANAGER':
      return { ...state, manager: action.payload };

    case 'CLEAR_MANAGER':
      return { ...state, manager: null };

    case 'SET_AVAILABLE_MANAGERS':
      return { ...state, availableManagers: action.payload, isLoadingManagers: false };

    case 'SET_LOADING_MANAGERS':
      return { ...state, isLoadingManagers: action.payload };

    default:
      return state;
  }
}

// Context
const ManagerContext = createContext<ManagerContextType | undefined>(undefined);

// Provider
export function ManagerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(managerReducer, {
    manager: null,
    availableManagers: [],
    isLoaded: false,
    isLoadingManagers: false
  });

  // Load managers from Firebase
  const loadManagersFromFirebase = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured. Cannot load managers.');
      return;
    }

    dispatch({ type: 'SET_LOADING_MANAGERS', payload: true });

    try {
      const managersQuery = query(
        collection(db, USERS_COLLECTION),
        where('role', '==', 'manager')
      );
      const snapshot = await getDocs(managersQuery);

      const managers: Manager[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          code: data.managerCode || `MGR-${doc.id.slice(0, 3).toUpperCase()}`,
          avatar: data.avatar,
          zone: data.zone || 'Sin asignar',
        };
      });

      dispatch({ type: 'SET_AVAILABLE_MANAGERS', payload: managers });
    } catch (error) {
      console.error('Error loading managers from Firebase:', error);
      dispatch({ type: 'SET_LOADING_MANAGERS', payload: false });
    }
  }, []);

  // Load available managers on mount
  useEffect(() => {
    loadManagersFromFirebase();
  }, [loadManagersFromFirebase]);

  // Load selected manager from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.name && parsed.code) {
          dispatch({ type: 'LOAD_MANAGER', payload: parsed });
        } else {
          dispatch({ type: 'LOAD_MANAGER', payload: null });
        }
      } else {
        dispatch({ type: 'LOAD_MANAGER', payload: null });
      }
    } catch (error) {
      console.error('Error loading manager:', error);
      localStorage.removeItem(STORAGE_KEY);
      dispatch({ type: 'LOAD_MANAGER', payload: null });
    }
  }, []);

  // Save manager to localStorage whenever it changes
  useEffect(() => {
    if (state.isLoaded) {
      if (state.manager) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.manager));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [state.manager, state.isLoaded]);

  const setManager = (manager: Manager) => {
    dispatch({ type: 'SET_MANAGER', payload: manager });
  };

  const clearManager = () => {
    dispatch({ type: 'CLEAR_MANAGER' });
  };

  const refreshManagers = async () => {
    await loadManagersFromFirebase();
  };

  const value: ManagerContextType = {
    manager: state.manager,
    availableManagers: state.availableManagers,
    isLoaded: state.isLoaded,
    isLoadingManagers: state.isLoadingManagers,
    setManager,
    clearManager,
    isManagerLoggedIn: state.manager !== null,
    refreshManagers,
  };

  return (
    <ManagerContext.Provider value={value}>
      {children}
    </ManagerContext.Provider>
  );
}

// Hook
export function useManager() {
  const context = useContext(ManagerContext);
  if (context === undefined) {
    throw new Error('useManager must be used within a ManagerProvider');
  }
  return context;
}

// Legacy export for backwards compatibility (returns empty array now, use hook instead)
export const AVAILABLE_MANAGERS: Manager[] = [];

