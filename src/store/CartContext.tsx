"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useState } from 'react';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase'; // Ensure this path is correct
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// Types
export interface CartProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image: string;
  category?: string;
  brand?: string;
  inStock?: boolean;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isLoaded: boolean;
}

type CartAction =
  | { type: 'LOAD_CART'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: CartProduct }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' };

interface CartContextType {
  items: CartItem[];
  isLoaded: boolean;
  addItem: (product: CartProduct) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  shipping: number;
  total: number;
}

const STORAGE_KEY = 'sophia_cart';
const FREE_SHIPPING_THRESHOLD = 50;
const SHIPPING_COST = 5.99;

// Reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'LOAD_CART':
      return { ...state, items: action.payload, isLoaded: true };

    case 'ADD_ITEM': {
      const validItems = state.items.filter(item => item && item.product && item.product.id);
      const existingIndex = validItems.findIndex(
        item => item.product.id === action.payload.id
      );

      if (existingIndex >= 0) {
        const updatedItems = [...validItems];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + 1,
        };
        return { ...state, items: updatedItems };
      }

      return {
        ...state,
        items: [...validItems, { product: action.payload, quantity: 1 }],
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.product.id !== action.payload),
      };

    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.product.id !== action.payload.productId),
        };
      }

      return {
        ...state,
        items: state.items.map(item =>
          item.product.id === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    }

    case 'CLEAR_CART':
      return { ...state, items: [] };

    default:
      return state;
  }
}

// Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider
export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, { items: [], isLoaded: false });
  // Flag to track if we are syncing to avoid loops
  const [isSyncing, setIsSyncing] = useState(false);

  // Initial Load & Auth Sync
  useEffect(() => {
    let unsubscribe: () => void = () => { };

    const syncCart = async () => {
      // 1. If authenticated and Firebase is available, listen to Firestore
      if (isAuthenticated && user && db) {
        const userCartRef = doc(db, 'users', user.id, 'cart', 'main'); // Using a subcollection or single doc strategy
        // Simplified: Storing cart array in user document or a dedicated cart document
        // Let's store it in a 'carts' collection keyed by userID for separation
        // OR inside the user doc: users/{uid} field: cartItems

        // Let's use users/{uid} -> field: cartItems for simplicity as per common pattern
        // BUT 'users' collection is managed by UserService. 
        // Let's use a separate logic to avoid conflicts if we can.
        // Actually, updating a field in the user doc is fine. 

        const userRef = doc(db, 'users', user.id);

        unsubscribe = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const remoteItems = data.cartItems as CartItem[] || [];

            // We only update state if it differs significantly to avoid local jitter
            // But for now, let's just trust remote as source of truth when logged in
            if (!isSyncing) {
              dispatch({ type: 'LOAD_CART', payload: remoteItems });
            }
          } else {
            // User doc doesn't exist?
          }
        });

        // MERGE LOGIC: If we have local items and just logged in
        const localSaved = localStorage.getItem(STORAGE_KEY);
        if (localSaved) {
          const localItems = JSON.parse(localSaved) as CartItem[];
          if (localItems.length > 0) {
            // Read current remote to merge
            const docSnap = await getDoc(userRef);
            const remoteItems = docSnap.exists() ? (docSnap.data().cartItems as CartItem[] || []) : [];

            // Simple merge: Local items override or add to remote
            // Only if remote is empty? Or always?
            // A better UX is: add local items to remote.

            const mergedItems = [...remoteItems];
            localItems.forEach(lItem => {
              const existing = mergedItems.find(r => r.product.id === lItem.product.id);
              if (existing) {
                existing.quantity += lItem.quantity;
              } else {
                mergedItems.push(lItem);
              }
            });

            // Save merged to firestore
            await setDoc(userRef, { cartItems: mergedItems }, { merge: true });

            // Clear local
            localStorage.removeItem(STORAGE_KEY);
          }
        }

      } else {
        // 2. If guest, use localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        const items = saved ? JSON.parse(saved) : [];
        dispatch({ type: 'LOAD_CART', payload: items });
      }
    };

    syncCart();

    return () => unsubscribe();
  }, [isAuthenticated, user]);

  // Save changes
  useEffect(() => {
    if (!state.isLoaded) return;

    const saveChanges = async () => {
      setIsSyncing(true);
      if (isAuthenticated && user && db) {
        // Save to Firestore
        try {
          const userRef = doc(db, 'users', user.id);
          await setDoc(userRef, { cartItems: state.items }, { merge: true });
        } catch {
          // Save failed silently
        }
      } else {
        // Save to LocalStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
        window.dispatchEvent(new Event('cartChanged'));
      }
      setTimeout(() => setIsSyncing(false), 500);
    };

    // Debounce or just save
    const timeout = setTimeout(saveChanges, 500);
    return () => clearTimeout(timeout);

  }, [state.items, isAuthenticated, user, state.isLoaded]);

  // Actions
  const addItem = (product: CartProduct) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  };

  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  // Computed values
  const validItems = state.items.filter(item => item && item.product && typeof item.product.price === 'number');
  const totalItems = validItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = validItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;

  return (
    <CartContext.Provider
      value={{
        items: validItems,
        isLoaded: state.isLoaded,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        shipping,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Hook
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
