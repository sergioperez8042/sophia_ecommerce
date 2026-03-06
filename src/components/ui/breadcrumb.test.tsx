import React from 'react';
import { render, screen } from '@testing-library/react';
import Breadcrumb from './breadcrumb';

// Mock framer-motion
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => <>{children}</>,
    m: {
      nav: React.forwardRef(({ initial, animate, exit, transition, ...props }: any, ref: any) => <nav ref={ref} {...props} />),
      div: React.forwardRef(({ initial, animate, exit, transition, ...props }: any, ref: any) => <div ref={ref} {...props} />),
    },
  };
});

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

describe('Breadcrumb', () => {
  describe('Renderizado basico', () => {
    it('se renderiza sin errores', () => {
      render(<Breadcrumb items={[]} />);
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('siempre muestra el enlace a la p\u00e1gina de inicio', () => {
      render(<Breadcrumb items={[]} />);
      const homeLink = screen.getByRole('link');
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });

  describe('Items con enlaces', () => {
    it('renderiza un item con enlace', () => {
      render(
        <Breadcrumb items={[{ label: 'Productos', href: '/products' }]} />
      );
      const productLink = screen.getByText('Productos');
      expect(productLink).toBeInTheDocument();
      expect(productLink.closest('a')).toHaveAttribute('href', '/products');
    });

    it('renderiza multiples items con enlaces', () => {
      render(
        <Breadcrumb
          items={[
            { label: 'Productos', href: '/products' },
            { label: 'Champu', href: '/products/champu' },
          ]}
        />
      );
      expect(screen.getByText('Productos')).toBeInTheDocument();
      expect(screen.getByText('Champu')).toBeInTheDocument();
    });
  });

  describe('Ultimo item sin enlace', () => {
    it('renderiza el ultimo item como texto sin enlace', () => {
      render(
        <Breadcrumb
          items={[
            { label: 'Productos', href: '/products' },
            { label: 'Champu Organico' },
          ]}
        />
      );

      const lastItem = screen.getByText('Champu Organico');
      expect(lastItem).toBeInTheDocument();
      expect(lastItem.tagName).toBe('SPAN');
      expect(lastItem.closest('a')).toBeNull();
    });

    it('aplica estilos de negrita al ultimo item', () => {
      render(
        <Breadcrumb items={[{ label: 'P\u00e1gina actual' }]} />
      );
      const currentPage = screen.getByText('P\u00e1gina actual');
      expect(currentPage.className).toContain('font-bold');
    });
  });

  describe('Separadores', () => {
    it('muestra separadores entre los items', () => {
      const { container } = render(
        <Breadcrumb
          items={[
            { label: 'Productos', href: '/products' },
            { label: 'Detalle' },
          ]}
        />
      );
      // Los separadores son ChevronRight icons, uno por cada item
      const separators = container.querySelectorAll('.flex.items-center.space-x-2');
      expect(separators.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Accesibilidad', () => {
    it('tiene un elemento nav para la navegacion', () => {
      render(<Breadcrumb items={[{ label: 'Test' }]} />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('los enlaces son accesibles', () => {
      render(
        <Breadcrumb items={[{ label: 'Productos', href: '/products' }]} />
      );
      const links = screen.getAllByRole('link');
      // Home link + Products link
      expect(links.length).toBe(2);
    });
  });

  describe('Items mixtos', () => {
    it('renderiza correctamente una combinacion de items con y sin enlace', () => {
      render(
        <Breadcrumb
          items={[
            { label: 'Categor\u00edas', href: '/categories' },
            { label: 'Cuidado Capilar', href: '/categories/capilar' },
            { label: 'Champu Botanico' },
          ]}
        />
      );

      // Items con enlace
      expect(screen.getByText('Categor\u00edas').closest('a')).toHaveAttribute('href', '/categories');
      expect(screen.getByText('Cuidado Capilar').closest('a')).toHaveAttribute('href', '/categories/capilar');

      // Item sin enlace
      const lastItem = screen.getByText('Champu Botanico');
      expect(lastItem.tagName).toBe('SPAN');
    });
  });
});
