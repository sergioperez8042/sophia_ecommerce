import React from 'react';
import { render, screen } from '@testing-library/react';
import { StoreProvider } from './index';

// --- Mocks for all sub-providers ---

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: null,
  auth: null,
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((_auth: unknown, callback: (user: null) => void) => {
    callback(null);
    return jest.fn();
  }),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({ exists: () => false }),
  setDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({ docs: [], size: 0 }),
  onSnapshot: jest.fn(() => jest.fn()),
  orderBy: jest.fn(),
  Timestamp: { now: jest.fn(() => ({ toDate: () => new Date() })) },
}));

jest.mock('@/lib/firestore-services', () => ({
  ProductService: {
    getAll: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  CategoryService: {
    getAll: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
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

const mockMatchMedia = jest.fn().mockReturnValue({
  matches: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
});
Object.defineProperty(window, 'matchMedia', { value: mockMatchMedia });

describe('StoreProvider', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Composicion de proveedores', () => {
    it('debe renderizar los hijos correctamente', () => {
      render(
        <StoreProvider>
          <div data-testid="child">Contenido hijo</div>
        </StoreProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Contenido hijo')).toBeInTheDocument();
    });

    it('debe renderizar multiples hijos', () => {
      render(
        <StoreProvider>
          <div data-testid="child-1">Primero</div>
          <div data-testid="child-2">Segundo</div>
        </StoreProvider>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('debe renderizar sin errores con un hijo de texto', () => {
      render(
        <StoreProvider>
          Texto simple
        </StoreProvider>
      );

      expect(screen.getByText('Texto simple')).toBeInTheDocument();
    });
  });

  describe('Acceso a los contextos desde componentes hijos', () => {
    it('debe permitir acceder a useCart dentro del StoreProvider', () => {
      // We import useCart from the barrel export to verify re-exports work
      const { useCart } = require('./index');

      function TestComponent() {
        const cart = useCart();
        return <div data-testid="cart-total">{cart.totalItems}</div>;
      }

      render(
        <StoreProvider>
          <TestComponent />
        </StoreProvider>
      );

      expect(screen.getByTestId('cart-total')).toBeInTheDocument();
    });

    it('debe permitir acceder a useWishlist dentro del StoreProvider', () => {
      const { useWishlist } = require('./index');

      function TestComponent() {
        const wishlist = useWishlist();
        return <div data-testid="wishlist-count">{wishlist.totalItems}</div>;
      }

      render(
        <StoreProvider>
          <TestComponent />
        </StoreProvider>
      );

      expect(screen.getByTestId('wishlist-count')).toBeInTheDocument();
    });

    it('debe permitir acceder a useTheme dentro del StoreProvider', () => {
      const { useTheme } = require('./index');

      function TestComponent() {
        const theme = useTheme();
        return <div data-testid="theme">{theme.theme}</div>;
      }

      render(
        <StoreProvider>
          <TestComponent />
        </StoreProvider>
      );

      expect(screen.getByTestId('theme')).toBeInTheDocument();
    });

    it('debe permitir acceder a useAuth dentro del StoreProvider', () => {
      const { useAuth } = require('./index');

      function TestComponent() {
        const auth = useAuth();
        return <div data-testid="auth">{auth.isAuthenticated ? 'si' : 'no'}</div>;
      }

      render(
        <StoreProvider>
          <TestComponent />
        </StoreProvider>
      );

      expect(screen.getByTestId('auth')).toHaveTextContent('no');
    });

    it('debe permitir acceder a usePricing dentro del StoreProvider', () => {
      const { usePricing } = require('./index');

      function TestComponent() {
        const pricing = usePricing();
        return <div data-testid="pricing">{pricing.formatPrice(10)}</div>;
      }

      render(
        <StoreProvider>
          <TestComponent />
        </StoreProvider>
      );

      expect(screen.getByTestId('pricing')).toHaveTextContent('$10.00');
    });

    it('debe permitir acceder a useProducts dentro del StoreProvider', () => {
      const { useProducts } = require('./index');

      function TestComponent() {
        const products = useProducts();
        return <div data-testid="products-count">{products.products.length}</div>;
      }

      render(
        <StoreProvider>
          <TestComponent />
        </StoreProvider>
      );

      expect(screen.getByTestId('products-count')).toHaveTextContent('0');
    });

    it('debe permitir acceder a useCategories dentro del StoreProvider', () => {
      const { useCategories } = require('./index');

      function TestComponent() {
        const categories = useCategories();
        return <div data-testid="cats-count">{categories.categories.length}</div>;
      }

      render(
        <StoreProvider>
          <TestComponent />
        </StoreProvider>
      );

      expect(screen.getByTestId('cats-count')).toHaveTextContent('0');
    });
  });
});
