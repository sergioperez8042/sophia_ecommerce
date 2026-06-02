import React from 'react';
import { render, screen } from '@testing-library/react';
import BrandLogo from './BrandLogo';

// Mock framer-motion
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => <>{children}</>,
    m: {
      div: React.forwardRef(({ initial, animate, exit, transition, whileHover, whileTap, ...props }: any, ref: any) => <div ref={ref} {...props} />),
      h1: React.forwardRef(({ initial, animate, exit, transition, whileHover, whileTap, style, ...props }: any, ref: any) => <h1 ref={ref} style={style} {...props} />),
      p: React.forwardRef(({ initial, animate, exit, transition, whileHover, whileTap, ...props }: any, ref: any) => <p ref={ref} {...props} />),
      span: React.forwardRef(({ initial, animate, exit, transition, whileHover, whileTap, ...props }: any, ref: any) => <span ref={ref} {...props} />),
    },
  };
});

// Mock next/image - filter out Next.js specific boolean props
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, unoptimized, priority, ...props }: any) => <img alt="" {...props} />,
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

describe('BrandLogo', () => {
  describe('Renderizado basico', () => {
    it('se renderiza sin errores', () => {
      render(<BrandLogo />);
      // El alt actual es "Sophia" \u2014 el subt\u00edtulo "Cosm\u00e9tica Bot\u00e1nica" se
      // elimin\u00f3 del componente en una refactorizaci\u00f3n de branding.
      expect(screen.getByAltText('Sophia')).toBeInTheDocument();
    });

    it('muestra el nombre de la marca "Sophia"', () => {
      render(<BrandLogo />);
      expect(screen.getByText('Sophia')).toBeInTheDocument();
    });

    it('muestra la imagen del logo', () => {
      render(<BrandLogo />);
      const img = screen.getByAltText('Sophia');
      expect(img).toHaveAttribute('src', '/images/sophia_logo_v3.jpeg');
    });
  });

  describe('Prop showText', () => {
    it('muestra el texto por defecto', () => {
      render(<BrandLogo />);
      expect(screen.getByText('Sophia')).toBeInTheDocument();
    });

    it('oculta el texto cuando showText es false', () => {
      render(<BrandLogo showText={false} />);
      expect(screen.queryByText('Sophia')).not.toBeInTheDocument();
    });
  });

  describe('Prop size', () => {
    it('aplica el tamano mediano por defecto', () => {
      const { container } = render(<BrandLogo />);
      const logoContainer = container.querySelector('.w-16.h-16');
      expect(logoContainer).toBeInTheDocument();
    });

    it('aplica el tamano pequeno cuando size es "sm"', () => {
      const { container } = render(<BrandLogo size="sm" />);
      const logoContainer = container.querySelector('.w-10.h-10');
      expect(logoContainer).toBeInTheDocument();
    });

    it('aplica el tamano grande cuando size es "lg"', () => {
      const { container } = render(<BrandLogo size="lg" />);
      const logoContainer = container.querySelector('.w-20.h-20');
      expect(logoContainer).toBeInTheDocument();
    });
  });

  describe('Prop linkTo', () => {
    it('no envuelve en un enlace cuando linkTo no esta definido', () => {
      const { container } = render(<BrandLogo />);
      const link = container.querySelector('a');
      expect(link).not.toBeInTheDocument();
    });

    it('envuelve en un enlace cuando linkTo esta definido', () => {
      render(<BrandLogo linkTo="/" />);
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/');
    });

    it('el enlace apunta a la URL correcta', () => {
      render(<BrandLogo linkTo="/products" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/products');
    });
  });

  describe('Tamanos de texto segun size', () => {
    it('usa texto pequeno para size "sm"', () => {
      render(<BrandLogo size="sm" />);
      const title = screen.getByText('Sophia');
      expect(title.className).toContain('text-lg');
    });

    it('usa texto mediano para size "md"', () => {
      render(<BrandLogo size="md" />);
      const title = screen.getByText('Sophia');
      expect(title.className).toContain('text-2xl');
    });

    it('usa texto grande para size "lg"', () => {
      render(<BrandLogo size="lg" />);
      const title = screen.getByText('Sophia');
      expect(title.className).toContain('text-3xl');
    });
  });
});
