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
    return <img {...(rest as React.ImgHTMLAttributes<HTMLImageElement>)} />;
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

  describe('Estado vacío', () => {
    beforeEach(() => {
      setupEmptyCart();
    });

    it('renderiza sin errores', () => {
      render(<CartPage />);
      expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
    });

    it('muestra el encabezado correcto para carrito vacío', () => {
      render(<CartPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Tu carrito está vacío');
    });

    it('muestra un mensaje motivacional para explorar productos', () => {
      render(<CartPage />);
      expect(
        screen.getByText('Explora nuestra colección y encuentra tu rutina ideal.')
      ).toBeInTheDocument();
    });

    it('muestra un enlace para ver productos', () => {
      render(<CartPage />);
      const link = screen.getByRole('link', { name: /ver productos/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/products');
    });

    it('muestra el breadcrumb con "Carrito"', () => {
      render(<CartPage />);
      expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
      expect(screen.getByText('Carrito')).toBeInTheDocument();
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

  describe('Resumen del pedido', () => {
    it('muestra la sección de resumen del pedido', () => {
      setupCartWithItems();
      render(<CartPage />);
      expect(screen.getByText('Resumen del pedido')).toBeInTheDocument();
    });

    it('muestra el subtotal', () => {
      setupCartWithItems();
      render(<CartPage />);
      expect(screen.getByText('Subtotal')).toBeInTheDocument();
      // Subtotal value rendered with $ prefix via template literal
      expect(screen.getAllByText((_, el) => el?.textContent === '$84.48').length).toBeGreaterThanOrEqual(1);
    });

    it('muestra "Cortesía" para envío gratuito', () => {
      setupCartWithItems();
      render(<CartPage />);
      expect(screen.getByText('Cortesía')).toBeInTheDocument();
    });

    it('muestra el costo de envío cuando no es gratuito', () => {
      setupCartWithItems();
      mockCartReturn.shipping = 5.99;
      mockCartReturn.total = mockCartReturn.subtotal + 5.99;
      render(<CartPage />);
      expect(screen.getByText('$5.99')).toBeInTheDocument();
    });

    it('muestra el total', () => {
      setupCartWithItems();
      render(<CartPage />);
      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('muestra mensaje de envío gratuito cuando aplica', () => {
      setupCartWithItems();
      mockCartReturn.shipping = 5.99;
      mockCartReturn.total = mockCartReturn.subtotal + 5.99;
      render(<CartPage />);
      expect(
        screen.getByText('Envío gratuito en pedidos superiores a $50')
      ).toBeInTheDocument();
    });
  });

  describe('Navegación', () => {
    it('tiene un enlace para seguir comprando', () => {
      setupCartWithItems();
      render(<CartPage />);
      const link = screen.getByRole('link', { name: /seguir comprando/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/products');
    });

    it('tiene un botón para finalizar compra', () => {
      setupCartWithItems();
      render(<CartPage />);
      const checkoutButton = screen.getByRole('button', { name: /finalizar compra/i });
      expect(checkoutButton).toBeInTheDocument();
    });

    it('el botón de finalizar compra enlaza a /checkout', () => {
      setupCartWithItems();
      render(<CartPage />);
      const checkoutLink = screen.getByRole('link', { name: /finalizar compra/i });
      expect(checkoutLink).toHaveAttribute('href', '/checkout');
    });

    it('los nombres de productos enlazan a sus páginas de detalle', () => {
      setupCartWithItems();
      render(<CartPage />);
      const productLinks = screen.getAllByRole('link', { name: 'Crema Facial Natural' });
      expect(productLinks[0]).toHaveAttribute('href', '/products/prod-1');
    });
  });

  describe('Garantías', () => {
    it('muestra las garantías de envío, devolución y pago', () => {
      setupCartWithItems();
      render(<CartPage />);
      expect(screen.getByText('Envío Express')).toBeInTheDocument();
      expect(screen.getByText('Devolución 30 días')).toBeInTheDocument();
      expect(screen.getByText('Pago Seguro')).toBeInTheDocument();
    });
  });
});
