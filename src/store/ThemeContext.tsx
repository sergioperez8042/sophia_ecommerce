"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { flushSync } from 'react-dom';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
}

type ThemeAction =
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'TOGGLE_THEME' };

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  /**
   * Alterna el tema. Si se le pasa el evento de click, anima el cambio con
   * un clip-path circular + blur que crece desde la posición del puntero
   * (View Transitions API, fallback directo en navegadores sin soporte o
   * cuando el usuario prefiere reduced-motion).
   */
  toggleTheme: (event?: React.MouseEvent) => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case 'SET_THEME':
      return { theme: action.payload };
    case 'TOGGLE_THEME':
      return { theme: state.theme === 'light' ? 'dark' : 'light' };
    default:
      return state;
  }
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('sophia-theme') as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(themeReducer, { theme: 'light' });
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    const initial = getInitialTheme();
    dispatch({ type: 'SET_THEME', payload: initial });
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('sophia-theme', state.theme);
  }, [state.theme, mounted]);

  /**
   * Toggle con animación circle-with-blur (View Transitions API).
   *
   * - Si el navegador no soporta `document.startViewTransition` o el
   *   usuario prefiere reduced-motion → cambio directo sin animación.
   * - Si soporta → captura snapshot del DOM previo, ejecuta el cambio
   *   de tema (flushSync sincroniza el dispatch + efecto que mete
   *   `.dark` en <html>), luego anima el layer nuevo con un clip-path
   *   circular que crece desde el click + un blur que se desvanece.
   *
   * Patrón portado del proyecto iAcademia backoffice (Pinia store).
   */
  const toggleTheme = useCallback((event?: React.MouseEvent) => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };

    if (!doc.startViewTransition || prefersReducedMotion) {
      dispatch({ type: 'TOGGLE_THEME' });
      return;
    }

    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = doc.startViewTransition(() => {
      // flushSync fuerza que el dispatch + efecto que añade/quita `.dark`
      // en <html> corran sincrónicamente dentro del callback, de modo
      // que el snapshot "nuevo" capture el tema ya aplicado.
      flushSync(() => {
        dispatch({ type: 'TOGGLE_THEME' });
      });
    });

    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
            filter: ['blur(8px)', 'blur(0px)'],
          },
          {
            duration: 600,
            easing: 'ease-in-out',
            pseudoElement: '::view-transition-new(root)',
          },
        );
      })
      .catch(() => {
        // Transición abortada (otra superpuesta, navegador cancela) — no
        // pasa nada, el tema ya cambió en el callback.
      });
  }, []);

  const setTheme = (theme: Theme) => dispatch({ type: 'SET_THEME', payload: theme });

  return (
    <ThemeContext.Provider value={{ theme: state.theme, isDark: state.theme === 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
