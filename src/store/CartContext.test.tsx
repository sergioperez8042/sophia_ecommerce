import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CartProvider, useCart, CartProduct } from './CartContext';

// --- Mocks ---

// Mock AuthContext - guest by default
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

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn()),
}));

jest.mock('@/lib/firebase', () => ({
  db: null,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.dispatchEvent
const mockDispatchEvent = jest.fn();
Object.defineProperty(window, 'dispatchEvent', { value: mockDispatchEvent, writable: true });

// --- Test Helpers ---

function wrapper({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

const createProduct = (overrides: Partial<CartProduct> = {}): CartProduct => ({
  id: 'prod-1',
  name: 'Crema Facial',
  price: 29.99,
  image: '/img/crema.jpg',
  ...overrides,
});

describe('CartContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset auth mock to guest
    mockAuthValue.user = null;
    mockAuthValue.isAuthenticated = false;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Estado inicial', () => {
    it('debe iniciar con un carrito vacio', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.items).toEqual([]);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.subtotal).toBe(0);
    });

    it('debe cargar items desde localStorage para usuarios invitados', async () => {
      const savedItems = [
        { product: createProduct(), quantity: 2 },
      ];
      localStorageMock.setItem('sophia_cart', JSON.stringify(savedItems));

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].product.id).toBe('prod-1');
      expect(result.current.items[0].quantity).toBe(2);
    });
  });

  describe('addItem', () => {
    it('debe agregar un producto nuevo al carrito', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem(createProduct());
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].product.name).toBe('Crema Facial');
      expect(result.current.items[0].quantity).toBe(1);
    });

    it('debe incrementar la cantidad al agregar un producto existente', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      const product = createProduct();

      act(() => {
        result.current.addItem(product);
      });

      act(() => {
        result.current.addItem(product);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(2);
    });

    it('debe agregar multiples productos diferentes al carrito', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem(createProduct({ id: 'prod-1', name: 'Crema', price: 29.99 }));
      });

      act(() => {
        result.current.addItem(createProduct({ id: 'prod-2', name: 'Serum', price: 45.99 }));
      });

      expect(result.current.items).toHaveLength(2);
    });
  });

  describe('removeItem', () => {
    it('debe eliminar un producto del carrito por su ID', async () => {
      const savedItems = [
        { product: createProduct({ id: 'prod-1' }), quantity: 1 },
        { product: createProduct({ id: 'prod-2', name: 'Serum' }), quantity: 1 },
      ];
      localStorageMock.setItem('sophia_cart', JSON.stringify(savedItems));

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.removeItem('prod-1');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].product.id).toBe('prod-2');
    });

    it('no debe hacer nada al eliminar un producto que no existe', async () => {
      const savedItems = [
        { product: createProduct(), quantity: 1 },
      ];
      localStorageMock.setItem('sophia_cart', JSON.stringify(savedItems));

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.removeItem('nonexistent');
      });

      expect(result.current.items).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    it('debe actualizar la cantidad de un producto', async () => {
      const savedItems = [
        { product: createProduct(), quantity: 1 },
      ];
      localStorageMock.setItem('sophia_cart', JSON.stringify(savedItems));

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.updateQuantity('prod-1', 5);
      });

      expect(result.current.items[0].quantity).toBe(5);
    });

    it('debe eliminar el producto si la cantidad es 0 o menor', async () => {
      const savedItems = [
        { product: createProduct(), quantity: 2 },
      ];
      localStorageMock.setItem('sophia_cart', JSON.stringify(savedItems));

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.updateQuantity('prod-1', 0);
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('debe eliminar el producto si la cantidad es negativa', async () => {
      const savedItems = [
        { product: createProduct(), quantity: 1 },
      ];
      localStorageMock.setItem('sophia_cart', JSON.stringify(savedItems));

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.updateQuantity('prod-1', -1);
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('debe vaciar completamente el carrito', async () => {
      const savedItems = [
        { product: createProduct({ id: 'prod-1' }), quantity: 1 },
        { product: createProduct({ id: 'prod-2', name: 'Serum' }), quantity: 3 },
      ];
      localStorageMock.setItem('sophia_cart', JSON.stringify(savedItems));

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.subtotal).toBe(0);
    });

    it('no debe fallar al vaciar un carrito ya vacio', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('Valores calculados', () => {
    it('debe calcular totalItems correctamente', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem(createProduct({ id: 'p1', price: 10 }));
      });

      act(() => {
        result.current.addItem(createProduct({ id: 'p1', price: 10 }));
      });

      act(() => {
        result.current.addItem(createProduct({ id: 'p2', price: 20 }));
      });

      expect(result.current.totalItems).toBe(3);
    });

    it('debe calcular el subtotal correctamente', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem(createProduct({ id: 'p1', price: 10 }));
      });

      act(() => {
        result.current.addItem(createProduct({ id: 'p2', price: 20 }));
      });

      expect(result.current.subtotal).toBe(30);
    });

    it('debe cobrar envio cuando el subtotal es menor a 50', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem(createProduct({ id: 'p1', price: 10 }));
      });

      expect(result.current.shipping).toBe(5.99);
      expect(result.current.total).toBe(10 + 5.99);
    });

    it('debe ofrecer envio gratis cuando el subtotal es >= 50', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem(createProduct({ id: 'p1', price: 50 }));
      });

      expect(result.current.shipping).toBe(0);
      expect(result.current.total).toBe(50);
    });

    it('debe calcular el total como subtotal + envio', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem(createProduct({ id: 'p1', price: 25 }));
      });

      act(() => {
        result.current.addItem(createProduct({ id: 'p2', price: 15 }));
      });

      // subtotal = 40, shipping = 5.99, total = 45.99
      expect(result.current.subtotal).toBe(40);
      expect(result.current.shipping).toBe(5.99);
      expect(result.current.total).toBe(45.99);
    });
  });

  describe('Persistencia en localStorage (modo invitado)', () => {
    it('debe guardar el carrito en localStorage despues de cambios', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem(createProduct());
      });

      // Advance timers to trigger the debounced save
      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'sophia_cart',
        expect.any(String)
      );
    });
  });

  describe('Casos extremos', () => {
    it('debe filtrar items invalidos al renderizar', async () => {
      // Store items with invalid data in localStorage
      const savedItems = [
        { product: createProduct({ id: 'valid', price: 10 }), quantity: 1 },
        { product: null, quantity: 1 },
        null,
      ];
      localStorageMock.setItem('sophia_cart', JSON.stringify(savedItems));

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      // Only valid items should appear
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].product.id).toBe('valid');
    });
  });

  describe('Error cuando no hay Provider', () => {
    it('debe lanzar error al usar useCart fuera del CartProvider', () => {
      // We need to un-mock AuthContext temporarily for this test
      // Actually the error happens because CartContext is undefined, not AuthContext
      expect(() => {
        renderHook(() => useCart());
      }).toThrow('useCart must be used within a CartProvider');
    });
  });
});
