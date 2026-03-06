import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WishlistPage from './page';

// --- Mocks ---

const mockRemoveFromWishlist = jest.fn();
const mockAddToCart = jest.fn();

let mockWishlistReturn: {
  items: string[];
  removeFromWishlist: jest.Mock;
  isLoaded: boolean;
  addToWishlist: jest.Mock;
  toggleItem: jest.Mock;
  isInWishlist: (id: string) => boolean;
  totalItems: number;
};

let mockProductsReturn: {
  products: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    category_id: string;
    image: string;
    rating: number;
    reviews_count: number;
    tags: string[];
    ingredients: string[];
    active: boolean;
    created_date: string;
    featured: boolean;
  }>;
  isLoading: boolean;
  error: string | null;
};

let mockCartReturn: {
  addItem: jest.Mock;
  items: Array<unknown>;
  removeItem: jest.Mock;
  updateQuantity: jest.Mock;
  clearCart: jest.Mock;
  totalItems: number;
  subtotal: number;
  shipping: number;
  total: number;
  isLoaded: boolean;
};

jest.mock('@/store', () => ({
  useWishlist: () => mockWishlistReturn,
  useProducts: () => mockProductsReturn,
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

const sampleProducts = [
  {
    id: 'p1',
    name: 'Crema Hidratante',
    description: 'Crema natural para piel seca',
    price: 19.99,
    category_id: 'cat-1',
    image: 'https://example.com/crema.jpg',
    rating: 4.5,
    reviews_count: 12,
    tags: ['natural'],
    ingredients: ['aloe vera'],
    active: true,
    created_date: '2024-01-01',
    featured: false,
  },
  {
    id: 'p2',
    name: 'Aceite Esencial',
    description: 'Aceite puro de lavanda',
    price: 14.5,
    category_id: 'cat-2',
    image: 'https://example.com/aceite.jpg',
    rating: 4.8,
    reviews_count: 25,
    tags: ['orgánico'],
    ingredients: ['lavanda'],
    active: true,
    created_date: '2024-02-01',
    featured: true,
  },
  {
    id: 'p3',
    name: 'Jabón Artesanal',
    description: 'Jabón hecho a mano con miel',
    price: 8.99,
    category_id: 'cat-1',
    image: 'https://example.com/jabon.jpg',
    rating: 4.2,
    reviews_count: 8,
    tags: ['artesanal'],
    ingredients: ['miel'],
    active: false,
    created_date: '2024-03-01',
    featured: false,
  },
];

function setupLoading() {
  mockWishlistReturn = {
    items: ['p1'],
    removeFromWishlist: mockRemoveFromWishlist,
    isLoaded: false,
    addToWishlist: jest.fn(),
    toggleItem: jest.fn(),
    isInWishlist: (id: string) => ['p1'].includes(id),
    totalItems: 1,
  };
  mockProductsReturn = {
    products: sampleProducts,
    isLoading: true,
    error: null,
  };
  mockCartReturn = {
    addItem: mockAddToCart,
    items: [],
    removeItem: jest.fn(),
    updateQuantity: jest.fn(),
    clearCart: jest.fn(),
    totalItems: 0,
    subtotal: 0,
    shipping: 0,
    total: 0,
    isLoaded: true,
  };
}

function setupEmptyWishlist() {
  mockWishlistReturn = {
    items: [],
    removeFromWishlist: mockRemoveFromWishlist,
    isLoaded: true,
    addToWishlist: jest.fn(),
    toggleItem: jest.fn(),
    isInWishlist: () => false,
    totalItems: 0,
  };
  mockProductsReturn = {
    products: sampleProducts,
    isLoading: false,
    error: null,
  };
  mockCartReturn = {
    addItem: mockAddToCart,
    items: [],
    removeItem: jest.fn(),
    updateQuantity: jest.fn(),
    clearCart: jest.fn(),
    totalItems: 0,
    subtotal: 0,
    shipping: 0,
    total: 0,
    isLoaded: true,
  };
}

function setupWishlistWithItems() {
  mockWishlistReturn = {
    items: ['p1', 'p2', 'p3'],
    removeFromWishlist: mockRemoveFromWishlist,
    isLoaded: true,
    addToWishlist: jest.fn(),
    toggleItem: jest.fn(),
    isInWishlist: (id: string) => ['p1', 'p2', 'p3'].includes(id),
    totalItems: 3,
  };
  mockProductsReturn = {
    products: sampleProducts,
    isLoading: false,
    error: null,
  };
  mockCartReturn = {
    addItem: mockAddToCart,
    items: [],
    removeItem: jest.fn(),
    updateQuantity: jest.fn(),
    clearCart: jest.fn(),
    totalItems: 0,
    subtotal: 0,
    shipping: 0,
    total: 0,
    isLoaded: true,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// --- Tests ---

describe('WishlistPage', () => {
  describe('Estado de carga', () => {
    it('muestra el spinner mientras se carga', () => {
      setupLoading();
      const { container } = render(<WishlistPage />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('no muestra contenido de favoritos durante la carga', () => {
      setupLoading();
      render(<WishlistPage />);
      expect(screen.queryByText('Mis Favoritos')).not.toBeInTheDocument();
      expect(screen.queryByText(/Tu lista de favoritos está vacía/)).not.toBeInTheDocument();
    });
  });

  describe('Estado vacío', () => {
    beforeEach(() => {
      setupEmptyWishlist();
    });

    it('renderiza sin errores', () => {
      render(<WishlistPage />);
      expect(screen.getByText('Tu lista de favoritos está vacía')).toBeInTheDocument();
    });

    it('muestra el encabezado correcto para lista vacía', () => {
      render(<WishlistPage />);
      const heading = screen.getByRole('heading', { name: /tu lista de favoritos está vacía/i });
      expect(heading).toBeInTheDocument();
    });

    it('muestra un mensaje motivacional', () => {
      render(<WishlistPage />);
      expect(
        screen.getByText('Explora nuestros productos y guarda tus favoritos aquí.')
      ).toBeInTheDocument();
    });

    it('muestra un botón para explorar productos', () => {
      render(<WishlistPage />);
      const button = screen.getByRole('button', { name: /explorar productos/i });
      expect(button).toBeInTheDocument();
    });

    it('el botón de explorar enlaza a /products', () => {
      render(<WishlistPage />);
      const link = screen.getByRole('link', { name: /explorar productos/i });
      expect(link).toHaveAttribute('href', '/products');
    });

    it('muestra el breadcrumb con "Lista de Favoritos"', () => {
      render(<WishlistPage />);
      expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
      expect(screen.getByText('Lista de Favoritos')).toBeInTheDocument();
    });
  });

  describe('Lista con productos', () => {
    beforeEach(() => {
      setupWishlistWithItems();
    });

    it('renderiza sin errores con productos', () => {
      render(<WishlistPage />);
      expect(screen.getByRole('heading', { name: /mis favoritos/i })).toBeInTheDocument();
    });

    it('muestra el conteo de productos en el encabezado', () => {
      render(<WishlistPage />);
      expect(screen.getByText(/3 productos guardados/)).toBeInTheDocument();
    });

    it('muestra el badge con el conteo de productos', () => {
      render(<WishlistPage />);
      expect(screen.getByText('3 productos')).toBeInTheDocument();
    });

    it('muestra los nombres de todos los productos', () => {
      render(<WishlistPage />);
      // Product names appear in both the image mock (alt text) and the heading
      expect(screen.getAllByText('Crema Hidratante').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Aceite Esencial').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Jabón Artesanal').length).toBeGreaterThanOrEqual(1);
    });

    it('muestra las descripciones de los productos', () => {
      render(<WishlistPage />);
      expect(screen.getByText('Crema natural para piel seca')).toBeInTheDocument();
      expect(screen.getByText('Aceite puro de lavanda')).toBeInTheDocument();
    });

    it('muestra los precios de los productos', () => {
      render(<WishlistPage />);
      expect(screen.getByText('$19.99')).toBeInTheDocument();
      expect(screen.getByText('$14.50')).toBeInTheDocument();
      expect(screen.getByText('$8.99')).toBeInTheDocument();
    });

    it('muestra el estado de disponibilidad "En stock"', () => {
      render(<WishlistPage />);
      const inStockBadges = screen.getAllByText('En stock');
      expect(inStockBadges).toHaveLength(2);
    });

    it('muestra el estado "No disponible" para productos inactivos', () => {
      render(<WishlistPage />);
      expect(screen.getByText('No disponible')).toBeInTheDocument();
    });

    it('muestra las imágenes de los productos', () => {
      render(<WishlistPage />);
      const images = screen.getAllByTestId('product-image');
      expect(images).toHaveLength(3);
    });
  });

  describe('Botones de acción por producto', () => {
    beforeEach(() => {
      setupWishlistWithItems();
    });

    it('muestra botón "Agregar al Carrito" para cada producto', () => {
      render(<WishlistPage />);
      const addButtons = screen.getAllByRole('button', { name: /agregar al carrito/i });
      expect(addButtons).toHaveLength(3);
    });

    it('el botón de agregar al carrito está deshabilitado para productos inactivos', () => {
      render(<WishlistPage />);
      const addButtons = screen.getAllByRole('button', { name: /agregar al carrito/i });
      // El tercer producto (Jabón Artesanal) está inactivo
      expect(addButtons[2]).toBeDisabled();
    });

    it('llama a addToCart al hacer clic en "Agregar al Carrito"', async () => {
      const user = userEvent.setup();
      render(<WishlistPage />);
      const addButtons = screen.getAllByRole('button', { name: /agregar al carrito/i });
      await user.click(addButtons[0]);
      expect(mockAddToCart).toHaveBeenCalledWith(sampleProducts[0]);
    });

    it('muestra botón "Ver Detalles" para cada producto', () => {
      render(<WishlistPage />);
      const detailButtons = screen.getAllByRole('button', { name: /ver detalles/i });
      expect(detailButtons).toHaveLength(3);
    });

    it('el botón "Ver Detalles" enlaza a la página del producto', () => {
      render(<WishlistPage />);
      const detailLinks = screen.getAllByRole('link', { name: /ver detalles/i });
      expect(detailLinks[0]).toHaveAttribute('href', '/products/p1');
      expect(detailLinks[1]).toHaveAttribute('href', '/products/p2');
    });
  });

  describe('Eliminar de favoritos', () => {
    beforeEach(() => {
      setupWishlistWithItems();
    });

    it('muestra botones de eliminar para cada producto', () => {
      render(<WishlistPage />);
      const removeButtons = screen.getAllByTitle('Eliminar producto');
      expect(removeButtons).toHaveLength(3);
    });

    it('llama a removeFromWishlist al hacer clic en eliminar', async () => {
      const user = userEvent.setup();
      render(<WishlistPage />);
      const removeButtons = screen.getAllByTitle('Eliminar producto');
      await user.click(removeButtons[0]);
      expect(mockRemoveFromWishlist).toHaveBeenCalledWith('p1');
    });
  });

  describe('Navegación', () => {
    it('muestra enlace para "Seguir Explorando"', () => {
      setupWishlistWithItems();
      render(<WishlistPage />);
      const button = screen.getByRole('button', { name: /seguir explorando/i });
      expect(button).toBeInTheDocument();
    });

    it('el enlace de seguir explorando va a /products', () => {
      setupWishlistWithItems();
      render(<WishlistPage />);
      const link = screen.getByRole('link', { name: /seguir explorando/i });
      expect(link).toHaveAttribute('href', '/products');
    });

    it('los nombres de productos enlazan a sus páginas de detalle', () => {
      setupWishlistWithItems();
      render(<WishlistPage />);
      const productLink = screen.getAllByRole('link', { name: /crema hidratante/i });
      expect(productLink[0]).toHaveAttribute('href', '/products/p1');
    });
  });

  describe('Texto singular/plural', () => {
    it('muestra texto singular para un solo producto', () => {
      setupWishlistWithItems();
      mockWishlistReturn.items = ['p1'];
      mockProductsReturn.products = [sampleProducts[0]];
      render(<WishlistPage />);
      expect(screen.getByText(/1 producto guardado$/)).toBeInTheDocument();
    });
  });
});
