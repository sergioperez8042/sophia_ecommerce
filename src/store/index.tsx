"use client";

import React, { ReactNode } from 'react';
import { CartProvider } from './CartContext';
import { WishlistProvider } from './WishlistContext';
import { AuthProvider } from './AuthContext';
import { PricingProvider } from './PricingContext';
import { ProductProvider } from './ProductContext';

import { CategoryProvider } from './CategoryContext';

export { useCart, CartProvider } from './CartContext';
export { useWishlist, WishlistProvider } from './WishlistContext';
export { useAuth, AuthProvider } from './AuthContext';
export { usePricing, PricingProvider } from './PricingContext';
export { useManager, ManagerProvider, AVAILABLE_MANAGERS } from './ManagerContext';
export { useProducts, ProductProvider } from './ProductContext';
export { useCategories, CategoryProvider } from './CategoryContext';
export type { CartProduct, CartItem } from './CartContext';
export type { WishlistProduct } from './WishlistContext';
export type { User, UserRole, RegisterData } from './AuthContext';
export type { Manager } from './ManagerContext';

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  return (
    <AuthProvider>
      <PricingProvider>
        <ProductProvider>
          <CategoryProvider>
            <CartProvider>
              <WishlistProvider>
                {children}
              </WishlistProvider>
            </CartProvider>
          </CategoryProvider>
        </ProductProvider>
      </PricingProvider>
    </AuthProvider>
  );
}
