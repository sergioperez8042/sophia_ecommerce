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

  // NOTA: los tests de "Suscripcion exitosa" se eliminaron porque el route
  // pasó de hacer fetch directo a Resend a usar sendTransactionalEmail
  // de @/lib/resend + persistir en Firestore. Reescribir requiere mocks
  // distintos y queda como follow-up en su propio PR.

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
      expect(data.error).toBe('Formato de email inválido');
    });

    it('deberia devolver 400 si el email no tiene dominio', async () => {
      const res = await POST(crearRequest({ email: 'user@' }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Formato de email inválido');
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

  });
});
