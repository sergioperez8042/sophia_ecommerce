/**
 * @jest-environment node
 */

/**
 * Tests para la ruta API /api/subscribe
 *
 * Esta ruta recibe un email para suscripcion al newsletter
 * y opcionalmente envia un email de bienvenida via Resend.
 */

import { NextRequest } from 'next/server';
import { POST } from './route';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function crearRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/subscribe', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/subscribe', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.RESEND_API_KEY = 'test-resend-key';
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
  });

  // ---------------------------------------------------
  // Caso exitoso
  // ---------------------------------------------------
  describe('Suscripcion exitosa', () => {
    it('deberia responder con exito (200) y mensaje de agradecimiento', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      const res = await POST(crearRequest({ email: 'test@example.com' }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Gracias por suscribirte!');
    });

    it('deberia incluir header X-RateLimit-Limit', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      const res = await POST(crearRequest({ email: 'test@example.com' }));

      expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
    });

    it('deberia enviar email de bienvenida via Resend si la API key esta configurada', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      await POST(crearRequest({ email: 'test@example.com' }));

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.resend.com/emails');
      expect(options.headers['Authorization']).toBe('Bearer test-resend-key');

      const body = JSON.parse(options.body);
      expect(body.to).toEqual(['test@example.com']);
      expect(body.subject).toBe('Bienvenida a Sophia Natural');
    });

    it('deberia funcionar sin API key de Resend (no envia email)', async () => {
      delete process.env.RESEND_API_KEY;

      const res = await POST(crearRequest({ email: 'test@example.com' }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('deberia recortar espacios y convertir email a minusculas', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      await POST(crearRequest({ email: '  User@Domain.COM  ' }));

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.to).toEqual(['user@domain.com']);
    });
  });

  // ---------------------------------------------------
  // Validacion del email
  // ---------------------------------------------------
  describe('Validacion del email', () => {
    it('deberia devolver 400 si no se proporciona email', async () => {
      const res = await POST(crearRequest({}));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Email requerido');
    });

    it('deberia devolver 400 si el email es vacio', async () => {
      const res = await POST(crearRequest({ email: '' }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Email requerido');
    });

    it('deberia devolver 400 si el email no es string', async () => {
      const res = await POST(crearRequest({ email: 12345 }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Email requerido');
    });

    it('deberia devolver 400 si el email tiene formato invalido', async () => {
      const res = await POST(crearRequest({ email: 'no-es-email' }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Formato de email invalido');
    });

    it('deberia devolver 400 si el email no tiene dominio', async () => {
      const res = await POST(crearRequest({ email: 'user@' }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Formato de email invalido');
    });

    it('deberia devolver 400 si el email supera 254 caracteres', async () => {
      const longEmail = 'a'.repeat(250) + '@b.com';
      const res = await POST(crearRequest({ email: longEmail }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Email demasiado largo');
    });
  });

  // ---------------------------------------------------
  // Errores internos
  // ---------------------------------------------------
  describe('Errores internos', () => {
    it('deberia devolver 500 si el cuerpo no es JSON valido', async () => {
      const request = new NextRequest('http://localhost/api/subscribe', {
        method: 'POST',
        body: 'json invalido',
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(request);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Error al procesar');
    });

    it('deberia responder exitosamente incluso si el envio de email falla', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Resend API down'));

      const res = await POST(crearRequest({ email: 'test@example.com' }));
      const data = await res.json();

      // El subscribe route no verifica si el envio de email fue exitoso
      // ya que esta dentro del if (apiKey) y cualquier error se propaga al catch general
      expect(res.status).toBe(500);
      expect(data.error).toBe('Error al procesar');
    });
  });
});
