import React from 'react';
import { render, screen } from '@testing-library/react';
import AboutPage from './page';

// --- Mocks ---

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

// --- Tests ---

describe('AboutPage', () => {
  describe('Renderizado general', () => {
    it('renderiza sin errores', () => {
      render(<AboutPage />);
      expect(screen.getByText(/De Cuba a/)).toBeInTheDocument();
    });
  });

  describe('Sección Hero', () => {
    it('muestra el encabezado principal "De Cuba a Europa"', () => {
      render(<AboutPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(/De Cuba a/);
      expect(heading).toHaveTextContent(/Europa/);
    });

    it('muestra la badge "Nuestra Historia"', () => {
      render(<AboutPage />);
      expect(screen.getByText('Nuestra Historia')).toBeInTheDocument();
    });

    it('muestra el texto descriptivo sobre Sophia Natural', () => {
      render(<AboutPage />);
      expect(screen.getAllByText(/Sophia Natural/).length).toBeGreaterThanOrEqual(1);
    });

    it('muestra el botón "Descubre Nuestros Productos"', () => {
      render(<AboutPage />);
      expect(
        screen.getByRole('button', { name: /descubre nuestros productos/i })
      ).toBeInTheDocument();
    });

    it('el botón de productos enlaza a /products', () => {
      render(<AboutPage />);
      const link = screen.getByRole('link', { name: /descubre nuestros productos/i });
      expect(link).toHaveAttribute('href', '/products');
    });

    it('muestra el botón "Conoce la Historia"', () => {
      render(<AboutPage />);
      expect(
        screen.getByRole('button', { name: /conoce la historia/i })
      ).toBeInTheDocument();
    });

    it('muestra la imagen de la fundadora con alt text correcto', () => {
      render(<AboutPage />);
      const img = screen.getByAltText('Sophia, fundadora de Sophia Natural');
      expect(img).toBeInTheDocument();
    });
  });

  describe('Sección Historia', () => {
    it('muestra el título de la sección de historia', () => {
      render(<AboutPage />);
      expect(
        screen.getByRole('heading', { name: /una historia de.*determinación/i })
      ).toBeInTheDocument();
    });

    it('muestra las tres subsecciones de la historia', () => {
      render(<AboutPage />);
      expect(screen.getByText('Los Inicios en Cuba')).toBeInTheDocument();
      expect(screen.getByText('El Crecimiento')).toBeInTheDocument();
      expect(screen.getByText('La Conquista Europea')).toBeInTheDocument();
    });

    it('muestra el contenido narrativo de cada subsección', () => {
      render(<AboutPage />);
      expect(screen.getByText(/En 2018, Sophia comenzó su viaje/)).toBeInTheDocument();
      expect(screen.getByText(/Lo que comenzó como una pasión personal/)).toBeInTheDocument();
      expect(screen.getByText(/En 2023, Sophia tomó la decisión/)).toBeInTheDocument();
    });
  });

  describe('Estadísticas', () => {
    it('muestra los 7 años de experiencia', () => {
      render(<AboutPage />);
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('Años de Experiencia')).toBeInTheDocument();
    });

    it('muestra las 50,000+ mujeres satisfechas', () => {
      render(<AboutPage />);
      expect(screen.getByText('50,000+')).toBeInTheDocument();
      expect(screen.getByText('Mujeres Satisfechas')).toBeInTheDocument();
    });

    it('muestra los 15 países en Europa', () => {
      render(<AboutPage />);
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('Países en Europa')).toBeInTheDocument();
    });
  });

  describe('Sección de Valores', () => {
    it('muestra el título de la sección de valores', () => {
      render(<AboutPage />);
      expect(
        screen.getByRole('heading', { name: /nuestros.*valores/i })
      ).toBeInTheDocument();
    });

    it('muestra los cuatro valores de la marca', () => {
      render(<AboutPage />);
      expect(screen.getByText('Pasión')).toBeInTheDocument();
      expect(screen.getByText('Calidad')).toBeInTheDocument();
      expect(screen.getByText('Empoderamiento')).toBeInTheDocument();
      expect(screen.getByText('Compromiso')).toBeInTheDocument();
    });

    it('muestra las descripciones de cada valor', () => {
      render(<AboutPage />);
      expect(
        screen.getByText(/Cada producto está hecho con amor y dedicación/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Solo utilizamos ingredientes naturales/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Creamos oportunidades para mujeres emprendedoras/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Combinamos tradición cubana con estándares europeos/)
      ).toBeInTheDocument();
    });
  });

  describe('Sección CTA final', () => {
    it('muestra el título "Únete a Nuestra Historia"', () => {
      render(<AboutPage />);
      expect(
        screen.getByRole('heading', { name: /únete a nuestra historia/i })
      ).toBeInTheDocument();
    });

    it('muestra el texto motivacional', () => {
      render(<AboutPage />);
      expect(
        screen.getByText(/Sé parte de la revolución de la belleza natural/)
      ).toBeInTheDocument();
    });

    it('muestra el botón "Comprar Ahora"', () => {
      render(<AboutPage />);
      expect(
        screen.getByRole('button', { name: /comprar ahora/i })
      ).toBeInTheDocument();
    });

    it('el botón "Comprar Ahora" enlaza a /products', () => {
      render(<AboutPage />);
      const links = screen.getAllByRole('link', { name: /comprar ahora/i });
      expect(links[0]).toHaveAttribute('href', '/products');
    });

    it('muestra el botón "Contáctanos" en la sección CTA', () => {
      render(<AboutPage />);
      // The CTA section has a <button> inside a <Link> to /contact
      const contactLink = screen.getByRole('link', { name: /contáctanos/i });
      expect(contactLink).toHaveAttribute('href', '/contact');
    });
  });

  describe('Accesibilidad', () => {
    it('tiene encabezados jerárquicos correctos', () => {
      render(<AboutPage />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();

      const h2s = screen.getAllByRole('heading', { level: 2 });
      expect(h2s.length).toBeGreaterThanOrEqual(3);
    });

    it('la imagen tiene texto alternativo descriptivo', () => {
      render(<AboutPage />);
      const img = screen.getByAltText('Sophia, fundadora de Sophia Natural');
      expect(img).toBeInTheDocument();
    });

    it('los enlaces tienen textos descriptivos', () => {
      render(<AboutPage />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });
});
