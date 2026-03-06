import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  describe('Renderizado basico', () => {
    it('se renderiza sin errores', () => {
      render(<Button>Hacer clic</Button>);
      expect(screen.getByRole('button', { name: 'Hacer clic' })).toBeInTheDocument();
    });

    it('renderiza el texto hijo correctamente', () => {
      render(<Button>Agregar al carrito</Button>);
      expect(screen.getByText('Agregar al carrito')).toBeInTheDocument();
    });

    it('renderiza como un elemento button por defecto', () => {
      render(<Button>Test</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Variantes', () => {
    it('aplica la variante default', () => {
      render(<Button variant="default">Default</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-primary');
    });

    it('aplica la variante destructive', () => {
      render(<Button variant="destructive">Eliminar</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-destructive');
    });

    it('aplica la variante outline', () => {
      render(<Button variant="outline">Cancelar</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('border');
      expect(button.className).toContain('bg-white');
    });

    it('aplica la variante secondary', () => {
      render(<Button variant="secondary">Secundario</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-gray-100');
    });

    it('aplica la variante ghost', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('text-gray-700');
    });

    it('aplica la variante link', () => {
      render(<Button variant="link">Enlace</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('underline-offset-4');
    });
  });

  describe('Tamanos', () => {
    it('aplica el tamano default', () => {
      render(<Button size="default">Default</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-10');
      expect(button.className).toContain('px-4');
    });

    it('aplica el tamano pequeno (sm)', () => {
      render(<Button size="sm">Pequeno</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-9');
      expect(button.className).toContain('px-3');
    });

    it('aplica el tamano grande (lg)', () => {
      render(<Button size="lg">Grande</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-11');
      expect(button.className).toContain('px-8');
    });

    it('aplica el tamano de icono', () => {
      render(<Button size="icon">I</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-10');
      expect(button.className).toContain('w-10');
    });
  });

  describe('Estado deshabilitado', () => {
    it('puede deshabilitarse con la prop disabled', () => {
      render(<Button disabled>Deshabilitado</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('aplica estilos de deshabilitado', () => {
      render(<Button disabled>Deshabilitado</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('disabled:pointer-events-none');
      expect(button.className).toContain('disabled:opacity-50');
    });
  });

  describe('Interacciones', () => {
    it('ejecuta el handler onClick al hacer clic', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Hacer clic</Button>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('no ejecuta onClick cuando esta deshabilitado', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button disabled onClick={handleClick}>Deshabilitado</Button>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Clase CSS personalizada', () => {
    it('acepta clases CSS adicionales', () => {
      render(<Button className="mi-clase-custom">Test</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('mi-clase-custom');
    });
  });

  describe('Prop asChild', () => {
    it('renderiza como Slot cuando asChild es true', () => {
      render(
        <Button asChild>
          <a href="/test">Enlace como boton</a>
        </Button>
      );
      const link = screen.getByRole('link', { name: 'Enlace como boton' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
    });
  });

  describe('Atributos HTML nativos', () => {
    it('acepta el atributo type', () => {
      render(<Button type="submit">Enviar</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('acepta el atributo aria-label', () => {
      render(<Button aria-label="Cerrar dialogo">X</Button>);
      const button = screen.getByLabelText('Cerrar dialogo');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Forwarded ref', () => {
    it('soporta ref forwarding', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Con ref</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });
});
