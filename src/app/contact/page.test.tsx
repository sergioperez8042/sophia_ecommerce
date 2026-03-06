import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactPage from './page';

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

jest.mock('@/components/ui/breadcrumb', () => {
  return ({ items }: { items: Array<{ label: string }> }) => (
    <nav data-testid="breadcrumb">
      {items.map((item, i) => (
        <span key={i}>{item.label}</span>
      ))}
    </nav>
  );
});

// --- Helpers ---

function mockFetchSuccess() {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true }),
  });
}

function mockFetchError(errorMsg = 'Error al enviar el mensaje') {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: errorMsg }),
  });
}

function mockFetchNetworkError() {
  global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
}

/**
 * Fill the contact form using fireEvent.change for reliable controlled input updates.
 */
function fillContactForm() {
  fireEvent.change(screen.getByLabelText('Nombre Completo'), { target: { value: 'María García' } });
  fireEvent.change(screen.getByLabelText(/^Email$/), { target: { value: 'maria@example.com' } });
  fireEvent.change(screen.getByLabelText('Asunto'), { target: { value: 'Consulta sobre productos' } });
  fireEvent.change(screen.getByLabelText('Mensaje'), { target: { value: 'Quiero saber más sobre sus cremas naturales.' } });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

// --- Tests ---

describe('ContactPage', () => {
  describe('Renderizado inicial', () => {
    it('renderiza sin errores', () => {
      render(<ContactPage />);
      expect(screen.getByText(/Estamos Aquí Para/)).toBeInTheDocument();
    });

    it('muestra el encabezado principal', () => {
      render(<ContactPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(/Estamos Aquí Para/);
      expect(heading).toHaveTextContent(/Ayudarte/);
    });

    it('muestra el breadcrumb con "Contacto"', () => {
      render(<ContactPage />);
      expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
      expect(screen.getByText('Contacto')).toBeInTheDocument();
    });

    it('muestra la badge "Contáctanos"', () => {
      render(<ContactPage />);
      expect(screen.getByText('Contáctanos')).toBeInTheDocument();
    });

    it('muestra el texto descriptivo del hero', () => {
      render(<ContactPage />);
      expect(
        screen.getByText(/¿Tienes preguntas sobre nuestros productos/)
      ).toBeInTheDocument();
    });
  });

  describe('Tarjetas de información de contacto', () => {
    it('muestra la tarjeta de email con la dirección', () => {
      render(<ContactPage />);
      // "Email" appears as both a contact card heading and a form label
      const emailHeadings = screen.getAllByText('Email');
      expect(emailHeadings.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('chavesophia1994@gmail.com')).toBeInTheDocument();
    });

    it('muestra la tarjeta de teléfono', () => {
      render(<ContactPage />);
      expect(screen.getByText('Teléfono')).toBeInTheDocument();
      expect(screen.getByText('+34 642 63 39 82')).toBeInTheDocument();
    });

    it('muestra la tarjeta de Instagram', () => {
      render(<ContactPage />);
      expect(screen.getByText('Instagram')).toBeInTheDocument();
      expect(screen.getByText('@sophia.products_')).toBeInTheDocument();
    });

    it('muestra la tarjeta de ubicación', () => {
      render(<ContactPage />);
      expect(screen.getByText('Ubicación')).toBeInTheDocument();
      expect(screen.getByText('Madrid, España')).toBeInTheDocument();
    });

    it('muestra la tarjeta de horario', () => {
      render(<ContactPage />);
      expect(screen.getByText('Horario')).toBeInTheDocument();
      expect(screen.getByText('Lun – Vie: 9:00 – 18:00')).toBeInTheDocument();
    });

    it('el email enlaza con mailto', () => {
      render(<ContactPage />);
      const emailLink = screen.getByRole('link', { name: /email.*chavesophia1994/i });
      expect(emailLink).toHaveAttribute('href', 'mailto:chavesophia1994@gmail.com');
    });

    it('el teléfono enlaza con tel', () => {
      render(<ContactPage />);
      const phoneLink = screen.getByRole('link', { name: /teléfono.*\+34/i });
      expect(phoneLink).toHaveAttribute('href', 'tel:+34642633982');
    });
  });

  describe('Sección WhatsApp', () => {
    it('muestra el título "Respuesta Inmediata"', () => {
      render(<ContactPage />);
      expect(screen.getByText('Respuesta Inmediata')).toBeInTheDocument();
    });

    it('muestra el botón de WhatsApp', () => {
      render(<ContactPage />);
      expect(
        screen.getByRole('button', { name: /escribir por whatsapp/i })
      ).toBeInTheDocument();
    });

    it('el enlace de WhatsApp apunta al número correcto', () => {
      render(<ContactPage />);
      const whatsappLink = screen.getByRole('link', { name: /escribir por whatsapp/i });
      expect(whatsappLink).toHaveAttribute(
        'href',
        expect.stringContaining('wa.me/34642633982')
      );
    });
  });

  describe('Sección de highlights', () => {
    it('muestra el dato de "100%" Natural', () => {
      render(<ContactPage />);
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('Natural')).toBeInTheDocument();
    });

    it('muestra el dato de "<24h" Respuesta', () => {
      render(<ContactPage />);
      expect(screen.getByText('<24h')).toBeInTheDocument();
      expect(screen.getByText('Respuesta')).toBeInTheDocument();
    });
  });

  describe('Formulario de contacto', () => {
    it('muestra el título de la sección del formulario', () => {
      render(<ContactPage />);
      expect(screen.getByRole('heading', { name: /envíanos un.*mensaje/i })).toBeInTheDocument();
    });

    it('muestra todos los campos del formulario con etiquetas', () => {
      render(<ContactPage />);
      expect(screen.getByLabelText('Nombre Completo')).toBeInTheDocument();
      expect(screen.getByLabelText(/^Email$/)).toBeInTheDocument();
      expect(screen.getByLabelText('Asunto')).toBeInTheDocument();
      expect(screen.getByLabelText('Mensaje')).toBeInTheDocument();
    });

    it('muestra los placeholders correctos en los campos', () => {
      render(<ContactPage />);
      expect(screen.getByPlaceholderText('Tu nombre')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('¿En qué podemos ayudarte?')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Cuéntanos más detalles...')).toBeInTheDocument();
    });

    it('todos los campos son requeridos', () => {
      render(<ContactPage />);
      expect(screen.getByLabelText('Nombre Completo')).toBeRequired();
      expect(screen.getByLabelText(/^Email$/)).toBeRequired();
      expect(screen.getByLabelText('Asunto')).toBeRequired();
      expect(screen.getByLabelText('Mensaje')).toBeRequired();
    });

    it('el campo de email tiene type="email"', () => {
      render(<ContactPage />);
      expect(screen.getByLabelText(/^Email$/)).toHaveAttribute('type', 'email');
    });

    it('muestra el botón de enviar con texto correcto', () => {
      render(<ContactPage />);
      expect(
        screen.getByRole('button', { name: /enviar mensaje/i })
      ).toBeInTheDocument();
    });

    it('permite escribir en los campos del formulario', () => {
      render(<ContactPage />);

      const nameInput = screen.getByLabelText('Nombre Completo');
      fireEvent.change(nameInput, { target: { value: 'Test Name' } });
      expect(nameInput).toHaveValue('Test Name');

      const emailInput = screen.getByLabelText(/^Email$/);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      expect(emailInput).toHaveValue('test@example.com');
    });
  });

  describe('Envío del formulario - estado enviando', () => {
    it('muestra "Enviando..." mientras se envía el formulario', async () => {
      const user = userEvent.setup();
      // Use a promise that never resolves to keep it in "sending" state
      global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));

      render(<ContactPage />);
      fillContactForm();

      const submitButton = screen.getByRole('button', { name: /enviar mensaje/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /enviando/i })
        ).toBeInTheDocument();
      });
    });

    it('deshabilita el botón mientras se envía', async () => {
      const user = userEvent.setup();
      global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));

      render(<ContactPage />);
      fillContactForm();

      const submitButton = screen.getByRole('button', { name: /enviar mensaje/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /enviando/i })).toBeDisabled();
      });
    });
  });

  describe('Envío del formulario - éxito', () => {
    it('muestra mensaje de éxito cuando se envía correctamente', async () => {
      const user = userEvent.setup();
      mockFetchSuccess();

      render(<ContactPage />);
      fillContactForm();

      const submitButton = screen.getByRole('button', { name: /enviar mensaje/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('¡Mensaje enviado correctamente!')).toBeInTheDocument();
      });
    });

    it('muestra mensaje secundario de respuesta en 24 horas', async () => {
      const user = userEvent.setup();
      mockFetchSuccess();

      render(<ContactPage />);
      fillContactForm();

      await user.click(screen.getByRole('button', { name: /enviar mensaje/i }));

      await waitFor(() => {
        expect(
          screen.getByText('Te responderemos en menos de 24 horas.')
        ).toBeInTheDocument();
      });
    });

    it('limpia los campos del formulario después de enviar correctamente', async () => {
      const user = userEvent.setup();
      mockFetchSuccess();

      render(<ContactPage />);
      fillContactForm();

      await user.click(screen.getByRole('button', { name: /enviar mensaje/i }));

      await waitFor(() => {
        expect(screen.getByLabelText('Nombre Completo')).toHaveValue('');
        expect(screen.getByLabelText(/^Email$/)).toHaveValue('');
        expect(screen.getByLabelText('Asunto')).toHaveValue('');
        expect(screen.getByLabelText('Mensaje')).toHaveValue('');
      });
    });
  });

  describe('Envío del formulario - error del servidor', () => {
    it('muestra el mensaje de error del servidor', async () => {
      const user = userEvent.setup();
      mockFetchError('Datos inválidos');

      render(<ContactPage />);
      fillContactForm();

      await user.click(screen.getByRole('button', { name: /enviar mensaje/i }));

      await waitFor(() => {
        expect(screen.getByText('Datos inválidos')).toBeInTheDocument();
      });
    });

    it('muestra un mensaje de error genérico si el servidor no envía mensaje', async () => {
      const user = userEvent.setup();
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      render(<ContactPage />);
      fillContactForm();

      await user.click(screen.getByRole('button', { name: /enviar mensaje/i }));

      await waitFor(() => {
        expect(screen.getByText('Error al enviar el mensaje')).toBeInTheDocument();
      });
    });
  });

  describe('Envío del formulario - error de red', () => {
    it('muestra mensaje de error de conexión', async () => {
      const user = userEvent.setup();
      mockFetchNetworkError();

      render(<ContactPage />);
      fillContactForm();

      await user.click(screen.getByRole('button', { name: /enviar mensaje/i }));

      await waitFor(() => {
        expect(
          screen.getByText('Error de conexión. Inténtalo de nuevo.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Accesibilidad', () => {
    it('tiene encabezados jerárquicos', () => {
      render(<ContactPage />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
      const h2s = screen.getAllByRole('heading', { level: 2 });
      expect(h2s.length).toBeGreaterThan(0);
    });

    it('los campos del formulario tienen labels asociados', () => {
      render(<ContactPage />);
      expect(screen.getByLabelText('Nombre Completo')).toBeInTheDocument();
      expect(screen.getByLabelText(/^Email$/)).toBeInTheDocument();
      expect(screen.getByLabelText('Asunto')).toBeInTheDocument();
      expect(screen.getByLabelText('Mensaje')).toBeInTheDocument();
    });
  });
});
