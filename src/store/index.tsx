"use client";

import React, { ReactNode } from 'react';
import { CartProvider } from './CartContext';
import { WishlistProvider } from './WishlistContext';
import { AuthProvider } from './AuthContext';
import { PricingProvider } from './PricingContext';
import { ProductProvider } from './ProductContext';
import { CategoryProvider } from './CategoryContext';
import { ThemeProvider } from './ThemeContext';
import { CatalogConfigProvider } from './CatalogConfigContext';
import { LocationProvider } from './LocationContext';

export { useCart } from './CartContext';
export { useWishlist } from './WishlistContext';
export { useAuth } from './AuthContext';
export { usePricing } from './PricingContext';
export { useProducts } from './ProductContext';
export { useCategories } from './CategoryContext';
export { useTheme } from './ThemeContext';
export { useCatalogConfig } from './CatalogConfigContext';
export { useLocation } from './LocationContext';
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
              <CatalogConfigProvider>
                <LocationProvider>
                <CartProvider>
                  <WishlistProvider>
                    {children}
                  </WishlistProvider>
                </CartProvider>
              </LocationProvider>
              </CatalogConfigProvider>
            </CategoryProvider>
          </ProductProvider>
        </PricingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
