import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { WishlistProvider, useWishlist } from './WishlistContext';

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

const mockDispatchEvent = jest.fn();
Object.defineProperty(window, 'dispatchEvent', { value: mockDispatchEvent, writable: true });

function wrapper({ children }: { children: React.ReactNode }) {
  return <WishlistProvider>{children}</WishlistProvider>;
}

describe('WishlistContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockAuthValue.user = null;
    mockAuthValue.isAuthenticated = false;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Estado inicial', () => {
    it('debe iniciar con una lista de deseos vacia', async () => {
      const { result } = renderHook(() => useWishlist(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.items).toEqual([]);
      expect(result.current.totalItems).toBe(0);
    });

    it('debe cargar items guardados desde localStorage', async () => {
      const savedItems = ['prod-1', 'prod-2', 'prod-3'];
      localStorageMock.setItem('sophia_wishlist', JSON.stringify(savedItems));

      const { result } = renderHook(() => useWishlist(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.items).toEqual(['prod-1', 'prod-2', 'prod-3']);
      expect(result.current.totalItems).toBe(3);
    });
  });

  describe('addToWishlist', () => {
    it('debe agregar un producto a la lista de deseos', async () => {
      const { result } = renderHook(() => useWishlist(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addToWishlist('prod-1');
      });

      expect(result.current.items).toContain('prod-1');
      expect(result.current.totalItems).toBe(1);
    });

    it('no debe agregar un producto duplicado', async () => {
      const { result } = renderHook(() => useWishlist(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addToWishlist('prod-1');
      });

      act(() => {
        result.current.addToWishlist('prod-1');
      });

      expect(result.current.items).toHaveLength(1);
    });

    it('debe agregar multiples productos diferentes', async () => {
      const { result } = renderHook(() => useWishlist(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addToWishlist('prod-1');
      });

      act(() => {
        result.current.addToWishlist('prod-2');
      });

      act(() => {
        result.current.addToWishlist('prod-3');
      });

      expect(result.current.items).toHaveLength(3);
      expect(result.current.totalItems).toBe(3);
    });
  });

  describe('removeFromWishlist', () => {
    it('debe eliminar un producto de la lista de deseos', async () => {
      localStorageMock.setItem('sophia_wishlist', JSON.stringify(['prod-1', 'prod-2']));

      const { result } = renderHook(() => useWishlist(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.removeFromWishlist('prod-1');
      });

      expect(result.current.items).toEqual(['prod-2']);
      expect(result.current.totalItems).toBe(1);
    });

    it('no debe hacer nada al eliminar un producto que no esta en la lista', async () => {
      localStorageMock.setItem('sophia_wishlist', JSON.stringify(['prod-1']));

      const { result } = renderHook(() => useWishlist(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.removeFromWishlist('nonexistent');
      });

      expect(result.current.items).toEqual(['prod-1']);
    });
  });

  describe('toggleItem', () => {
    it('debe agregar un producto si no esta en la lista', async () => {
      const { result } = renderHook(() => useWishlist(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.toggleItem('prod-1');
      });

      expect(result.current.items).toContain('prod-1');
    });

    it('debe eliminar un producto si ya esta en la lista', async () => {
      localStorageMock.setItem('sophia_wishlist', JSON.stringify(['prod-1']));

      const { result } = renderHook(() => useWishlist(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.toggleItem('prod-1');
      });

      expect(result.current.items).not.toContain('prod-1');
      expect(result.current.items).toHaveLength(0);
    });

    it('debe alternar repetidamente la presencia de un producto', async () => {
      const { result } = renderHook(() => useWishlist(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.toggleItem('prod-1');
      });
      expect(result.current.items).toContain('prod-1');

      act(() => {
        result.current.toggleItem('prod-1');
      });
      expect(result.current.items).not.toContain('prod-1');

      act(() => {
        result.current.toggleItem('prod-1');
      });
      expect(result.current.items).toContain('prod-1');
    });
  });

  describe('isInWishlist', () => {
    it('debe retornar true para un producto que esta en la lista', async () => {
      localStorageMock.setItem('sophia_wishlist', JSON.stringify(['prod-1']));

      const { result } = renderHook(() => useWishlist(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.isInWishlist('prod-1')).toBe(true);
    });

    it('debe retornar false para un producto que no esta en la lista', async () => {
      const { result } = renderHook(() => useWishlist(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.isInWishlist('prod-999')).toBe(false);
    });

    it('debe actualizarse despues de agregar un producto', async () => {
      const { result } = renderHook(() => useWishlist(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.isInWishlist('prod-1')).toBe(false);

      act(() => {
        result.current.addToWishlist('prod-1');
      });

      expect(result.current.isInWishlist('prod-1')).toBe(true);
    });
  });

  describe('Persistencia en localStorage (modo invitado)', () => {
    it('debe guardar cambios en localStorage despues de agregar un item', async () => {
      const { result } = renderHook(() => useWishlist(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addToWishlist('prod-1');
      });

      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'sophia_wishlist',
        expect.any(String)
      );
    });
  });

  describe('Casos extremos', () => {
    it('debe manejar una lista vacia en localStorage correctamente', async () => {
      localStorageMock.setItem('sophia_wishlist', JSON.stringify([]));

      const { result } = renderHook(() => useWishlist(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.items).toEqual([]);
      expect(result.current.totalItems).toBe(0);
    });
  });

  describe('Error cuando no hay Provider', () => {
    it('debe lanzar error al usar useWishlist fuera del WishlistProvider', () => {
      expect(() => {
        renderHook(() => useWishlist());
      }).toThrow('useWishlist must be used within a WishlistProvider');
    });
  });
});
