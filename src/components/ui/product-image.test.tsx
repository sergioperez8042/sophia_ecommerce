import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductImage from './product-image';

// Mock next/image - filter out Next.js specific boolean props
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, unoptimized, priority, ...props }: any) => {
    return <img data-fill={fill ? 'true' : undefined} data-unoptimized={unoptimized ? 'true' : undefined} {...props} />;
  },
}));

const PLACEHOLDER = '/images/no-image.svg';

describe('ProductImage', () => {
  describe('Renderizado basico', () => {
    it('se renderiza sin errores', () => {
      render(<ProductImage src="https://example.com/image.jpg" alt="Producto test" />);
      const img = screen.getByAltText('Producto test');
      expect(img).toBeInTheDocument();
    });

    it('muestra la imagen con la URL proporcionada', () => {
      render(<ProductImage src="https://example.com/image.jpg" alt="Producto" />);
      const img = screen.getByAltText('Producto');
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('muestra el alt text correcto', () => {
      render(<ProductImage src="https://example.com/image.jpg" alt="Champu organico" />);
      expect(screen.getByAltText('Champu organico')).toBeInTheDocument();
    });
  });

  describe('Imagen de respaldo (fallback)', () => {
    it('muestra el placeholder cuando src es undefined', () => {
      render(<ProductImage src={undefined} alt="Sin imagen" />);
      const img = screen.getByAltText('Sin imagen');
      expect(img).toHaveAttribute('src', PLACEHOLDER);
    });

    it('muestra el placeholder cuando src es null', () => {
      render(<ProductImage src={null} alt="Sin imagen" />);
      const img = screen.getByAltText('Sin imagen');
      expect(img).toHaveAttribute('src', PLACEHOLDER);
    });

    it('muestra el placeholder cuando src es una cadena vacia', () => {
      render(<ProductImage src="" alt="Sin imagen" />);
      const img = screen.getByAltText('Sin imagen');
      expect(img).toHaveAttribute('src', PLACEHOLDER);
    });

    it('muestra el placeholder cuando src es una ruta local (no valida)', () => {
      render(<ProductImage src="/images/champu-organico.jpg" alt="Producto local" />);
      const img = screen.getByAltText('Producto local');
      expect(img).toHaveAttribute('src', PLACEHOLDER);
    });

    it('muestra el placeholder cuando la imagen falla al cargar', () => {
      render(<ProductImage src="https://example.com/broken.jpg" alt="Imagen rota" />);
      const img = screen.getByAltText('Imagen rota');

      fireEvent.error(img);

      expect(img).toHaveAttribute('src', PLACEHOLDER);
    });
  });

  describe('Validacion de URLs', () => {
    it('acepta URLs con http://', () => {
      render(<ProductImage src="http://example.com/image.jpg" alt="HTTP" />);
      const img = screen.getByAltText('HTTP');
      expect(img).toHaveAttribute('src', 'http://example.com/image.jpg');
    });

    it('acepta URLs con https://', () => {
      render(<ProductImage src="https://example.com/image.jpg" alt="HTTPS" />);
      const img = screen.getByAltText('HTTPS');
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('rechaza rutas locales que no son el placeholder', () => {
      render(<ProductImage src="/products/test.png" alt="Local" />);
      const img = screen.getByAltText('Local');
      expect(img).toHaveAttribute('src', PLACEHOLDER);
    });
  });

  describe('Props opcionales', () => {
    it('aplica la clase CSS por defecto (object-cover)', () => {
      render(<ProductImage src="https://example.com/image.jpg" alt="Test" />);
      const img = screen.getByAltText('Test');
      expect(img.className).toContain('object-cover');
    });

    it('aplica una clase CSS personalizada', () => {
      render(
        <ProductImage src="https://example.com/image.jpg" alt="Test" className="rounded-lg" />
      );
      const img = screen.getByAltText('Test');
      expect(img.className).toContain('rounded-lg');
    });

    it('usa fill=true por defecto', () => {
      render(<ProductImage src="https://example.com/image.jpg" alt="Test" />);
      const img = screen.getByAltText('Test');
      expect(img).toHaveAttribute('data-fill', 'true');
    });

    it('pasa el atributo sizes cuando se proporciona', () => {
      render(
        <ProductImage src="https://example.com/image.jpg" alt="Test" sizes="(max-width: 768px) 100vw" />
      );
      const img = screen.getByAltText('Test');
      expect(img).toHaveAttribute('sizes', '(max-width: 768px) 100vw');
    });

    it('pasa width y height cuando fill es false', () => {
      render(
        <ProductImage src="https://example.com/image.jpg" alt="Test" fill={false} width={200} height={200} />
      );
      const img = screen.getByAltText('Test');
      expect(img).toHaveAttribute('width', '200');
      expect(img).toHaveAttribute('height', '200');
      expect(img).not.toHaveAttribute('data-fill');
    });
  });

  describe('Clases CSS del placeholder', () => {
    it('agrega clases de placeholder cuando se muestra la imagen de respaldo', () => {
      render(<ProductImage src={null} alt="Placeholder" />);
      const img = screen.getByAltText('Placeholder');
      expect(img.className).toContain('object-contain');
      expect(img.className).toContain('p-4');
    });

    it('no agrega clases de placeholder cuando hay una imagen valida', () => {
      render(<ProductImage src="https://example.com/image.jpg" alt="Valida" />);
      const img = screen.getByAltText('Valida');
      expect(img.className).not.toContain('object-contain');
      expect(img.className).not.toContain('p-4');
    });
  });

  describe('Atributo unoptimized', () => {
    it('marca la imagen como unoptimized cuando es placeholder', () => {
      render(<ProductImage src={null} alt="Placeholder" />);
      const img = screen.getByAltText('Placeholder');
      expect(img).toHaveAttribute('data-unoptimized', 'true');
    });
  });
});
