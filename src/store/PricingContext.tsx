"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Precios base (para clientes)
export interface ProductPricing {
  id: string;
  basePrice: number;      // Precio para cliente final
  managerPrice: number;   // Precio para gestores (con descuento)
  managerDiscount: number; // Porcentaje de descuento para gestores
}

// Mock de precios por producto
const PRODUCT_PRICING: Record<string, ProductPricing> = {
  '1': { id: '1', basePrice: 29.99, managerPrice: 19.99, managerDiscount: 33 },
  '2': { id: '2', basePrice: 45.99, managerPrice: 31.99, managerDiscount: 30 },
  '3': { id: '3', basePrice: 24.99, managerPrice: 16.99, managerDiscount: 32 },
  '4': { id: '4', basePrice: 39.99, managerPrice: 27.99, managerDiscount: 30 },
  '5': { id: '5', basePrice: 54.99, managerPrice: 38.49, managerDiscount: 30 },
  '6': { id: '6', basePrice: 32.99, managerPrice: 22.99, managerDiscount: 30 },
  '7': { id: '7', basePrice: 19.99, managerPrice: 13.99, managerDiscount: 30 },
  '8': { id: '8', basePrice: 64.99, managerPrice: 45.49, managerDiscount: 30 },
  // Default para productos no definidos
  'default': { id: 'default', basePrice: 29.99, managerPrice: 20.99, managerDiscount: 30 },
};

interface PricingContextType {
  getPrice: (productId: string, basePrice?: number) => number;
  getDiscount: (productId: string) => number;
  isManagerPricing: boolean;
  formatPrice: (price: number) => string;
  getPriceInfo: (productId: string, basePrice?: number) => {
    currentPrice: number;
    originalPrice: number;
    discount: number;
    isDiscounted: boolean;
  };
}

const PricingContext = createContext<PricingContextType | undefined>(undefined);

export function PricingProvider({ children }: { children: ReactNode }) {
  const { isManager, isAuthenticated } = useAuth();

  const isManagerPricing = isAuthenticated && isManager;

  const getPrice = (productId: string, basePrice?: number): number => {
    const pricing = PRODUCT_PRICING[productId] || PRODUCT_PRICING['default'];

    if (isManagerPricing) {
      // Si hay un basePrice proporcionado, calcular el precio de gestor
      if (basePrice) {
        return Number((basePrice * (1 - pricing.managerDiscount / 100)).toFixed(2));
      }
      return pricing.managerPrice;
    }

    return basePrice || pricing.basePrice;
  };

  const getDiscount = (productId: string): number => {
    if (!isManagerPricing) return 0;
    const pricing = PRODUCT_PRICING[productId] || PRODUCT_PRICING['default'];
    return pricing.managerDiscount;
  };

  const formatPrice = (price: number): string => {
    return `€${price.toFixed(2)}`;
  };

  const getPriceInfo = (productId: string, basePrice?: number) => {
    const pricing = PRODUCT_PRICING[productId] || PRODUCT_PRICING['default'];
    const originalPrice = basePrice || pricing.basePrice;
    const currentPrice = getPrice(productId, basePrice);
    const discount = isManagerPricing ? pricing.managerDiscount : 0;

    return {
      currentPrice,
      originalPrice,
      discount,
      isDiscounted: isManagerPricing && discount > 0,
    };
  };

  const value: PricingContextType = {
    getPrice,
    getDiscount,
    isManagerPricing,
    formatPrice,
    getPriceInfo,
  };

  return (
    <PricingContext.Provider value={value}>
      {children}
    </PricingContext.Provider>
  );
}

export function usePricing() {
  const context = useContext(PricingContext);
  if (context === undefined) {
    throw new Error('usePricing must be used within a PricingProvider');
  }
  return context;
}
