/**
 * @jest-environment node
 */

/**
 * Tests para la ruta API /api/contact
 *
 * Esta ruta recibe un formulario de contacto (name, email, subject, message)
 * y envia un email al propietario usando la API de Resend.
 */

import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock global fetch para interceptar llamadas a la API de Resend
const mockFetch = jest.fn();
global.fetch = mockFetch;

const VALID_PAYLOAD = {
  name: 'Maria Garcia',
  email: 'maria@example.com',
  subject: 'Consulta sobre productos',
  message: 'Hola, me gustaria saber mas sobre sus productos naturales.',
};

function crearRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/contact', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/contact', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.RESEND_API_KEY = 'test-api-key-resend';
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
  });

  // ---------------------------------------------------
  // Caso exitoso
  // ---------------------------------------------------
  describe('Solicitud exitosa', () => {
    it('deberia enviar el email y responder con exito (200)', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'email-123' }) });

      const res = await POST(crearRequest(VALID_PAYLOAD));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Mensaje enviado correctamente');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('deberia llamar a la API de Resend con los parametros correctos', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      await POST(crearRequest(VALID_PAYLOAD));

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.resend.com/emails');
      expect(options.method).toBe('POST');
      expect(options.headers['Authorization']).toBe('Bearer test-api-key-resend');

      const body = JSON.parse(options.body);
      expect(body.to).toEqual(['chavesophia1994@gmail.com']);
      expect(body.reply_to).toBe('maria@example.com');
      expect(body.subject).toBe('[Contacto Web] Consulta sobre productos');
    });

    it('deberia recortar espacios en el email y convertirlo a minusculas', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      await POST(crearRequest({
        ...VALID_PAYLOAD,
        email: '  Maria@Example.COM  ',
      }));

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.reply_to).toBe('maria@example.com');
    });
  });

  // ---------------------------------------------------
  // Campos obligatorios
  // ---------------------------------------------------
  describe('Validacion de campos obligatorios', () => {
    it.each([
      ['name', { ...VALID_PAYLOAD, name: '' }],
      ['email', { ...VALID_PAYLOAD, email: '' }],
      ['subject', { ...VALID_PAYLOAD, subject: '' }],
      ['message', { ...VALID_PAYLOAD, message: '' }],
    ])('deberia devolver 400 cuando falta el campo %s', async (_campo, payload) => {
      const res = await POST(crearRequest(payload));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Todos los campos son obligatorios');
    });

    it.each([
      ['name', { email: 'a@b.com', subject: 'Hola', message: 'Mensaje largo suficiente' }],
      ['email', { name: 'Ana', subject: 'Hola', message: 'Mensaje largo suficiente' }],
      ['subject', { name: 'Ana', email: 'a@b.com', message: 'Mensaje largo suficiente' }],
      ['message', { name: 'Ana', email: 'a@b.com', subject: 'Hola' }],
    ])('deberia devolver 400 cuando el campo %s esta ausente', async (_campo, payload) => {
      const res = await POST(crearRequest(payload));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Todos los campos son obligatorios');
    });
  });

  // ---------------------------------------------------
  // Validacion del nombre
  // ---------------------------------------------------
  describe('Validacion del nombre', () => {
    it('deberia rechazar nombre con menos de 2 caracteres', async () => {
      const res = await POST(crearRequest({ ...VALID_PAYLOAD, name: 'A' }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Nombre inválido');
    });

    it('deberia rechazar nombre con mas de 100 caracteres', async () => {
      const res = await POST(crearRequest({ ...VALID_PAYLOAD, name: 'A'.repeat(101) }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Nombre inválido');
    });

    it('deberia rechazar nombre que no sea string', async () => {
      const res = await POST(crearRequest({ ...VALID_PAYLOAD, name: 12345 }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Nombre inválido');
    });

    it('deberia aceptar nombre con exactamente 2 caracteres', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      const res = await POST(crearRequest({ ...VALID_PAYLOAD, name: 'Jo' }));
      expect(res.status).toBe(200);
    });

    it('deberia aceptar nombre con exactamente 100 caracteres', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      const res = await POST(crearRequest({ ...VALID_PAYLOAD, name: 'A'.repeat(100) }));
      expect(res.status).toBe(200);
    });
  });

  // ---------------------------------------------------
  // Validacion del email
  // ---------------------------------------------------
  describe('Validacion del email', () => {
    it('deberia rechazar email con formato invalido', async () => {
      const res = await POST(crearRequest({ ...VALID_PAYLOAD, email: 'no-es-un-email' }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Email inválido');
    });

    it('deberia rechazar email sin dominio', async () => {
      const res = await POST(crearRequest({ ...VALID_PAYLOAD, email: 'user@' }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Email inválido');
    });

    it('deberia rechazar email con mas de 254 caracteres', async () => {
      const longEmail = 'a'.repeat(250) + '@b.com';
      const res = await POST(crearRequest({ ...VALID_PAYLOAD, email: longEmail }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Email inválido');
    });
  });

  // ---------------------------------------------------
  // Validacion del asunto
  // ---------------------------------------------------
  describe('Validacion del asunto', () => {
    it('deberia rechazar asunto con menos de 2 caracteres', async () => {
      const res = await POST(crearRequest({ ...VALID_PAYLOAD, subject: 'A' }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Asunto inválido');
    });

    it('deberia rechazar asunto con mas de 200 caracteres', async () => {
      const res = await POST(crearRequest({ ...VALID_PAYLOAD, subject: 'A'.repeat(201) }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Asunto inválido');
    });

    it('deberia rechazar asunto que no sea string', async () => {
      const res = await POST(crearRequest({ ...VALID_PAYLOAD, subject: 999 }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Asunto inválido');
    });
  });

  // ---------------------------------------------------
  // Validacion del mensaje
  // ---------------------------------------------------
  describe('Validacion del mensaje', () => {
    it('deberia rechazar mensaje con menos de 10 caracteres', async () => {
      const res = await POST(crearRequest({ ...VALID_PAYLOAD, message: 'Corto' }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('El mensaje debe tener al menos 10 caracteres');
    });

    it('deberia rechazar mensaje con mas de 5000 caracteres', async () => {
      const res = await POST(crearRequest({ ...VALID_PAYLOAD, message: 'A'.repeat(5001) }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('El mensaje debe tener al menos 10 caracteres');
    });

    it('deberia rechazar mensaje que no sea string', async () => {
      const res = await POST(crearRequest({ ...VALID_PAYLOAD, message: 12345 }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('El mensaje debe tener al menos 10 caracteres');
    });

    it('deberia aceptar mensaje con exactamente 10 caracteres', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      const res = await POST(crearRequest({ ...VALID_PAYLOAD, message: 'A'.repeat(10) }));
      expect(res.status).toBe(200);
    });
  });

  // ---------------------------------------------------
  // Configuracion del servicio
  // ---------------------------------------------------
  describe('Configuracion del servicio de email', () => {
    it('deberia devolver 503 si RESEND_API_KEY no esta configurada', async () => {
      delete process.env.RESEND_API_KEY;

      const res = await POST(crearRequest(VALID_PAYLOAD));
      const data = await res.json();

      expect(res.status).toBe(503);
      expect(data.error).toBe('Servicio de email no configurado. Por favor, contáctanos por WhatsApp.');
    });
  });

  // ---------------------------------------------------
  // Fallos del servicio externo
  // ---------------------------------------------------
  describe('Fallos del servicio de Resend', () => {
    it('deberia devolver 500 si la API de Resend responde con error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const res = await POST(crearRequest(VALID_PAYLOAD));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Error al enviar el mensaje. Inténtalo de nuevo.');
    });

    it('deberia devolver 500 si fetch lanza una excepcion', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const res = await POST(crearRequest(VALID_PAYLOAD));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Error interno del servidor');
    });
  });

  // ---------------------------------------------------
  // Cuerpo de la solicitud invalido
  // ---------------------------------------------------
  describe('Cuerpo de la solicitud invalido', () => {
    it('deberia devolver 500 si el cuerpo no es JSON valido', async () => {
      const request = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        body: 'esto no es json',
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(request);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Error interno del servidor');
    });
  });
});
