import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CheckoutPage from './page';

// --- Mocks ---

const mockPush = jest.fn();
const mockClearCart = jest.fn();

let mockCartReturn: {
  items: Array<{
    product: {
      id: string;
      name: string;
      price: number;
      image: string;
    };
    quantity: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  clearCart: jest.Mock;
  addItem: jest.Mock;
  removeItem: jest.Mock;
  updateQuantity: jest.Mock;
  totalItems: number;
  isLoaded: boolean;
};

let mockAuthReturn: {
  user: { id: string; name: string; email: string; role: string; managerCode?: string } | null;
  isAuthenticated: boolean;
  isManager: boolean;
  isLoaded: boolean;
  isAdmin: boolean;
  isClient: boolean;
  login: jest.Mock;
  register: jest.Mock;
  resetPassword: jest.Mock;
  logout: jest.Mock;
  updateUser: jest.Mock;
  getManagers: jest.Mock;
};

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('@/store', () => ({
  useCart: () => mockCartReturn,
  useAuth: () => mockAuthReturn,
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
  return ({ items }: { items: Array<{ label: string; href?: string }> }) => (
    <nav data-testid="breadcrumb">
      {items.map((item, i) => (
        <span key={i}>{item.label}</span>
      ))}
    </nav>
  );
});

jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    setFillColor: jest.fn(),
    rect: jest.fn(),
    setTextColor: jest.fn(),
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    text: jest.fn(),
    setDrawColor: jest.fn(),
    setLineWidth: jest.fn(),
    line: jest.fn(),
    roundedRect: jest.fn(),
    circle: jest.fn(),
    output: jest.fn().mockReturnValue(new Blob()),
    internal: { pageSize: { height: 297 } },
    lastAutoTable: { finalY: 200 },
  }));
});

jest.mock('jspdf-autotable', () => jest.fn());

// --- Helpers ---

const sampleCartItems = [
  {
    product: {
      id: 'item-1',
      name: 'Sérum Rejuvenecedor',
      price: 34.99,
      image: 'https://example.com/serum.jpg',
    },
    quantity: 1,
  },
  {
    product: {
      id: 'item-2',
      name: 'Crema de Noche',
      price: 28.0,
      image: 'https://example.com/crema.jpg',
    },
    quantity: 2,
  },
];

function setupAuthenticatedWithCart() {
  mockCartReturn = {
    items: sampleCartItems,
    subtotal: 90.99,
    shipping: 0,
    total: 90.99,
    clearCart: mockClearCart,
    addItem: jest.fn(),
    removeItem: jest.fn(),
    updateQuantity: jest.fn(),
    totalItems: 3,
    isLoaded: true,
  };
  mockAuthReturn = {
    user: { id: 'user-1', name: 'Test User', email: 'test@example.com', role: 'client' },
    isAuthenticated: true,
    isManager: false,
    isLoaded: true,
    isAdmin: false,
    isClient: true,
    login: jest.fn(),
    register: jest.fn(),
    resetPassword: jest.fn(),
    logout: jest.fn(),
    updateUser: jest.fn(),
    getManagers: jest.fn(),
  };
}

function setupAuthenticatedEmptyCart() {
  mockCartReturn = {
    items: [],
    subtotal: 0,
    shipping: 0,
    total: 0,
    clearCart: mockClearCart,
    addItem: jest.fn(),
    removeItem: jest.fn(),
    updateQuantity: jest.fn(),
    totalItems: 0,
    isLoaded: true,
  };
  mockAuthReturn = {
    user: { id: 'user-1', name: 'Test User', email: 'test@example.com', role: 'client' },
    isAuthenticated: true,
    isManager: false,
    isLoaded: true,
    isAdmin: false,
    isClient: true,
    login: jest.fn(),
    register: jest.fn(),
    resetPassword: jest.fn(),
    logout: jest.fn(),
    updateUser: jest.fn(),
    getManagers: jest.fn(),
  };
}

function setupUnauthenticated() {
  mockCartReturn = {
    items: sampleCartItems,
    subtotal: 90.99,
    shipping: 0,
    total: 90.99,
    clearCart: mockClearCart,
    addItem: jest.fn(),
    removeItem: jest.fn(),
    updateQuantity: jest.fn(),
    totalItems: 3,
    isLoaded: true,
  };
  mockAuthReturn = {
    user: null,
    isAuthenticated: false,
    isManager: false,
    isLoaded: true,
    isAdmin: false,
    isClient: false,
    login: jest.fn(),
    register: jest.fn(),
    resetPassword: jest.fn(),
    logout: jest.fn(),
    updateUser: jest.fn(),
    getManagers: jest.fn(),
  };
}

function setupManagerWithCart() {
  mockCartReturn = {
    items: sampleCartItems,
    subtotal: 90.99,
    shipping: 0,
    total: 90.99,
    clearCart: mockClearCart,
    addItem: jest.fn(),
    removeItem: jest.fn(),
    updateQuantity: jest.fn(),
    totalItems: 3,
    isLoaded: true,
  };
  mockAuthReturn = {
    user: { id: 'mgr-1', name: 'Manager User', email: 'manager@example.com', role: 'manager', managerCode: 'MGR-001' },
    isAuthenticated: true,
    isManager: true,
    isLoaded: true,
    isAdmin: false,
    isClient: false,
    login: jest.fn(),
    register: jest.fn(),
    resetPassword: jest.fn(),
    logout: jest.fn(),
    updateUser: jest.fn(),
    getManagers: jest.fn(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// --- Tests ---

describe('CheckoutPage', () => {
  describe('Protección de ruta', () => {
    it('redirige a /auth si el usuario no está autenticado', () => {
      setupUnauthenticated();
      render(<CheckoutPage />);
      expect(mockPush).toHaveBeenCalledWith('/auth');
    });
  });

  describe('Carrito vacío', () => {
    it('muestra mensaje de carrito vacío cuando no hay productos', () => {
      setupAuthenticatedEmptyCart();
      render(<CheckoutPage />);
      expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
    });

    it('muestra un mensaje orientativo', () => {
      setupAuthenticatedEmptyCart();
      render(<CheckoutPage />);
      expect(
        screen.getByText('Añade productos antes de proceder al checkout.')
      ).toBeInTheDocument();
    });

    it('muestra un botón para ver productos', () => {
      setupAuthenticatedEmptyCart();
      render(<CheckoutPage />);
      const button = screen.getByRole('button', { name: /ver productos/i });
      expect(button).toBeInTheDocument();
    });

    it('el botón enlaza a /products', () => {
      setupAuthenticatedEmptyCart();
      render(<CheckoutPage />);
      const link = screen.getByRole('link', { name: /ver productos/i });
      expect(link).toHaveAttribute('href', '/products');
    });
  });

  describe('Indicadores de progreso', () => {
    it('muestra los pasos del checkout', () => {
      setupAuthenticatedWithCart();
      render(<CheckoutPage />);
      // "Envío" appears in both the step indicator and as a sidebar label
      expect(screen.getAllByText('Envío').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Confirmación')).toBeInTheDocument();
    });
  });

  describe('Breadcrumb', () => {
    it('muestra el breadcrumb con Carrito y Checkout', () => {
      setupAuthenticatedWithCart();
      render(<CheckoutPage />);
      expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
      expect(screen.getByText('Carrito')).toBeInTheDocument();
      expect(screen.getByText('Checkout')).toBeInTheDocument();
    });
  });

  describe('Formulario de envío', () => {
    beforeEach(() => {
      setupAuthenticatedWithCart();
    });

    it('muestra el título "Información de Envío"', () => {
      render(<CheckoutPage />);
      expect(
        screen.getByRole('heading', { name: /información de envío/i })
      ).toBeInTheDocument();
    });

    it('muestra todos los campos del formulario', () => {
      render(<CheckoutPage />);
      expect(screen.getByLabelText(/nombre \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/apellido \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/teléfono \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/dirección \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ciudad \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/código postal \*/i)).toBeInTheDocument();
    });

    it('muestra los placeholders correctos', () => {
      render(<CheckoutPage />);
      expect(screen.getByPlaceholderText('Tu nombre')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Tu apellido')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('+34 600 000 000')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Calle, número, piso...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Tu ciudad')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('28001')).toBeInTheDocument();
    });

    it('permite escribir en los campos del formulario', () => {
      render(<CheckoutPage />);

      const nameInput = screen.getByLabelText(/nombre \*/i);
      fireEvent.change(nameInput, { target: { value: 'María' } });
      expect(nameInput).toHaveValue('María');

      const emailInput = screen.getByLabelText(/email \*/i);
      fireEvent.change(emailInput, { target: { value: 'maria@test.com' } });
      expect(emailInput).toHaveValue('maria@test.com');
    });

    it('el campo email tiene type="email"', () => {
      render(<CheckoutPage />);
      expect(screen.getByLabelText(/email \*/i)).toHaveAttribute('type', 'email');
    });

    it('el campo teléfono tiene type="tel"', () => {
      render(<CheckoutPage />);
      expect(screen.getByLabelText(/teléfono \*/i)).toHaveAttribute('type', 'tel');
    });
  });

  describe('Botones de navegación del formulario', () => {
    beforeEach(() => {
      setupAuthenticatedWithCart();
    });

    it('muestra el botón "Volver al carrito"', () => {
      render(<CheckoutPage />);
      expect(
        screen.getByRole('button', { name: /volver al carrito/i })
      ).toBeInTheDocument();
    });

    it('el botón de volver enlaza a /cart', () => {
      render(<CheckoutPage />);
      const link = screen.getByRole('link', { name: /volver al carrito/i });
      expect(link).toHaveAttribute('href', '/cart');
    });

    it('muestra el botón "Realizar Pedido" con el total', () => {
      render(<CheckoutPage />);
      expect(
        screen.getByRole('button', { name: /realizar pedido \$90\.99/i })
      ).toBeInTheDocument();
    });
  });

  describe('Validación del formulario', () => {
    beforeEach(() => {
      setupAuthenticatedWithCart();
      // Mock window.open to prevent jsPDF/WhatsApp side effects
      jest.spyOn(window, 'open').mockImplementation(() => null);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
    });

    it('muestra errores de validación cuando se envía el formulario vacío', async () => {
      const user = userEvent.setup();
      render(<CheckoutPage />);

      const submitButton = screen.getByRole('button', { name: /realizar pedido/i });
      await user.click(submitButton);

      expect(screen.getByText('Nombre requerido')).toBeInTheDocument();
      expect(screen.getByText('Apellido requerido')).toBeInTheDocument();
      expect(screen.getByText('Email requerido')).toBeInTheDocument();
      expect(screen.getByText('Teléfono requerido')).toBeInTheDocument();
      expect(screen.getByText('Dirección requerida')).toBeInTheDocument();
      expect(screen.getByText('Ciudad requerida')).toBeInTheDocument();
      expect(screen.getByText('Código postal requerido')).toBeInTheDocument();
    });

    it('muestra error de email inválido', async () => {
      const user = userEvent.setup();
      render(<CheckoutPage />);

      fireEvent.change(screen.getByLabelText(/nombre \*/i), { target: { value: 'Test' } });
      fireEvent.change(screen.getByLabelText(/apellido \*/i), { target: { value: 'User' } });
      fireEvent.change(screen.getByLabelText(/email \*/i), { target: { value: 'invalid-email' } });
      fireEvent.change(screen.getByLabelText(/teléfono \*/i), { target: { value: '123456' } });
      fireEvent.change(screen.getByLabelText(/dirección \*/i), { target: { value: 'Calle 1' } });
      fireEvent.change(screen.getByLabelText(/ciudad \*/i), { target: { value: 'Madrid' } });
      fireEvent.change(screen.getByLabelText(/código postal \*/i), { target: { value: '28001' } });

      const submitButton = screen.getByRole('button', { name: /realizar pedido/i });
      await user.click(submitButton);

      expect(screen.getByText('Email inválido')).toBeInTheDocument();
    });
  });

  describe('Resumen del pedido (sidebar)', () => {
    beforeEach(() => {
      setupAuthenticatedWithCart();
    });

    it('muestra el título "Resumen del pedido"', () => {
      render(<CheckoutPage />);
      expect(screen.getByText('Resumen del pedido')).toBeInTheDocument();
    });

    it('muestra los nombres de los productos', () => {
      render(<CheckoutPage />);
      // Product names appear in both the image mock and the text
      expect(screen.getAllByText('Sérum Rejuvenecedor').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Crema de Noche').length).toBeGreaterThanOrEqual(1);
    });

    it('muestra las cantidades de los productos', () => {
      render(<CheckoutPage />);
      const quantity1 = screen.getByText('$34.99 x 1');
      const quantity2 = screen.getByText('$28.00 x 2');
      expect(quantity1).toBeInTheDocument();
      expect(quantity2).toBeInTheDocument();
    });

    it('muestra el subtotal', () => {
      render(<CheckoutPage />);
      expect(screen.getByText('Subtotal')).toBeInTheDocument();
      // $90.99 appears as subtotal, total, and in the button text
      expect(screen.getAllByText((_, el) => el?.textContent === '$90.99').length).toBeGreaterThanOrEqual(1);
    });

    it('muestra "Gratis" para envío gratuito', () => {
      render(<CheckoutPage />);
      expect(screen.getByText('Gratis')).toBeInTheDocument();
    });

    it('muestra el total', () => {
      render(<CheckoutPage />);
      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('muestra las imágenes de los productos', () => {
      render(<CheckoutPage />);
      const images = screen.getAllByTestId('product-image');
      expect(images).toHaveLength(2);
    });
  });

  describe('Información del usuario autenticado', () => {
    it('muestra la información del cliente autenticado', () => {
      setupAuthenticatedWithCart();
      render(<CheckoutPage />);
      expect(screen.getByText('Cliente')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  describe('Badge de gestor', () => {
    it('muestra el badge de descuento para gestores', () => {
      setupManagerWithCart();
      render(<CheckoutPage />);
      expect(screen.getByText('Precio de Gestor Aplicado')).toBeInTheDocument();
      expect(screen.getByText('30% de descuento')).toBeInTheDocument();
    });

    it('muestra el código del gestor', () => {
      setupManagerWithCart();
      render(<CheckoutPage />);
      expect(screen.getByText(/MGR-001/)).toBeInTheDocument();
    });
  });

  describe('Envío con costo', () => {
    it('muestra el costo de envío y mensaje para envío gratis', () => {
      setupAuthenticatedWithCart();
      mockCartReturn.shipping = 5.99;
      mockCartReturn.subtotal = 30;
      mockCartReturn.total = 35.99;
      render(<CheckoutPage />);
      expect(screen.getByText(/Añade.*más para envío gratis/)).toBeInTheDocument();
    });
  });

  describe('Accesibilidad', () => {
    it('tiene encabezados jerárquicos', () => {
      setupAuthenticatedWithCart();
      render(<CheckoutPage />);
      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toBeInTheDocument();
    });

    it('los campos del formulario tienen labels asociados', () => {
      setupAuthenticatedWithCart();
      render(<CheckoutPage />);
      expect(screen.getByLabelText(/nombre \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email \*/i)).toBeInTheDocument();
    });

    it('los campos del formulario tienen IDs únicos', () => {
      setupAuthenticatedWithCart();
      render(<CheckoutPage />);
      expect(screen.getByLabelText(/nombre \*/i)).toHaveAttribute('id', 'checkout-firstname');
      expect(screen.getByLabelText(/apellido \*/i)).toHaveAttribute('id', 'checkout-lastname');
      expect(screen.getByLabelText(/email \*/i)).toHaveAttribute('id', 'checkout-email');
    });
  });
});
