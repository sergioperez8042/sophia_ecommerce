import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
  describe('Renderizado basico', () => {
    it('se renderiza sin errores', () => {
      render(<Badge>Nuevo</Badge>);
      expect(screen.getByText('Nuevo')).toBeInTheDocument();
    });

    it('renderiza el contenido de texto correctamente', () => {
      render(<Badge>En oferta</Badge>);
      expect(screen.getByText('En oferta')).toBeInTheDocument();
    });

    it('renderiza como un div por defecto', () => {
      render(<Badge>Test</Badge>);
      const badge = screen.getByText('Test');
      expect(badge.tagName).toBe('DIV');
    });
  });

  describe('Variantes', () => {
    it('aplica la variante default', () => {
      render(<Badge variant="default">Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge.className).toContain('bg-primary');
    });

    it('aplica la variante secondary', () => {
      render(<Badge variant="secondary">Secundario</Badge>);
      const badge = screen.getByText('Secundario');
      expect(badge.className).toContain('bg-gray-100');
    });

    it('aplica la variante destructive', () => {
      render(<Badge variant="destructive">Eliminado</Badge>);
      const badge = screen.getByText('Eliminado');
      expect(badge.className).toContain('bg-destructive');
    });

    it('aplica la variante outline', () => {
      render(<Badge variant="outline">Contorno</Badge>);
      const badge = screen.getByText('Contorno');
      expect(badge.className).toContain('text-foreground');
    });
  });

  describe('Estilos base', () => {
    it('tiene forma redondeada (rounded-full)', () => {
      render(<Badge>Test</Badge>);
      const badge = screen.getByText('Test');
      expect(badge.className).toContain('rounded-full');
    });

    it('tiene texto en negrita semibold', () => {
      render(<Badge>Test</Badge>);
      const badge = screen.getByText('Test');
      expect(badge.className).toContain('font-semibold');
    });

    it('tiene tamano de texto pequeno (text-xs)', () => {
      render(<Badge>Test</Badge>);
      const badge = screen.getByText('Test');
      expect(badge.className).toContain('text-xs');
    });
  });

  describe('Clase CSS personalizada', () => {
    it('acepta clases CSS adicionales', () => {
      render(<Badge className="mi-clase">Custom</Badge>);
      const badge = screen.getByText('Custom');
      expect(badge.className).toContain('mi-clase');
    });

    it('combina clases personalizadas con las de la variante', () => {
      render(<Badge variant="secondary" className="extra-clase">Combinado</Badge>);
      const badge = screen.getByText('Combinado');
      expect(badge.className).toContain('bg-gray-100');
      expect(badge.className).toContain('extra-clase');
    });
  });

  describe('Props HTML nativas', () => {
    it('acepta data-testid', () => {
      render(<Badge data-testid="mi-badge">Test</Badge>);
      expect(screen.getByTestId('mi-badge')).toBeInTheDocument();
    });

    it('acepta el atributo role', () => {
      render(<Badge role="status">Activo</Badge>);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});
