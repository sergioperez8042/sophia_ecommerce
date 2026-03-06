"use client";

import React, { ReactNode } from 'react';
import { CartProvider } from './CartContext';
import { WishlistProvider } from './WishlistContext';
import { AuthProvider } from './AuthContext';
import { PricingProvider } from './PricingContext';
import { ProductProvider } from './ProductContext';
import { CategoryProvider } from './CategoryContext';
import { ThemeProvider } from './ThemeContext';

export { useCart } from './CartContext';
export { useWishlist } from './WishlistContext';
export { useAuth } from './AuthContext';
export { usePricing } from './PricingContext';
export { useProducts } from './ProductContext';
export { useCategories } from './CategoryContext';
export { useTheme } from './ThemeContext';
export type { User, RegisterData } from './AuthContext';

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
}
