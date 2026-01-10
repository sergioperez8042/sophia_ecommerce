"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// Types
export interface WishlistProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  image: string;
  category?: string;
  brand?: string;
  inStock?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
}

interface WishlistState {
  items: WishlistProduct[];
  isLoaded: boolean;
}

type WishlistAction =
  | { type: 'LOAD_WISHLIST'; payload: WishlistProduct[] }
  | { type: 'ADD_ITEM'; payload: WishlistProduct }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'TOGGLE_ITEM'; payload: WishlistProduct }
  | { type: 'CLEAR_WISHLIST' };

interface WishlistContextType {
  items: WishlistProduct[];
  isLoaded: boolean;
  addItem: (product: WishlistProduct) => void;
  removeItem: (productId: string) => void;
  toggleItem: (product: WishlistProduct) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;
  totalItems: number;
}

const STORAGE_KEY = 'sophia_wishlist';

// Reducer
function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case 'LOAD_WISHLIST':
      return { ...state, items: action.payload, isLoaded: true };

    case 'ADD_ITEM': {
      const exists = state.items.some(item => item.id === action.payload.id);
      if (exists) return state;
      return { ...state, items: [...state.items, action.payload] };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      };

    case 'TOGGLE_ITEM': {
      const exists = state.items.some(item => item.id === action.payload.id);
      if (exists) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== action.payload.id),
        };
      }
      return { ...state, items: [...state.items, action.payload] };
    }

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
  const [state, dispatch] = useReducer(wishlistReducer, { items: [], isLoaded: false });

  // Load wishlist from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filter valid items
        const validItems = parsed.filter(
          (item: any) => item && typeof item === 'object' && item.id
        );
        dispatch({ type: 'LOAD_WISHLIST', payload: validItems });
      } else {
        dispatch({ type: 'LOAD_WISHLIST', payload: [] });
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      dispatch({ type: 'LOAD_WISHLIST', payload: [] });
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (state.isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
      window.dispatchEvent(new Event('wishlistChanged'));
    }
  }, [state.items, state.isLoaded]);

  // Actions
  const addItem = (product: WishlistProduct) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  };

  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const toggleItem = (product: WishlistProduct) => {
    dispatch({ type: 'TOGGLE_ITEM', payload: product });
  };

  const clearWishlist = () => {
    dispatch({ type: 'CLEAR_WISHLIST' });
  };

  const isInWishlist = (productId: string) => {
    return state.items.some((item: { id: string; }) => item.id === productId);
  };

  const totalItems = state.items.length;

  return (
    <WishlistContext.Provider
      value={{
        items: state.items,
        isLoaded: state.isLoaded,
        addItem,
        removeItem,
        toggleItem,
        clearWishlist,
        isInWishlist,
        totalItems,
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
