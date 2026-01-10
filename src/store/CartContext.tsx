"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

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
      // Filter out any invalid items first
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
  const [state, dispatch] = useReducer(cartReducer, { items: [], isLoaded: false });

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filter out invalid items
        const validItems = Array.isArray(parsed)
          ? parsed.filter((item: any) =>
            item &&
            item.product &&
            typeof item.product === 'object' &&
            item.product.id &&
            typeof item.product.price === 'number' &&
            typeof item.quantity === 'number'
          )
          : [];
        dispatch({ type: 'LOAD_CART', payload: validItems });
      } else {
        dispatch({ type: 'LOAD_CART', payload: [] });
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEY);
      dispatch({ type: 'LOAD_CART', payload: [] });
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (state.isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
      window.dispatchEvent(new Event('cartChanged'));
    }
  }, [state.items, state.isLoaded]);

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

  // Computed values - filter out invalid items
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
