/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from './route';

function orderRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/orders', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

const validBody = {
  items: [{ productId: 'p1', name: 'Serum', price: 10, quantity: 2, image: '' }],
  subtotal: 20,
  province: 'La Habana',
  municipality: 'La Habana del Este',
  gestorId: 'arturo',
  customerName: 'Maday',
};

describe('POST /api/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'proj';
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'key';
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('400 si no hay productos', async () => {
    const res = await POST(orderRequest({ subtotal: 0, items: [] }));
    expect(res.status).toBe(400);
  });

  it('400 si falta subtotal', async () => {
    const res = await POST(orderRequest({ items: validBody.items }));
    expect(res.status).toBe(400);
  });

  it('crea el pedido y devuelve orderNumber + id', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ name: 'projects/p/databases/(default)/documents/orders/abc123' }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await POST(orderRequest(validBody));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.id).toBe('abc123');
    expect(data.orderNumber).toMatch(/^SPH-\d{8}-\d{6}$/);

    // El body enviado a Firestore incluye status pending y los campos del pedido
    const sentBody = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(sentBody.fields.status).toEqual({ stringValue: 'pending' });
    expect(sentBody.fields.gestorId).toEqual({ stringValue: 'arturo' });
  });

  it('propaga 403 cuando la regla de Firestore deniega el create', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'PERMISSION_DENIED',
    }) as unknown as typeof fetch;

    const res = await POST(orderRequest(validBody));
    expect(res.status).toBe(403);
  });
});
