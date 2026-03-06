import React from 'react';
import { renderHook } from '@testing-library/react';
import { PricingProvider, usePricing } from './PricingContext';

// --- Mocks ---

const mockAuthValue = {
  user: null as { id: string; name: string; email: string; role: string } | null,
  isAuthenticated: false,
  isLoaded: true,
  isAdmin: false,
  isManager: false,
  isClient: false,
  login: jest.fn(),
  register: jest.fn(),
  resetPassword: jest.fn(),
  logout: jest.fn(),
  updateUser: jest.fn(),
  getManagers: jest.fn(),
};

jest.mock('./AuthContext', () => ({
  useAuth: () => mockAuthValue,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <PricingProvider>{children}</PricingProvider>;
}

describe('PricingContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: guest (no auth)
    mockAuthValue.user = null;
    mockAuthValue.isAuthenticated = false;
    mockAuthValue.isManager = false;
    mockAuthValue.isClient = false;
    mockAuthValue.isAdmin = false;
  });

  describe('Estado inicial', () => {
    it('no debe tener precios de gestor cuando el usuario no esta autenticado', () => {
      const { result } = renderHook(() => usePricing(), { wrapper });

      expect(result.current.isManagerPricing).toBe(false);
    });

    it('no debe tener precios de gestor para un cliente autenticado', () => {
      mockAuthValue.user = { id: 'c1', name: 'Client', email: 'c@test.com', role: 'client' };
      mockAuthValue.isAuthenticated = true;
      mockAuthValue.isClient = true;
      mockAuthValue.isManager = false;

      const { result } = renderHook(() => usePricing(), { wrapper });

      expect(result.current.isManagerPricing).toBe(false);
    });

    it('debe tener precios de gestor para un manager autenticado', () => {
      mockAuthValue.user = { id: 'm1', name: 'Manager', email: 'm@test.com', role: 'manager' };
      mockAuthValue.isAuthenticated = true;
      mockAuthValue.isManager = true;

      const { result } = renderHook(() => usePricing(), { wrapper });

      expect(result.current.isManagerPricing).toBe(true);
    });
  });

  describe('getPrice', () => {
    it('debe retornar el precio base para un usuario no autenticado', () => {
      const { result } = renderHook(() => usePricing(), { wrapper });

      const price = result.current.getPrice('1');
      expect(price).toBe(29.99);
    });

    it('debe retornar el precio de gestor para un manager autenticado', () => {
      mockAuthValue.user = { id: 'm1', name: 'Manager', email: 'm@test.com', role: 'manager' };
      mockAuthValue.isAuthenticated = true;
      mockAuthValue.isManager = true;

      const { result } = renderHook(() => usePricing(), { wrapper });

      const price = result.current.getPrice('1');
      expect(price).toBe(19.99);
    });

    it('debe usar el precio por defecto para un producto no definido', () => {
      const { result } = renderHook(() => usePricing(), { wrapper });

      const price = result.current.getPrice('unknown-id');
      expect(price).toBe(29.99); // default basePrice
    });

    it('debe retornar el basePrice proporcionado para clientes cuando se pasa como argumento', () => {
      const { result } = renderHook(() => usePricing(), { wrapper });

      const price = result.current.getPrice('1', 100);
      expect(price).toBe(100);
    });

    it('debe calcular el precio de gestor basado en el basePrice proporcionado', () => {
      mockAuthValue.user = { id: 'm1', name: 'Manager', email: 'm@test.com', role: 'manager' };
      mockAuthValue.isAuthenticated = true;
      mockAuthValue.isManager = true;

      const { result } = renderHook(() => usePricing(), { wrapper });

      // Product '1' has 33% discount
      const price = result.current.getPrice('1', 100);
      expect(price).toBe(67); // 100 * (1 - 33/100) = 67
    });
  });

  describe('getDiscount', () => {
    it('debe retornar 0 para usuarios no gestores', () => {
      const { result } = renderHook(() => usePricing(), { wrapper });

      expect(result.current.getDiscount('1')).toBe(0);
    });

    it('debe retornar el porcentaje de descuento para gestores', () => {
      mockAuthValue.user = { id: 'm1', name: 'Manager', email: 'm@test.com', role: 'manager' };
      mockAuthValue.isAuthenticated = true;
      mockAuthValue.isManager = true;

      const { result } = renderHook(() => usePricing(), { wrapper });

      expect(result.current.getDiscount('1')).toBe(33);
      expect(result.current.getDiscount('2')).toBe(30);
    });

    it('debe retornar el descuento por defecto para productos no definidos', () => {
      mockAuthValue.user = { id: 'm1', name: 'Manager', email: 'm@test.com', role: 'manager' };
      mockAuthValue.isAuthenticated = true;
      mockAuthValue.isManager = true;

      const { result } = renderHook(() => usePricing(), { wrapper });

      expect(result.current.getDiscount('unknown-product')).toBe(30);
    });
  });

  describe('formatPrice', () => {
    it('debe formatear el precio con simbolo de dolar y dos decimales', () => {
      const { result } = renderHook(() => usePricing(), { wrapper });

      expect(result.current.formatPrice(29.99)).toBe('$29.99');
      expect(result.current.formatPrice(100)).toBe('$100.00');
      expect(result.current.formatPrice(0)).toBe('$0.00');
      expect(result.current.formatPrice(9.9)).toBe('$9.90');
    });
  });

  describe('getPriceInfo', () => {
    it('debe retornar informacion completa de precios para un cliente', () => {
      const { result } = renderHook(() => usePricing(), { wrapper });

      const info = result.current.getPriceInfo('1');

      expect(info.currentPrice).toBe(29.99);
      expect(info.originalPrice).toBe(29.99);
      expect(info.discount).toBe(0);
      expect(info.isDiscounted).toBe(false);
    });

    it('debe retornar informacion de precios con descuento para un gestor', () => {
      mockAuthValue.user = { id: 'm1', name: 'Manager', email: 'm@test.com', role: 'manager' };
      mockAuthValue.isAuthenticated = true;
      mockAuthValue.isManager = true;

      const { result } = renderHook(() => usePricing(), { wrapper });

      const info = result.current.getPriceInfo('1');

      expect(info.currentPrice).toBe(19.99);
      expect(info.originalPrice).toBe(29.99);
      expect(info.discount).toBe(33);
      expect(info.isDiscounted).toBe(true);
    });

    it('debe usar el basePrice proporcionado como precio original', () => {
      const { result } = renderHook(() => usePricing(), { wrapper });

      const info = result.current.getPriceInfo('1', 50);

      expect(info.originalPrice).toBe(50);
      expect(info.currentPrice).toBe(50);
    });

    it('debe calcular descuento sobre basePrice proporcionado para gestores', () => {
      mockAuthValue.user = { id: 'm1', name: 'Manager', email: 'm@test.com', role: 'manager' };
      mockAuthValue.isAuthenticated = true;
      mockAuthValue.isManager = true;

      const { result } = renderHook(() => usePricing(), { wrapper });

      // Product '1' has 33% discount
      const info = result.current.getPriceInfo('1', 100);

      expect(info.originalPrice).toBe(100);
      expect(info.currentPrice).toBe(67);
      expect(info.discount).toBe(33);
      expect(info.isDiscounted).toBe(true);
    });
  });

  describe('Error cuando no hay Provider', () => {
    it('debe lanzar error al usar usePricing fuera del PricingProvider', () => {
      expect(() => {
        renderHook(() => usePricing());
      }).toThrow('usePricing must be used within a PricingProvider');
    });
  });
});
