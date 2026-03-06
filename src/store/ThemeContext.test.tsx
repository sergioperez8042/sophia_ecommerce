import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock matchMedia
const mockMatchMedia = jest.fn().mockReturnValue({
  matches: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
});
Object.defineProperty(window, 'matchMedia', { value: mockMatchMedia });

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    document.documentElement.classList.remove('dark');
  });

  describe('Estado inicial', () => {
    it('debe inicializar con tema "light" por defecto si no hay preferencias guardadas', async () => {
      mockMatchMedia.mockReturnValue({ matches: false });

      const { result } = renderHook(() => useTheme(), { wrapper });

      await act(async () => {});

      expect(result.current.theme).toBe('light');
      expect(result.current.isDark).toBe(false);
    });

    it('debe inicializar con tema "dark" si el sistema prefiere dark mode', async () => {
      mockMatchMedia.mockReturnValue({ matches: true });

      const { result } = renderHook(() => useTheme(), { wrapper });

      await act(async () => {});

      expect(result.current.theme).toBe('dark');
      expect(result.current.isDark).toBe(true);
    });

    it('debe inicializar con el tema guardado en localStorage', async () => {
      localStorageMock.setItem('sophia-theme', 'dark');

      const { result } = renderHook(() => useTheme(), { wrapper });

      await act(async () => {});

      expect(result.current.theme).toBe('dark');
      expect(result.current.isDark).toBe(true);
    });

    it('debe ignorar valores invalidos de localStorage y usar el valor por defecto', async () => {
      localStorageMock.setItem('sophia-theme', 'invalid-value');
      mockMatchMedia.mockReturnValue({ matches: false });

      const { result } = renderHook(() => useTheme(), { wrapper });

      await act(async () => {});

      expect(result.current.theme).toBe('light');
    });
  });

  describe('toggleTheme', () => {
    it('debe cambiar de "light" a "dark"', async () => {
      mockMatchMedia.mockReturnValue({ matches: false });
      const { result } = renderHook(() => useTheme(), { wrapper });

      await act(async () => {});

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.isDark).toBe(true);
    });

    it('debe cambiar de "dark" a "light"', async () => {
      localStorageMock.setItem('sophia-theme', 'dark');
      const { result } = renderHook(() => useTheme(), { wrapper });

      await act(async () => {});

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.isDark).toBe(false);
    });

    it('debe alternar repetidamente entre temas', async () => {
      mockMatchMedia.mockReturnValue({ matches: false });
      const { result } = renderHook(() => useTheme(), { wrapper });

      await act(async () => {});

      act(() => {
        result.current.toggleTheme();
      });
      expect(result.current.theme).toBe('dark');

      act(() => {
        result.current.toggleTheme();
      });
      expect(result.current.theme).toBe('light');

      act(() => {
        result.current.toggleTheme();
      });
      expect(result.current.theme).toBe('dark');
    });
  });

  describe('setTheme', () => {
    it('debe establecer el tema a "dark" explicitamente', async () => {
      mockMatchMedia.mockReturnValue({ matches: false });
      const { result } = renderHook(() => useTheme(), { wrapper });

      await act(async () => {});

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.isDark).toBe(true);
    });

    it('debe establecer el tema a "light" explicitamente', async () => {
      localStorageMock.setItem('sophia-theme', 'dark');
      const { result } = renderHook(() => useTheme(), { wrapper });

      await act(async () => {});

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.isDark).toBe(false);
    });
  });

  describe('Persistencia en localStorage', () => {
    it('debe guardar el tema en localStorage al cambiar', async () => {
      mockMatchMedia.mockReturnValue({ matches: false });
      const { result } = renderHook(() => useTheme(), { wrapper });

      await act(async () => {});

      act(() => {
        result.current.toggleTheme();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('sophia-theme', 'dark');
    });

    it('debe guardar "light" en localStorage al establecer tema claro', async () => {
      localStorageMock.setItem('sophia-theme', 'dark');
      const { result } = renderHook(() => useTheme(), { wrapper });

      await act(async () => {});

      act(() => {
        result.current.setTheme('light');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('sophia-theme', 'light');
    });
  });

  describe('Clase CSS en document', () => {
    it('debe agregar la clase "dark" al documentElement cuando el tema es dark', async () => {
      mockMatchMedia.mockReturnValue({ matches: false });
      const { result } = renderHook(() => useTheme(), { wrapper });

      await act(async () => {});

      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('debe remover la clase "dark" al cambiar a tema claro', async () => {
      localStorageMock.setItem('sophia-theme', 'dark');
      const { result } = renderHook(() => useTheme(), { wrapper });

      await act(async () => {});

      act(() => {
        result.current.setTheme('light');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('Error cuando no hay Provider', () => {
    it('debe lanzar error al usar useTheme fuera del ThemeProvider', () => {
      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within a ThemeProvider');
    });
  });
});
