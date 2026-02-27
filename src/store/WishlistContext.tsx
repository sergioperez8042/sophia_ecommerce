"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useState } from 'react';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// Types - Reusing CartProduct since it's similar structure for display
import { CartProduct } from './CartContext';

interface WishlistState {
  items: string[]; // Store only product IDs
  isLoaded: boolean;
}

type WishlistAction =
  | { type: 'LOAD_WISHLIST'; payload: string[] }
  | { type: 'ADD_ITEM'; payload: string }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'TOGGLE_ITEM'; payload: string }
  | { type: 'CLEAR_WISHLIST' };

interface WishlistContextType {
  items: string[]; // List of product IDs
  isLoaded: boolean;
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  toggleItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  totalItems: number;
}

const STORAGE_KEY = 'sophia_wishlist';

// Reducer
function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case 'LOAD_WISHLIST':
      return { ...state, items: action.payload, isLoaded: true };

    case 'ADD_ITEM':
      if (state.items.includes(action.payload)) return state;
      return { ...state, items: [...state.items, action.payload] };

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(id => id !== action.payload),
      };

    case 'TOGGLE_ITEM':
      return {
        ...state,
        items: state.items.includes(action.payload)
          ? state.items.filter(id => id !== action.payload)
          : [...state.items, action.payload],
      };

    case 'CLEAR_WISHLIST':
      return { ...state, items: [] };

    default:
      return state;
  }
}

// Context
const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

// Provider
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(wishlistReducer, { items: [], isLoaded: false });
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync Logic
  useEffect(() => {
    let unsubscribe: () => void = () => { };

    const syncWishlist = async () => {
      if (isAuthenticated && user && db) {
        // Authenticated: Sync with Firestore
        const userRef = doc(db, 'users', user.id);

        unsubscribe = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const remoteItems = data.wishlist as string[] || [];
            if (!isSyncing) {
              dispatch({ type: 'LOAD_WISHLIST', payload: remoteItems });
            }
          }
        });

        // Merge local if exists
        const localSaved = localStorage.getItem(STORAGE_KEY);
        if (localSaved) {
          const localItems = JSON.parse(localSaved) as string[];
          if (localItems.length > 0) {
            const docSnap = await getDoc(userRef);
            const remoteItems = docSnap.exists() ? (docSnap.data().wishlist as string[] || []) : [];

            // Merge unique
            const merged = Array.from(new Set([...remoteItems, ...localItems]));

            await setDoc(userRef, { wishlist: merged }, { merge: true });
            localStorage.removeItem(STORAGE_KEY);
          }
        }

      } else {
        // Guest: LocalStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        const items = saved ? JSON.parse(saved) : [];
        dispatch({ type: 'LOAD_WISHLIST', payload: items });
      }
    };

    syncWishlist();
    return () => unsubscribe();
  }, [isAuthenticated, user]);

  // Save changes
  useEffect(() => {
    if (!state.isLoaded) return;

    const saveChanges = async () => {
      setIsSyncing(true);
      if (isAuthenticated && user && db) {
        try {
          const userRef = doc(db, 'users', user.id);
          await setDoc(userRef, { wishlist: state.items }, { merge: true });
        } catch {
          // Save failed silently
        }
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
        window.dispatchEvent(new Event('wishlistChanged'));
      }
      setTimeout(() => setIsSyncing(false), 500);
    };

    const timeout = setTimeout(saveChanges, 500);
    return () => clearTimeout(timeout);

  }, [state.items, isAuthenticated, user, state.isLoaded]);

  // Actions
  const addToWishlist = (productId: string) => {
    dispatch({ type: 'ADD_ITEM', payload: productId });
  };

  const removeFromWishlist = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const toggleItem = (productId: string) => {
    dispatch({ type: 'TOGGLE_ITEM', payload: productId });
  };

  const isInWishlist = (productId: string) => {
    return state.items.includes(productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        items: state.items,
        isLoaded: state.isLoaded,
        addToWishlist,
        removeFromWishlist,
        toggleItem,
        isInWishlist,
        totalItems: state.items.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

// Hook
export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
