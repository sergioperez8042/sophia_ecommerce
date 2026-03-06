import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from './toast';

// Mock framer-motion
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => <>{children}</>,
    m: {
      div: React.forwardRef(({ initial, animate, exit, transition, whileHover, whileTap, ...props }: any, ref: any) => <div ref={ref} {...props} />),
      span: React.forwardRef(({ initial, animate, exit, transition, whileHover, whileTap, ...props }: any, ref: any) => <span ref={ref} {...props} />),
      button: React.forwardRef(({ initial, animate, exit, transition, whileHover, whileTap, ...props }: any, ref: any) => <button ref={ref} {...props} />),
    },
  };
});

// Componente auxiliar para disparar toasts en los tests
function ToastTrigger({ type, title, message }: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message?: string }) {
  const toast = useToast();
  return (
    <button onClick={() => toast[type](title, message)} data-testid={`trigger-${type}`}>
      Disparar {type}
    </button>
  );
}

function ToastTriggerWithRemove() {
  const toast = useToast();
  return (
    <>
      <button onClick={() => toast.showToast('success', 'Test', undefined, 0)} data-testid="trigger-persistent">
        Disparar persistente
      </button>
      <button onClick={() => {
        if (toast.toasts.length > 0) {
          toast.removeToast(toast.toasts[0].id);
        }
      }} data-testid="trigger-remove">
        Eliminar
      </button>
    </>
  );
}

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('ToastProvider', () => {
    it('se renderiza sin errores', () => {
      render(
        <ToastProvider>
          <div>Contenido hijo</div>
        </ToastProvider>
      );
      expect(screen.getByText('Contenido hijo')).toBeInTheDocument();
    });

    it('renderiza el contenedor de toasts', () => {
      const { container } = render(
        <ToastProvider>
          <div>Test</div>
        </ToastProvider>
      );
      const toastContainer = container.querySelector('.fixed.bottom-4.right-4');
      expect(toastContainer).toBeInTheDocument();
    });
  });

  describe('useToast', () => {
    it('lanza un error cuando se usa fuera del ToastProvider', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      function BadComponent() {
        useToast();
        return null;
      }
      expect(() => render(<BadComponent />)).toThrow(
        'useToast must be used within a ToastProvider'
      );
      spy.mockRestore();
    });
  });

  describe('Toast de tipo success', () => {
    it('muestra el titulo del toast de exito', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <ToastProvider>
          <ToastTrigger type="success" title="Operacion exitosa" message="Todo salio bien" />
        </ToastProvider>
      );

      await user.click(screen.getByTestId('trigger-success'));

      expect(screen.getByText('Operacion exitosa')).toBeInTheDocument();
      expect(screen.getByText('Todo salio bien')).toBeInTheDocument();
    });
  });

  describe('Toast de tipo error', () => {
    it('muestra el titulo del toast de error', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <ToastProvider>
          <ToastTrigger type="error" title="Ocurrio un error" message="Algo fallo" />
        </ToastProvider>
      );

      await user.click(screen.getByTestId('trigger-error'));

      expect(screen.getByText('Ocurrio un error')).toBeInTheDocument();
      expect(screen.getByText('Algo fallo')).toBeInTheDocument();
    });
  });

  describe('Toast de tipo warning', () => {
    it('muestra el titulo del toast de advertencia', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <ToastProvider>
          <ToastTrigger type="warning" title="Atencion" />
        </ToastProvider>
      );

      await user.click(screen.getByTestId('trigger-warning'));

      expect(screen.getByText('Atencion')).toBeInTheDocument();
    });
  });

  describe('Toast de tipo info', () => {
    it('muestra el titulo del toast informativo', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <ToastProvider>
          <ToastTrigger type="info" title="Informacion importante" />
        </ToastProvider>
      );

      await user.click(screen.getByTestId('trigger-info'));

      expect(screen.getByText('Informacion importante')).toBeInTheDocument();
    });
  });

  describe('Desaparicion automatica', () => {
    it('el toast desaparece automaticamente despues del tiempo establecido', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <ToastProvider>
          <ToastTrigger type="success" title="Toast temporal" />
        </ToastProvider>
      );

      await user.click(screen.getByTestId('trigger-success'));
      expect(screen.getByText('Toast temporal')).toBeInTheDocument();

      // Los toasts de success usan 5000ms por defecto
      act(() => {
        jest.advanceTimersByTime(5100);
      });

      expect(screen.queryByText('Toast temporal')).not.toBeInTheDocument();
    });

    it('el toast de error tiene una duracion mas larga (7000ms)', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <ToastProvider>
          <ToastTrigger type="error" title="Error persistente" />
        </ToastProvider>
      );

      await user.click(screen.getByTestId('trigger-error'));
      expect(screen.getByText('Error persistente')).toBeInTheDocument();

      // Despues de 5s todavia deberia estar visible
      act(() => {
        jest.advanceTimersByTime(5100);
      });
      expect(screen.getByText('Error persistente')).toBeInTheDocument();

      // Despues de 7s deberia desaparecer
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(screen.queryByText('Error persistente')).not.toBeInTheDocument();
    });
  });

  describe('Boton de cerrar', () => {
    it('cierra el toast al hacer clic en el boton de cerrar', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <ToastProvider>
          <ToastTrigger type="success" title="Toast con boton cerrar" />
        </ToastProvider>
      );

      await user.click(screen.getByTestId('trigger-success'));
      expect(screen.getByText('Toast con boton cerrar')).toBeInTheDocument();

      const closeButton = screen.getByLabelText('Cerrar notificaci\u00f3n');
      await user.click(closeButton);

      expect(screen.queryByText('Toast con boton cerrar')).not.toBeInTheDocument();
    });

    it('el boton de cerrar tiene aria-label accesible', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <ToastProvider>
          <ToastTrigger type="info" title="Test accesibilidad" />
        </ToastProvider>
      );

      await user.click(screen.getByTestId('trigger-info'));
      const closeButton = screen.getByLabelText('Cerrar notificaci\u00f3n');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton.tagName).toBe('BUTTON');
    });
  });

  describe('Renderizado sin mensaje opcional', () => {
    it('renderiza el toast sin mensaje cuando no se proporciona', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <ToastProvider>
          <ToastTrigger type="success" title="Solo titulo" />
        </ToastProvider>
      );

      await user.click(screen.getByTestId('trigger-success'));
      expect(screen.getByText('Solo titulo')).toBeInTheDocument();
    });
  });

  describe('Multiples toasts', () => {
    it('puede mostrar multiples toasts al mismo tiempo', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <ToastProvider>
          <ToastTrigger type="success" title="Primer toast" />
          <ToastTrigger type="error" title="Segundo toast" />
        </ToastProvider>
      );

      await user.click(screen.getByTestId('trigger-success'));
      await user.click(screen.getByTestId('trigger-error'));

      expect(screen.getByText('Primer toast')).toBeInTheDocument();
      expect(screen.getByText('Segundo toast')).toBeInTheDocument();
    });
  });

  describe('Eliminacion manual de toast', () => {
    it('elimina un toast especifico por su id usando removeToast', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <ToastProvider>
          <ToastTriggerWithRemove />
        </ToastProvider>
      );

      await user.click(screen.getByTestId('trigger-persistent'));
      expect(screen.getByText('Test')).toBeInTheDocument();

      await user.click(screen.getByTestId('trigger-remove'));
      expect(screen.queryByText('Test')).not.toBeInTheDocument();
    });
  });
});
