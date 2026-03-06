import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';

describe('Input', () => {
  describe('Renderizado basico', () => {
    it('se renderiza sin errores', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('renderiza como un elemento input', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input.tagName).toBe('INPUT');
    });
  });

  describe('Props', () => {
    it('acepta el atributo placeholder', () => {
      render(<Input placeholder="Escribe tu nombre" />);
      expect(screen.getByPlaceholderText('Escribe tu nombre')).toBeInTheDocument();
    });

    it('acepta el atributo type', () => {
      render(<Input type="email" placeholder="correo" />);
      const input = screen.getByPlaceholderText('correo');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('acepta el atributo value', () => {
      render(<Input defaultValue="valor inicial" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('valor inicial');
    });

    it('acepta el atributo name', () => {
      render(<Input name="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'email');
    });
  });

  describe('Estado deshabilitado', () => {
    it('puede deshabilitarse con la prop disabled', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('aplica estilos de deshabilitado', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('disabled:cursor-not-allowed');
      expect(input.className).toContain('disabled:opacity-50');
    });
  });

  describe('Interacciones de usuario', () => {
    it('permite al usuario escribir texto', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Escribe aqui" />);

      const input = screen.getByPlaceholderText('Escribe aqui');
      await user.type(input, 'Hola mundo');

      expect(input).toHaveValue('Hola mundo');
    });

    it('ejecuta el handler onChange al escribir', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'a');

      expect(handleChange).toHaveBeenCalled();
    });

    it('ejecuta el handler onFocus al recibir foco', async () => {
      const handleFocus = jest.fn();
      const user = userEvent.setup();
      render(<Input onFocus={handleFocus} />);

      const input = screen.getByRole('textbox');
      await user.click(input);

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('ejecuta el handler onBlur al perder el foco', async () => {
      const handleBlur = jest.fn();
      const user = userEvent.setup();
      render(
        <>
          <Input onBlur={handleBlur} />
          <button>Otro elemento</button>
        </>
      );

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.click(screen.getByRole('button'));

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Clase CSS personalizada', () => {
    it('acepta clases CSS adicionales', () => {
      render(<Input className="w-64 border-green-500" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('w-64');
      expect(input.className).toContain('border-green-500');
    });

    it('mantiene las clases base junto con las personalizadas', () => {
      render(<Input className="custom" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('rounded-md');
      expect(input.className).toContain('custom');
    });
  });

  describe('Forwarded ref', () => {
    it('soporta ref forwarding', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Accesibilidad', () => {
    it('acepta el atributo aria-label', () => {
      render(<Input aria-label="Buscar productos" />);
      expect(screen.getByLabelText('Buscar productos')).toBeInTheDocument();
    });

    it('acepta el atributo aria-required', () => {
      render(<Input aria-required="true" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-required', 'true');
    });
  });
});
