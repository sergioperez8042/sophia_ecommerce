import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CartPage from './page';

// --- Mocks ---

const mockUpdateQuantity = jest.fn();
const mockRemoveItem = jest.fn();
const mockClearCart = jest.fn();
const mockAddItem = jest.fn();

let mockCartReturn: {
  items: Array<{
    product: {
      id: string;
      name: string;
      price: number;
      originalPrice?: number;
      image: string;
      category?: string;
    };
    quantity: number;
  }>;
  updateQuantity: jest.Mock;
  removeItem: jest.Mock;
  clearCart: jest.Mock;
  addItem: jest.Mock;
  totalItems: number;
  subtotal: number;
  shipping: number;
  total: number;
  isLoaded: boolean;
};

jest.mock('@/store', () => ({
  useCart: () => mockCartReturn,
  useLocation: () => ({
    location: null,
    hasLocation: false,
    hasFullLocation: false,
    setLocation: jest.fn(),
    clearLocation: jest.fn(),
  }),
}));

// Mock del hook de gestor — evita importar firebase-auth (que necesita fetch)
jest.mock('@/hooks/useGestorByLocation', () => ({
  useGestorByLocation: () => ({ gestor: null, loading: false }),
}));

// Mock del LocationPopup completo — su árbol importa firebase-auth
jest.mock('@/components/LocationPopup', () => ({
  __esModule: true,
  default: () => null,
}));

// Mock de order-share — usa APIs del navegador irreversibles
jest.mock('@/lib/order-share', () => ({
  sendOrderViaWhatsApp: jest.fn(),
  generateOrderFileName: () => 'test.pdf',
}));

jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    ...jest.requireActual('framer-motion'),
    LazyMotion: ({ children }: { children: React.ReactNode }) => children,
    domAnimation: {},
    m: new Proxy(
      {},
      {
        get: (_target: object, prop: string) =>
          React.forwardRef((props: Record<string, unknown>, ref: React.Ref<HTMLElement>) => {
            const {
              children,
              initial: _initial,
              animate: _animate,
              exit: _exit,
              transition: _transition,
              variants: _variants,
              whileHover: _whileHover,
              whileTap: _whileTap,
              whileInView: _whileInView,
              viewport: _viewport,
              layout: _layout,
              style,
              ...rest
            } = props;
            return React.createElement(String(prop), { ...rest, style, ref }, children as React.ReactNode);
          }),
      }
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useInView: () => true,
    useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
    useTransform: () => ({ get: () => 1 }),
  };
});

jest.mock('next/link', () => {
  return ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  );
});

jest.mock('next/image', () => {
  return (props: Record<string, unknown>) => {
    const { fill: _fill, priority: _priority, unoptimized: _unoptimized, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img alt="" {...(rest as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  };
});

jest.mock('@/components/ui/product-image', () => {
  return ({ alt }: { alt: string }) => <div data-testid="product-image">{alt}</div>;
});

jest.mock('@/components/ui/breadcrumb', () => {
  return ({ items }: { items: Array<{ label: string }> }) => (
    <nav data-testid="breadcrumb">
      {items.map((item, i) => (
        <span key={i}>{item.label}</span>
      ))}
    </nav>
  );
});

// --- Helpers ---

const sampleItems = [
  {
    product: {
      id: 'prod-1',
      name: 'Crema Facial Natural',
      price: 29.99,
      originalPrice: 39.99,
      image: 'https://example.com/crema.jpg',
      category: 'Rostro',
    },
    quantity: 2,
  },
  {
    product: {
      id: 'prod-2',
      name: 'Sérum de Vitamina C',
      price: 24.5,
      image: 'https://example.com/serum.jpg',
      category: 'Cuidado',
    },
    quantity: 1,
  },
];

function setupEmptyCart() {
  mockCartReturn = {
    items: [],
    updateQuantity: mockUpdateQuantity,
    removeItem: mockRemoveItem,
    clearCart: mockClearCart,
    addItem: mockAddItem,
    totalItems: 0,
    subtotal: 0,
    shipping: 5.99,
    total: 5.99,
    isLoaded: true,
  };
}

function setupLoadingCart() {
  mockCartReturn = {
    items: [],
    updateQuantity: mockUpdateQuantity,
    removeItem: mockRemoveItem,
    clearCart: mockClearCart,
    addItem: mockAddItem,
    totalItems: 0,
    subtotal: 0,
    shipping: 0,
    total: 0,
    isLoaded: false,
  };
}

function setupCartWithItems() {
  const subtotal = 29.99 * 2 + 24.5;
  mockCartReturn = {
    items: sampleItems,
    updateQuantity: mockUpdateQuantity,
    removeItem: mockRemoveItem,
    clearCart: mockClearCart,
    addItem: mockAddItem,
    totalItems: 3,
    subtotal,
    shipping: 0,
    total: subtotal,
    isLoaded: true,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// --- Tests ---

describe('CartPage', () => {
  describe('Estado de carga', () => {
    it('muestra el spinner mientras se carga el carrito', () => {
      setupLoadingCart();
      const { container } = render(<CartPage />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('no muestra contenido del carrito durante la carga', () => {
      setupLoadingCart();
      render(<CartPage />);
      expect(screen.queryByText('Tu Carrito')).not.toBeInTheDocument();
      expect(screen.queryByText('Tu carrito está vacío')).not.toBeInTheDocument();
    });
  });

  describe('Carrito con productos', () => {
    beforeEach(() => {
      setupCartWithItems();
    });

    it('renderiza sin errores con productos', () => {
      render(<CartPage />);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tu Carrito');
    });

    it('muestra la cantidad total de artículos', () => {
      render(<CartPage />);
      expect(screen.getByText(/3 artículos/)).toBeInTheDocument();
    });

    it('muestra el texto singular para un solo artículo', () => {
      mockCartReturn.totalItems = 1;
      render(<CartPage />);
      expect(screen.getByText(/1 artículo$/)).toBeInTheDocument();
    });

    it('muestra los nombres de todos los productos', () => {
      render(<CartPage />);
      expect(screen.getAllByText('Crema Facial Natural').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Sérum de Vitamina C').length).toBeGreaterThanOrEqual(1);
    });

    it('muestra las categorías de los productos', () => {
      render(<CartPage />);
      expect(screen.getByText('Rostro')).toBeInTheDocument();
      expect(screen.getByText('Cuidado')).toBeInTheDocument();
    });

    it('muestra el precio unitario de cada producto', () => {
      render(<CartPage />);
      // Prices render with $ and amount as separate text nodes via template literal
      expect(screen.getAllByText((_, el) => el?.textContent === '$29.99').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText((_, el) => el?.textContent === '$24.50').length).toBeGreaterThanOrEqual(1);
    });

    it('muestra el precio original tachado cuando existe descuento', () => {
      render(<CartPage />);
      expect(screen.getByText('$39.99')).toBeInTheDocument();
    });

    it('muestra el subtotal por línea de producto', () => {
      render(<CartPage />);
      // 29.99 * 2 = 59.98
      expect(screen.getByText('$59.98')).toBeInTheDocument();
    });

    it('muestra la cantidad de cada producto', () => {
      render(<CartPage />);
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('muestra las imágenes de los productos', () => {
      render(<CartPage />);
      const images = screen.getAllByTestId('product-image');
      expect(images).toHaveLength(2);
    });
  });

  describe('Controles de cantidad', () => {
    beforeEach(() => {
      setupCartWithItems();
    });

    it('tiene botones para aumentar y disminuir cantidad', () => {
      render(<CartPage />);
      const decreaseButtons = screen.getAllByLabelText('Disminuir cantidad');
      const increaseButtons = screen.getAllByLabelText('Aumentar cantidad');
      expect(decreaseButtons).toHaveLength(2);
      expect(increaseButtons).toHaveLength(2);
    });

    it('llama a updateQuantity al hacer clic en aumentar', async () => {
      const user = userEvent.setup();
      render(<CartPage />);
      const increaseButtons = screen.getAllByLabelText('Aumentar cantidad');
      await user.click(increaseButtons[0]);
      expect(mockUpdateQuantity).toHaveBeenCalledWith('prod-1', 3);
    });

    it('llama a updateQuantity al hacer clic en disminuir', async () => {
      const user = userEvent.setup();
      render(<CartPage />);
      const decreaseButtons = screen.getAllByLabelText('Disminuir cantidad');
      await user.click(decreaseButtons[0]);
      expect(mockUpdateQuantity).toHaveBeenCalledWith('prod-1', 1);
    });
  });

  describe('Eliminar productos', () => {
    beforeEach(() => {
      setupCartWithItems();
    });

    it('tiene botones de eliminar para cada producto', () => {
      render(<CartPage />);
      const removeButtons = screen.getAllByTitle('Eliminar');
      expect(removeButtons).toHaveLength(2);
    });

    it('llama a removeItem al hacer clic en eliminar', async () => {
      const user = userEvent.setup();
      render(<CartPage />);
      const removeButtons = screen.getAllByTitle('Eliminar');
      await user.click(removeButtons[0]);
      expect(mockRemoveItem).toHaveBeenCalledWith('prod-1');
    });
  });

});
