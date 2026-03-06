import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';

// Mock next/image - filter out Next.js specific boolean props
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, unoptimized, priority, ...props }: any) => <img {...props} />,
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock framer-motion
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => <>{children}</>,
    m: {
      div: React.forwardRef(({ initial, animate, exit, transition, whileHover, whileTap, ...props }: any, ref: any) => <div ref={ref} {...props} />),
      button: React.forwardRef(({ initial, animate, exit, transition, whileHover, whileTap, ...props }: any, ref: any) => <button ref={ref} {...props} />),
      span: React.forwardRef(({ initial, animate, exit, transition, whileHover, whileTap, ...props }: any, ref: any) => <span ref={ref} {...props} />),
    },
  };
});

// Default mock values
let mockCartCount = 0;
let mockWishlistCount = 0;
let mockIsDark = false;
const mockToggleTheme = jest.fn();

// Mock store hooks
jest.mock('@/store', () => ({
  useCart: () => ({ totalItems: mockCartCount }),
  useWishlist: () => ({ totalItems: mockWishlistCount }),
  useTheme: () => ({ isDark: mockIsDark, toggleTheme: mockToggleTheme }),
}));

// Mock UserMenu
jest.mock('@/components/UserMenu', () => ({
  __esModule: true,
  default: ({ compact }: { compact?: boolean }) => (
    <div data-testid={compact ? 'user-menu-compact' : 'user-menu'}>UserMenu</div>
  ),
}));

describe('Header', () => {
  beforeEach(() => {
    mockCartCount = 0;
    mockWishlistCount = 0;
    mockIsDark = false;
    mockToggleTheme.mockClear();
  });

  describe('Renderizado basico', () => {
    it('se renderiza sin errores', () => {
      render(<Header />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('muestra el nombre de la marca "Sophia"', () => {
      render(<Header />);
      expect(screen.getAllByText('Sophia').length).toBeGreaterThan(0);
    });

    it('muestra el subtitulo "Cosmetica Botanica"', () => {
      render(<Header />);
      expect(screen.getAllByText('Cosm\u00e9tica Bot\u00e1nica').length).toBeGreaterThan(0);
    });
  });

  describe('Navegacion de escritorio', () => {
    it('muestra los enlaces de navegacion principales', () => {
      render(<Header />);

      expect(screen.getByText('Inicio')).toBeInTheDocument();
      expect(screen.getByText('Productos')).toBeInTheDocument();
      expect(screen.getByText('Categor\u00edas')).toBeInTheDocument();
      expect(screen.getByText('Nosotros')).toBeInTheDocument();
      expect(screen.getByText('Contacto')).toBeInTheDocument();
    });

    it('los enlaces apuntan a las rutas correctas', () => {
      render(<Header />);

      // Check desktop nav links (may have duplicates for mobile)
      const inicioLinks = screen.getAllByText('Inicio');
      expect(inicioLinks[0].closest('a')).toHaveAttribute('href', '/');

      const productosLinks = screen.getAllByText('Productos');
      expect(productosLinks[0].closest('a')).toHaveAttribute('href', '/products');
    });
  });

  describe('Menu hamburguesa movil', () => {
    it('muestra el boton del menu hamburguesa', () => {
      render(<Header />);
      const menuButton = screen.getByLabelText('Abrir men\u00fa');
      expect(menuButton).toBeInTheDocument();
    });

    it('abre el menu movil al hacer clic en el hamburguesa', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const menuButton = screen.getByLabelText('Abrir men\u00fa');
      await user.click(menuButton);

      // Ahora deberia mostrar el boton "Cerrar men\u00fa"
      expect(screen.getByLabelText('Cerrar men\u00fa')).toBeInTheDocument();
    });

    it('cierra el menu movil al hacer clic en el boton de cerrar', async () => {
      const user = userEvent.setup();
      render(<Header />);

      // Abrir men\u00fa
      await user.click(screen.getByLabelText('Abrir men\u00fa'));
      expect(screen.getByLabelText('Cerrar men\u00fa')).toBeInTheDocument();

      // Cerrar men\u00fa
      await user.click(screen.getByLabelText('Cerrar men\u00fa'));
      expect(screen.getByLabelText('Abrir men\u00fa')).toBeInTheDocument();
    });

    it('tiene aria-expanded en el boton del menu', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const menuButton = screen.getByLabelText('Abrir men\u00fa');
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');

      await user.click(menuButton);
      const closeButton = screen.getByLabelText('Cerrar men\u00fa');
      expect(closeButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Badge del carrito', () => {
    it('no muestra badge cuando el carrito esta vacio', () => {
      mockCartCount = 0;
      render(<Header />);

      // No deberia haber un badge con numero
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('muestra el contador cuando hay items en el carrito', () => {
      mockCartCount = 3;
      render(<Header />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('muestra "9+" cuando hay mas de 9 items', () => {
      mockCartCount = 15;
      render(<Header />);
      expect(screen.getByText('9+')).toBeInTheDocument();
    });
  });

  describe('Badge de la wishlist', () => {
    it('no muestra badge cuando la wishlist esta vacia', () => {
      mockWishlistCount = 0;
      render(<Header />);
      // No deberia aparecer ningun badge de wishlist
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('muestra el contador cuando hay items en la wishlist', () => {
      mockWishlistCount = 2;
      render(<Header />);
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('muestra "9+" cuando hay mas de 9 items en la wishlist', () => {
      mockWishlistCount = 12;
      render(<Header />);
      expect(screen.getAllByText('9+').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Toggle de tema oscuro/claro', () => {
    it('muestra el boton de cambio de tema', () => {
      render(<Header />);
      const themeButtons = screen.getAllByLabelText(/Cambiar a modo/);
      expect(themeButtons.length).toBeGreaterThan(0);
    });

    it('muestra "Cambiar a modo oscuro" cuando el tema es claro', () => {
      mockIsDark = false;
      render(<Header />);
      expect(screen.getAllByLabelText('Cambiar a modo oscuro').length).toBeGreaterThan(0);
    });

    it('muestra "Cambiar a modo claro" cuando el tema es oscuro', () => {
      mockIsDark = true;
      render(<Header />);
      expect(screen.getAllByLabelText('Cambiar a modo claro').length).toBeGreaterThan(0);
    });

    it('llama a toggleTheme al hacer clic en el boton de tema', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const themeButtons = screen.getAllByLabelText(/Cambiar a modo/);
      await user.click(themeButtons[0]);

      expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    });
  });

  describe('Enlaces del header', () => {
    it('tiene un enlace al carrito', () => {
      render(<Header />);
      const cartLinks = screen.getAllByRole('link').filter(l => l.getAttribute('href') === '/cart');
      expect(cartLinks.length).toBeGreaterThan(0);
    });

    it('tiene un enlace a la wishlist', () => {
      render(<Header />);
      const wishlistLinks = screen.getAllByRole('link').filter(l => l.getAttribute('href') === '/wishlist');
      expect(wishlistLinks.length).toBeGreaterThan(0);
    });

    it('tiene un enlace al inicio (logo)', () => {
      render(<Header />);
      const homeLinks = screen.getAllByRole('link').filter(l => l.getAttribute('href') === '/');
      expect(homeLinks.length).toBeGreaterThan(0);
    });
  });

  describe('UserMenu', () => {
    it('renderiza el UserMenu compacto para movil', () => {
      render(<Header />);
      expect(screen.getByTestId('user-menu-compact')).toBeInTheDocument();
    });

    it('renderiza el UserMenu completo para escritorio', () => {
      render(<Header />);
      expect(screen.getAllByTestId('user-menu').length).toBeGreaterThanOrEqual(1);
    });
  });
});
