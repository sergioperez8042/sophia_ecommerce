/**
 * @jest-environment node
 */

/**
 * Tests para la ruta API /api/send-order
 *
 * Esta ruta recibe los datos de un pedido y envia dos emails:
 * 1. Email al negocio con los detalles del pedido
 * 2. Email de confirmacion al cliente
 * Usa nodemailer con servicio Gmail.
 */

import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock de nodemailer
const mockSendMail = jest.fn();
jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({
      sendMail: mockSendMail,
    })),
  },
}));

const VALID_SHIPPING_INFO = {
  firstName: 'Maria',
  lastName: 'Garcia',
  email: 'maria@example.com',
  phone: '+34612345678',
  address: 'Calle Mayor 1',
  city: 'Madrid',
  postalCode: '28001',
  country: 'Espana',
};

const VALID_ITEMS = [
  {
    product: {
      id: 1,
      name: 'Crema Facial Natural',
      price: 29.99,
      image: '/images/crema.jpg',
    },
    quantity: 2,
  },
  {
    product: {
      id: 2,
      name: 'Serum Vitamina C',
      price: 39.99,
      image: '/images/serum.jpg',
    },
    quantity: 1,
  },
];

const VALID_PAYLOAD = {
  orderNumber: 'ORD-2024-001',
  shippingInfo: VALID_SHIPPING_INFO,
  items: VALID_ITEMS,
  subtotal: 99.97,
  shipping: 0,
  total: 99.97,
  pdfBase64: Buffer.from('fake pdf content').toString('base64'),
};

function crearRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/send-order', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/send-order', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BUSINESS_EMAIL = 'negocio@sophia.com';
    process.env.EMAIL_USER = 'noreply@sophia.com';
    process.env.EMAIL_PASS = 'test-password';
    mockSendMail.mockResolvedValue({ messageId: 'msg-123' });
  });

  afterEach(() => {
    delete process.env.BUSINESS_EMAIL;
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;
  });

  // ---------------------------------------------------
  // Envio exitoso
  // ---------------------------------------------------
  describe('Envio exitoso', () => {
    it('deberia enviar ambos emails y responder con exito', async () => {
      const res = await POST(crearRequest(VALID_PAYLOAD));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Emails enviados correctamente');
      expect(mockSendMail).toHaveBeenCalledTimes(2);
    });

    it('deberia enviar el primer email al negocio', async () => {
      await POST(crearRequest(VALID_PAYLOAD));

      const primerEmail = mockSendMail.mock.calls[0][0];
      expect(primerEmail.to).toBe('negocio@sophia.com');
      expect(primerEmail.subject).toContain('ORD-2024-001');
      expect(primerEmail.subject).toContain('Maria Garcia');
    });

    it('deberia enviar el segundo email al cliente', async () => {
      await POST(crearRequest(VALID_PAYLOAD));

      const segundoEmail = mockSendMail.mock.calls[1][0];
      expect(segundoEmail.to).toBe('maria@example.com');
      expect(segundoEmail.subject).toContain('Confirmacion de Pedido');
      expect(segundoEmail.subject).toContain('ORD-2024-001');
    });

    it('deberia adjuntar el PDF en ambos emails', async () => {
      await POST(crearRequest(VALID_PAYLOAD));

      const primerEmail = mockSendMail.mock.calls[0][0];
      expect(primerEmail.attachments).toHaveLength(1);
      expect(primerEmail.attachments[0].filename).toBe('Pedido-ORD-2024-001.pdf');
      expect(primerEmail.attachments[0].contentType).toBe('application/pdf');

      const segundoEmail = mockSendMail.mock.calls[1][0];
      expect(segundoEmail.attachments).toHaveLength(1);
      expect(segundoEmail.attachments[0].filename).toBe('Pedido-ORD-2024-001.pdf');
    });

    it('deberia incluir el contenido HTML del pedido en el email al negocio', async () => {
      await POST(crearRequest(VALID_PAYLOAD));

      const primerEmail = mockSendMail.mock.calls[0][0];
      expect(primerEmail.html).toContain('Maria Garcia');
      expect(primerEmail.html).toContain('maria@example.com');
      expect(primerEmail.html).toContain('+34612345678');
      expect(primerEmail.html).toContain('Calle Mayor 1');
    });

    it('deberia mostrar envio GRATIS cuando el costo es 0', async () => {
      await POST(crearRequest({ ...VALID_PAYLOAD, shipping: 0 }));

      const primerEmail = mockSendMail.mock.calls[0][0];
      expect(primerEmail.html).toContain('GRATIS');
    });

    it('deberia mostrar el costo de envio cuando no es 0', async () => {
      await POST(crearRequest({ ...VALID_PAYLOAD, shipping: 5.99 }));

      const primerEmail = mockSendMail.mock.calls[0][0];
      expect(primerEmail.html).toContain('$5.99');
    });
  });

  // ---------------------------------------------------
  // Escape de HTML (XSS)
  // ---------------------------------------------------
  describe('Escape de HTML para prevenir XSS', () => {
    it('deberia escapar caracteres HTML en el nombre', async () => {
      const payload = {
        ...VALID_PAYLOAD,
        shippingInfo: {
          ...VALID_SHIPPING_INFO,
          firstName: '<script>alert("xss")</script>',
          lastName: 'Garcia&Familia',
        },
      };

      await POST(crearRequest(payload));

      const primerEmail = mockSendMail.mock.calls[0][0];
      expect(primerEmail.html).not.toContain('<script>');
      expect(primerEmail.html).toContain('&lt;script&gt;');
      expect(primerEmail.html).toContain('Garcia&amp;Familia');
    });

    it('deberia escapar caracteres HTML en el numero de pedido', async () => {
      const payload = {
        ...VALID_PAYLOAD,
        orderNumber: '<img src=x onerror=alert(1)>',
      };

      await POST(crearRequest(payload));

      const primerEmail = mockSendMail.mock.calls[0][0];
      expect(primerEmail.html).not.toContain('<img');
      expect(primerEmail.html).toContain('&lt;img');
    });
  });

  // ---------------------------------------------------
  // Configuracion del servicio
  // ---------------------------------------------------
  describe('Configuracion del servicio de email', () => {
    it('deberia devolver 503 si falta BUSINESS_EMAIL', async () => {
      delete process.env.BUSINESS_EMAIL;

      const res = await POST(crearRequest(VALID_PAYLOAD));
      const data = await res.json();

      expect(res.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email service not configured');
    });

    it('deberia devolver 503 si falta EMAIL_USER', async () => {
      delete process.env.EMAIL_USER;

      const res = await POST(crearRequest(VALID_PAYLOAD));
      const data = await res.json();

      expect(res.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email service not configured');
    });

    it('deberia devolver 503 si falta EMAIL_PASS', async () => {
      delete process.env.EMAIL_PASS;

      const res = await POST(crearRequest(VALID_PAYLOAD));
      const data = await res.json();

      expect(res.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email service not configured');
    });
  });

  // ---------------------------------------------------
  // Fallos del servicio de email
  // ---------------------------------------------------
  describe('Fallos del servicio de email', () => {
    it('deberia devolver 500 si sendMail falla en el primer envio', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP connection refused'));

      const res = await POST(crearRequest(VALID_PAYLOAD));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Error al enviar el email');
    });

    it('deberia devolver 500 si sendMail falla en el segundo envio', async () => {
      mockSendMail
        .mockResolvedValueOnce({ messageId: 'msg-1' })
        .mockRejectedValueOnce(new Error('Rate limit exceeded'));

      const res = await POST(crearRequest(VALID_PAYLOAD));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Error al enviar el email');
    });
  });

  // ---------------------------------------------------
  // Cuerpo invalido
  // ---------------------------------------------------
  describe('Cuerpo de solicitud invalido', () => {
    it('deberia devolver 500 si el cuerpo no es JSON valido', async () => {
      const request = new NextRequest('http://localhost/api/send-order', {
        method: 'POST',
        body: 'no es json',
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(request);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Error al enviar el email');
    });

    it('deberia devolver 500 si faltan propiedades del shippingInfo', async () => {
      const payload = {
        ...VALID_PAYLOAD,
        shippingInfo: { firstName: 'Maria' },
      };

      const res = await POST(crearRequest(payload));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  // ---------------------------------------------------
  // Multiples items
  // ---------------------------------------------------
  describe('Multiples items en el pedido', () => {
    it('deberia incluir todos los productos en el email', async () => {
      await POST(crearRequest(VALID_PAYLOAD));

      const primerEmail = mockSendMail.mock.calls[0][0];
      expect(primerEmail.html).toContain('Crema Facial Natural');
      expect(primerEmail.html).toContain('Serum Vitamina C');
    });
  });
});
