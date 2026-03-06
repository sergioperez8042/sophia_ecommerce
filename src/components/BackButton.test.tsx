import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BackButton from './BackButton';

const mockBack = jest.fn();

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: mockBack,
    replace: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

describe('BackButton', () => {
  beforeEach(() => {
    mockBack.mockClear();
  });

  describe('Renderizado basico', () => {
    it('se renderiza sin errores', () => {
      render(<BackButton />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('muestra el texto "Volver"', () => {
      render(<BackButton />);
      expect(screen.getByText('Volver')).toBeInTheDocument();
    });

    it('renderiza como un elemento button', () => {
      render(<BackButton />);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('Interacciones', () => {
    it('llama a router.back() al hacer clic', async () => {
      const user = userEvent.setup();
      render(<BackButton />);

      await user.click(screen.getByRole('button'));

      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('llama a router.back() multiples veces al hacer clic repetidamente', async () => {
      const user = userEvent.setup();
      render(<BackButton />);

      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);

      expect(mockBack).toHaveBeenCalledTimes(2);
    });
  });

  describe('Estilos', () => {
    it('tiene las clases de estilo esperadas', () => {
      render(<BackButton />);
      const button = screen.getByRole('button');
      expect(button.className).toContain('inline-flex');
      expect(button.className).toContain('items-center');
    });
  });
});
