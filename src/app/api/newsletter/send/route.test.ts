/**
 * @jest-environment node
 */

/**
 * Tests para la ruta API /api/newsletter/send
 *
 * POST: Envia newsletter a suscriptores activos de Firebase (requiere NEWSLETTER_API_KEY)
 * GET: Lista newsletters enviados desde Firebase (requiere NEWSLETTER_API_KEY)
 *
 * Usa su propia autorizacion local (authHeader === Bearer NEWSLETTER_API_KEY).
 * Los suscriptores se obtienen de Firestore y el envio se hace via lib/resend.
 */

import { NextRequest } from 'next/server';
import { POST, GET } from './route';

// Mock de firebase/firestore
const mockGetDocs = jest.fn();
const mockAddDoc = jest.fn();
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date('2024-06-01T12:00:00Z') })),
  },
}));

// Mock de @/lib/firebase
jest.mock('@/lib/firebase', () => ({
  db: { type: 'mock-firestore' },
}));

// Mock de @/lib/resend
jest.mock('@/lib/resend', () => ({
  sendNewsletter: jest.fn(),
}));

import { sendNewsletter } from '@/lib/resend';

const mockSendNewsletter = sendNewsletter as jest.MockedFunction<typeof sendNewsletter>;

function crearRequest(
  metodo: string,
  body?: Record<string, unknown>
): NextRequest {
  const options: RequestInit & { headers: Record<string, string> } = {
    method: metodo,
    headers: { Authorization: `Bearer test-newsletter-key` },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return new NextRequest('http://localhost/api/newsletter/send', options as never);
}

function crearRequestSinAuth(
  metodo: string,
  body?: Record<string, unknown>
): NextRequest {
  const options: RequestInit = { method: metodo };
  if (body) {
    options.body = JSON.stringify(body);
  }
  return new NextRequest('http://localhost/api/newsletter/send', options as never);
}

// =====================================================
// POST /api/newsletter/send - Enviar newsletter
// =====================================================
describe('POST /api/newsletter/send', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEWSLETTER_API_KEY = 'test-newsletter-key';
    mockCollection.mockReturnValue('subscribers-collection-ref');
    mockQuery.mockReturnValue('query-ref');
    mockWhere.mockReturnValue('where-ref');
    mockAddDoc.mockResolvedValue({ id: 'newsletter-doc-123' });
  });

  afterEach(() => {
    delete process.env.NEWSLETTER_API_KEY;
  });

  // ---------------------------------------------------
  // Autorizacion
  // ---------------------------------------------------
  describe('Autorizacion', () => {
    it('deberia devolver 401 si no hay header de autorizacion', async () => {
      const res = await POST(
        crearRequestSinAuth('POST', { subject: 'Test', content: '<p>Hola</p>' })
      );
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('No autorizado');
    });

    it('deberia devolver 401 si la API key es incorrecta', async () => {
      const request = new NextRequest('http://localhost/api/newsletter/send', {
        method: 'POST',
        headers: { Authorization: 'Bearer wrong-key' },
        body: JSON.stringify({ subject: 'Test', content: '<p>Hola</p>' }),
      });

      const res = await POST(request);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('No autorizado');
    });

    it('deberia devolver 401 si NEWSLETTER_API_KEY no esta configurada', async () => {
      delete process.env.NEWSLETTER_API_KEY;

      const res = await POST(crearRequest('POST', { subject: 'Test', content: '<p>Hola</p>' }));
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('No autorizado');
    });
  });

  // ---------------------------------------------------
  // Envio exitoso
  // ---------------------------------------------------
  describe('Envio exitoso', () => {
    it('deberia enviar newsletter a suscriptores activos y responder con exito', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { data: () => ({ email: 'ana@example.com', active: true }) },
          { data: () => ({ email: 'juan@example.com', active: true }) },
        ],
      });
      mockSendNewsletter.mockResolvedValueOnce({ success: true, results: [] });

      const res = await POST(
        crearRequest('POST', { subject: 'Novedades', content: '<p>Novedades</p>' })
      );
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.recipientCount).toBe(2);
      expect(data.message).toBe('Newsletter enviada a 2 suscriptores');
    });

    it('deberia llamar a sendNewsletter con los parametros correctos', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [{ data: () => ({ email: 'test@example.com' }) }],
      });
      mockSendNewsletter.mockResolvedValueOnce({ success: true, results: [] });

      await POST(
        crearRequest('POST', {
          subject: 'Promo',
          content: '<p>Promocion</p>',
          previewText: 'Vista previa',
        })
      );

      expect(mockSendNewsletter).toHaveBeenCalledWith({
        to: ['test@example.com'],
        subject: 'Promo',
        content: '<p>Promocion</p>',
        previewText: 'Vista previa',
      });
    });

    it('deberia guardar un registro del newsletter en Firestore', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [{ data: () => ({ email: 'test@example.com' }) }],
      });
      mockSendNewsletter.mockResolvedValueOnce({ success: true, results: [] });

      await POST(
        crearRequest('POST', { subject: 'Test', content: '<p>Contenido</p>' })
      );

      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      const registroGuardado = mockAddDoc.mock.calls[0][1];
      expect(registroGuardado.subject).toBe('Test');
      expect(registroGuardado.content).toBe('<p>Contenido</p>');
      expect(registroGuardado.recipientCount).toBe(1);
      expect(registroGuardado.success).toBe(true);
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
      expect(data.error).toBe('El asunto y contenido son requeridos');
    });

    it('deberia devolver 400 si falta el contenido', async () => {
      const res = await POST(crearRequest('POST', { subject: 'Asunto' }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('El asunto y contenido son requeridos');
    });
  });

  // ---------------------------------------------------
  // Sin suscriptores activos
  // ---------------------------------------------------
  describe('Sin suscriptores activos', () => {
    it('deberia devolver 400 si no hay suscriptores activos', async () => {
      mockGetDocs.mockResolvedValueOnce({ docs: [] });

      const res = await POST(
        crearRequest('POST', { subject: 'Test', content: '<p>Test</p>' })
      );
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('No hay suscriptores activos');
    });
  });

  // ---------------------------------------------------
  // Fallo del servicio de envio
  // ---------------------------------------------------
  describe('Fallo del servicio de envio', () => {
    it('deberia devolver 500 si sendNewsletter devuelve error', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [{ data: () => ({ email: 'test@example.com' }) }],
      });
      mockSendNewsletter.mockResolvedValueOnce({
        success: false,
        error: 'Resend API error',
      });

      const res = await POST(
        crearRequest('POST', { subject: 'Test', content: '<p>Test</p>' })
      );
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Resend API error');
    });

    it('deberia guardar el registro incluso si el envio falla', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [{ data: () => ({ email: 'test@example.com' }) }],
      });
      mockSendNewsletter.mockResolvedValueOnce({ success: false, error: 'Error' });

      await POST(crearRequest('POST', { subject: 'Test', content: '<p>Test</p>' }));

      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      const registro = mockAddDoc.mock.calls[0][1];
      expect(registro.success).toBe(false);
    });
  });

  // ---------------------------------------------------
  // Error de Firebase
  // ---------------------------------------------------
  describe('Error de Firebase', () => {
    it('deberia devolver 500 si Firestore lanza una excepcion', async () => {
      mockGetDocs.mockRejectedValueOnce(new Error('Firestore unavailable'));

      const res = await POST(
        crearRequest('POST', { subject: 'Test', content: '<p>Test</p>' })
      );
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Error al enviar la newsletter');
    });
  });
});

// =====================================================
// GET /api/newsletter/send - Listar newsletters
// =====================================================
describe('GET /api/newsletter/send', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEWSLETTER_API_KEY = 'test-newsletter-key';
  });

  afterEach(() => {
    delete process.env.NEWSLETTER_API_KEY;
  });

  // ---------------------------------------------------
  // Autorizacion
  // ---------------------------------------------------
  describe('Autorizacion', () => {
    it('deberia devolver 401 si no esta autorizado', async () => {
      const res = await GET(crearRequestSinAuth('GET'));
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('No autorizado');
    });
  });

  // ---------------------------------------------------
  // Listado exitoso
  // ---------------------------------------------------
  describe('Listado exitoso', () => {
    it('deberia listar newsletters ordenados por fecha descendente', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'nl-1',
            data: () => ({
              subject: 'Newsletter Enero',
              content: '<p>Enero</p>',
              previewText: 'Preview enero',
              recipientCount: 10,
              success: true,
              sentAt: { toDate: () => new Date('2024-01-15T10:00:00Z') },
            }),
          },
          {
            id: 'nl-2',
            data: () => ({
              subject: 'Newsletter Marzo',
              content: '<p>Marzo</p>',
              previewText: 'Preview marzo',
              recipientCount: 15,
              success: true,
              sentAt: { toDate: () => new Date('2024-03-15T10:00:00Z') },
            }),
          },
        ],
      });

      const res = await GET(crearRequest('GET'));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.total).toBe(2);
      expect(data.newsletters).toHaveLength(2);
      // Debe estar ordenado por fecha descendente (Marzo antes que Enero)
      expect(data.newsletters[0].subject).toBe('Newsletter Marzo');
      expect(data.newsletters[1].subject).toBe('Newsletter Enero');
    });

    it('deberia devolver lista vacia si no hay newsletters', async () => {
      mockGetDocs.mockResolvedValueOnce({ docs: [] });

      const res = await GET(crearRequest('GET'));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.total).toBe(0);
      expect(data.newsletters).toEqual([]);
    });

    it('deberia manejar newsletters sin campo sentAt', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'nl-1',
            data: () => ({
              subject: 'Sin fecha',
              content: '<p>Sin fecha</p>',
              sentAt: undefined,
            }),
          },
        ],
      });

      const res = await GET(crearRequest('GET'));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.total).toBe(1);
      expect(data.newsletters[0].sentAt).toBeNull();
    });
  });

  // ---------------------------------------------------
  // Error de Firebase
  // ---------------------------------------------------
  describe('Error de Firebase', () => {
    it('deberia devolver 500 si Firestore lanza una excepcion', async () => {
      mockGetDocs.mockRejectedValueOnce(new Error('Firestore error'));

      const res = await GET(crearRequest('GET'));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Error al obtener newsletters');
    });
  });
});
