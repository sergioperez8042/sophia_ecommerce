/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Mockeamos auth-session para no cargar firebase-admin → jose (ESM que jest
// no transforma). El login solo usa setSessionCookies de ese módulo.
const mockSetSessionCookies = jest.fn();
jest.mock('@/lib/auth-session', () => ({
  setSessionCookies: (...a: unknown[]) => mockSetSessionCookies(...a),
}));

import { POST } from './route';

function loginRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'proj';
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'key';
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('devuelve 400 si faltan email/password', async () => {
    const res = await POST(loginRequest({}));
    expect(res.status).toBe(400);
  });

  it('login OK → 200, perfil del usuario y cookie de sesión', async () => {
    global.fetch = jest.fn(async (url: string) => {
      if (String(url).includes('accounts:signInWithPassword')) {
        return {
          ok: true,
          json: async () => ({ localId: 'u1', idToken: 'idt', refreshToken: 'rt', displayName: 'Test' }),
        } as Response;
      }
      // GET users/u1
      return {
        ok: true,
        json: async () => ({
          fields: {
            name: { stringValue: 'Maday' },
            email: { stringValue: 'm@t.com' },
            role: { stringValue: 'manager' },
            gestorId: { stringValue: 'g1' },
          },
        }),
      } as Response;
    }) as unknown as typeof fetch;

    const res = await POST(loginRequest({ email: 'm@t.com', password: 'secret123' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.role).toBe('manager');
    expect(data.user.gestorId).toBe('g1');
    expect(mockSetSessionCookies).toHaveBeenCalledWith(expect.anything(), {
      idToken: 'idt',
      refreshToken: 'rt',
    });
  });

  it('credenciales inválidas → 401 con mensaje mapeado', async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      json: async () => ({ error: { message: 'INVALID_PASSWORD' } }),
    })) as unknown as typeof fetch;

    const res = await POST(loginRequest({ email: 'm@t.com', password: 'bad' }));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Contraseña incorrecta');
  });
});
