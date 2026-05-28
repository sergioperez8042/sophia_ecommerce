/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

const mockGetValidSession = jest.fn();
const mockGetSessionUser = jest.fn();

jest.mock('@/lib/auth-session', () => ({
  getValidSession: (...a: unknown[]) => mockGetValidSession(...a),
  getSessionUser: (...a: unknown[]) => mockGetSessionUser(...a),
  setSessionCookies: jest.fn(),
}));

import { GET } from './route';

function req(): NextRequest {
  return new NextRequest('http://localhost/api/manager/orders');
}

describe('GET /api/manager/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'proj';
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'key';
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sin sesión → 401', async () => {
    mockGetValidSession.mockResolvedValue(null);
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it('rol distinto de manager/admin → 403', async () => {
    mockGetValidSession.mockResolvedValue({ uid: 'u1', idToken: 'idt', refreshed: false });
    mockGetSessionUser.mockResolvedValue({ id: 'u1', role: 'client' });
    const res = await GET(req());
    expect(res.status).toBe(403);
  });

  it('manager → devuelve { gestor, orders } ordenados desc por createdAt', async () => {
    mockGetValidSession.mockResolvedValue({ uid: 'u1', idToken: 'idt', refreshed: false });
    mockGetSessionUser.mockResolvedValue({ id: 'u1', role: 'manager', gestorId: 'g1' });

    global.fetch = jest.fn(async (url: string) => {
      if (String(url).includes('/gestores/g1')) {
        return {
          ok: true,
          json: async () => ({ fields: { name: { stringValue: 'Arturo' } } }),
        } as Response;
      }
      // :runQuery sobre orders
      return {
        ok: true,
        json: async () => [
          {
            document: {
              name: 'projects/p/databases/(default)/documents/orders/o1',
              fields: { gestorId: { stringValue: 'g1' }, createdAt: { stringValue: '2026-05-01' } },
            },
          },
          {
            document: {
              name: 'projects/p/databases/(default)/documents/orders/o2',
              fields: { gestorId: { stringValue: 'g1' }, createdAt: { stringValue: '2026-05-10' } },
            },
          },
        ],
      } as Response;
    }) as unknown as typeof fetch;

    const res = await GET(req());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.gestor).toEqual({ id: 'g1', name: 'Arturo' });
    expect(data.orders.map((o: { id: string }) => o.id)).toEqual(['o2', 'o1']); // desc
  });
});
