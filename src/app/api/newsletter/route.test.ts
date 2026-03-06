/**
 * @jest-environment node
 */

/**
 * Tests para la ruta API /api/newsletter
 *
 * POST: Envia un newsletter a los suscriptores (admin only, usa api-auth)
 * DELETE: Elimina un suscriptor (admin only, usa api-auth)
 *
 * Ambos requieren autorizacion via ADMIN_API_KEY.
 * Los suscriptores se guardan en un archivo JSON local.
 */

import { NextRequest } from 'next/server';
import { POST, DELETE } from './route';

// Mock de fs/promises
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
}));

// Mock de api-auth
jest.mock('@/lib/api-auth', () => ({
  isAuthorized: jest.fn(),
  unauthorizedResponse: jest.fn(() => {
    const { NextResponse } = require('next/server');
    return NextResponse.json(
      { error: 'No autorizado. Se requiere autenticación.' },
      { status: 401 }
    );
  }),
}));

// Mock de @/lib/resend
jest.mock('@/lib/resend', () => ({
  sendNewsletter: jest.fn(),
}));

import { readFile, writeFile, mkdir } from 'fs/promises';
import { isAuthorized } from '@/lib/api-auth';
import { sendNewsletter } from '@/lib/resend';

const mockIsAuthorized = isAuthorized as jest.MockedFunction<typeof isAuthorized>;
const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;
const mockMkdir = mkdir as jest.MockedFunction<typeof mkdir>;
const mockSendNewsletter = sendNewsletter as jest.MockedFunction<typeof sendNewsletter>;

const SUSCRIPTORES_MOCK = [
  { email: 'ana@example.com', subscribedAt: '2024-01-01T00:00:00Z', source: 'newsletter' },
  { email: 'juan@example.com', subscribedAt: '2024-02-01T00:00:00Z', source: 'checkout' },
  { email: 'laura@example.com', subscribedAt: '2024-03-01T00:00:00Z', source: 'contact' },
];

function crearRequest(
  metodo: string,
  body: Record<string, unknown>,
  headers?: Record<string, string>
): NextRequest {
  return new NextRequest('http://localhost/api/newsletter', {
    method: metodo,
    body: JSON.stringify(body),
    headers: headers || { Authorization: 'Bearer test-admin-key' },
  });
}

// =====================================================
// POST /api/newsletter - Enviar newsletter
// =====================================================
describe('POST /api/newsletter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthorized.mockReturnValue(true);
    mockReadFile.mockResolvedValue(JSON.stringify(SUSCRIPTORES_MOCK));
    mockSendNewsletter.mockResolvedValue({ success: true, results: [] });
  });

  // ---------------------------------------------------
  // Autorizacion
  // ---------------------------------------------------
  describe('Autorizacion', () => {
    it('deberia devolver 401 si no esta autorizado', async () => {
      mockIsAuthorized.mockReturnValue(false);

      const res = await POST(crearRequest('POST', { subject: 'Test', content: '<p>Hola</p>' }));
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('No autorizado. Se requiere autenticación.');
    });
  });

  // ---------------------------------------------------
  // Envio exitoso
  // ---------------------------------------------------
  describe('Envio exitoso de newsletter', () => {
    it('deberia enviar a todos los suscriptores y responder con exito', async () => {
      const res = await POST(
        crearRequest('POST', { subject: 'Novedades', content: '<p>Novedades de este mes</p>' })
      );
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.recipients).toBe(3);
      expect(data.message).toBe('Newsletter enviado a 3 destinatario(s)');
    });

    it('deberia pasar los emails de todos los suscriptores a sendNewsletter', async () => {
      await POST(
        crearRequest('POST', { subject: 'Novedades', content: '<p>Contenido</p>' })
      );

      expect(mockSendNewsletter).toHaveBeenCalledWith({
        to: ['ana@example.com', 'juan@example.com', 'laura@example.com'],
        subject: 'Novedades',
        content: '<p>Contenido</p>',
      });
    });

    it('deberia enviar solo al testEmail si se proporciona', async () => {
      await POST(
        crearRequest('POST', {
          subject: 'Test',
          content: '<p>Test</p>',
          testEmail: 'prueba@example.com',
        })
      );

      expect(mockSendNewsletter).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['prueba@example.com'],
        })
      );
    });
  });

  // ---------------------------------------------------
  // Validacion de campos
  // ---------------------------------------------------
  describe('Validacion de campos', () => {
    it('deberia devolver 400 si falta el asunto', async () => {
      const res = await POST(crearRequest('POST', { content: '<p>Contenido</p>' }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Asunto y contenido son requeridos');
    });

    it('deberia devolver 400 si falta el contenido', async () => {
      const res = await POST(crearRequest('POST', { subject: 'Novedades' }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Asunto y contenido son requeridos');
    });

    it('deberia devolver 400 si faltan ambos campos', async () => {
      const res = await POST(crearRequest('POST', {}));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Asunto y contenido son requeridos');
    });
  });

  // ---------------------------------------------------
  // Fallos del servicio
  // ---------------------------------------------------
  describe('Fallos del servicio de envio', () => {
    it('deberia devolver 500 si sendNewsletter falla', async () => {
      mockSendNewsletter.mockResolvedValueOnce({ success: false, error: 'API error' });

      const res = await POST(
        crearRequest('POST', { subject: 'Test', content: '<p>Test</p>' })
      );
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Error al enviar newsletter');
    });

    it('deberia devolver 500 si sendNewsletter lanza una excepcion', async () => {
      mockSendNewsletter.mockRejectedValueOnce(new Error('Network error'));

      const res = await POST(
        crearRequest('POST', { subject: 'Test', content: '<p>Test</p>' })
      );
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Error al enviar newsletter');
    });
  });

  // ---------------------------------------------------
  // Lista de suscriptores vacia
  // ---------------------------------------------------
  describe('Sin suscriptores', () => {
    it('deberia enviar a una lista vacia si no hay suscriptores', async () => {
      mockReadFile.mockRejectedValueOnce(new Error('File not found'));

      const res = await POST(
        crearRequest('POST', { subject: 'Test', content: '<p>Test</p>' })
      );
      const data = await res.json();

      // El route envia con lista vacia, sendNewsletter recibe []
      expect(res.status).toBe(200);
      expect(data.recipients).toBe(0);
    });
  });
});

// =====================================================
// DELETE /api/newsletter - Eliminar suscriptor
// =====================================================
describe('DELETE /api/newsletter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthorized.mockReturnValue(true);
    mockReadFile.mockResolvedValue(JSON.stringify(SUSCRIPTORES_MOCK));
    mockWriteFile.mockResolvedValue(undefined);
    mockMkdir.mockResolvedValue(undefined);
  });

  // ---------------------------------------------------
  // Autorizacion
  // ---------------------------------------------------
  describe('Autorizacion', () => {
    it('deberia devolver 401 si no esta autorizado', async () => {
      mockIsAuthorized.mockReturnValue(false);

      const res = await DELETE(crearRequest('DELETE', { email: 'ana@example.com' }));
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('No autorizado. Se requiere autenticación.');
    });
  });

  // ---------------------------------------------------
  // Eliminacion exitosa
  // ---------------------------------------------------
  describe('Eliminacion exitosa', () => {
    it('deberia eliminar el suscriptor y responder con exito', async () => {
      const res = await DELETE(crearRequest('DELETE', { email: 'ana@example.com' }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Suscriptor eliminado');
    });

    it('deberia guardar la lista sin el suscriptor eliminado', async () => {
      await DELETE(crearRequest('DELETE', { email: 'ana@example.com' }));

      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      const listaSalvada = JSON.parse(mockWriteFile.mock.calls[0][1] as string);
      expect(listaSalvada).toHaveLength(2);
      expect(listaSalvada.find((s: { email: string }) => s.email === 'ana@example.com')).toBeUndefined();
    });

    it('deberia ignorar mayusculas/minusculas en la busqueda', async () => {
      const res = await DELETE(crearRequest('DELETE', { email: 'ANA@Example.COM' }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  // ---------------------------------------------------
  // Validacion
  // ---------------------------------------------------
  describe('Validacion', () => {
    it('deberia devolver 400 si no se proporciona email', async () => {
      const res = await DELETE(crearRequest('DELETE', {}));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Email es requerido');
    });

    it('deberia devolver 404 si el suscriptor no existe', async () => {
      const res = await DELETE(crearRequest('DELETE', { email: 'noexiste@example.com' }));
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Suscriptor no encontrado');
    });
  });

  // ---------------------------------------------------
  // Errores del sistema de archivos
  // ---------------------------------------------------
  describe('Errores del sistema de archivos', () => {
    it('deberia devolver 500 si hay un error al leer/guardar suscriptores', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(SUSCRIPTORES_MOCK));
      mockMkdir.mockRejectedValueOnce(new Error('Permission denied'));

      const res = await DELETE(crearRequest('DELETE', { email: 'ana@example.com' }));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Error al eliminar suscriptor');
    });
  });
});
