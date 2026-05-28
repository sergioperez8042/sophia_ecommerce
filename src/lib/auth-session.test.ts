/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';

const mockVerify = jest.fn();
jest.mock('./firebase-admin', () => ({
  verifyFirebaseToken: (...args: unknown[]) => mockVerify(...args),
}));

import {
  getValidSession,
  getSessionUser,
  setSessionCookies,
  clearSessionCookies,
} from './auth-session';

function reqWithCookies(cookies: Record<string, string>): NextRequest {
  const cookie = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
  return new NextRequest('http://localhost/api/x', { headers: { cookie } });
}

describe('auth-session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'proj';
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'key';
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('cookies', () => {
    it('setSessionCookies escribe id + refresh; clear las vacía', () => {
      const res = NextResponse.json({ ok: true });
      setSessionCookies(res, { idToken: 'idt', refreshToken: 'ref' });
      expect(res.cookies.get('sophia_fb_id')?.value).toBe('idt');
      expect(res.cookies.get('sophia_fb_refresh')?.value).toBe('ref');

      clearSessionCookies(res);
      expect(res.cookies.get('sophia_fb_id')?.value).toBe('');
      expect(res.cookies.get('sophia_fb_refresh')?.value).toBe('');
    });
  });

  describe('getValidSession', () => {
    it('idToken válido → sesión sin refresh', async () => {
      mockVerify.mockResolvedValue({ uid: 'u1' });
      const session = await getValidSession(reqWithCookies({ sophia_fb_id: 'good' }));
      expect(session).toEqual({ uid: 'u1', idToken: 'good', refreshed: false });
    });

    it('idToken expirado + refresh válido → refresca y marca refreshed', async () => {
      // 1ª verificación (idToken viejo) → null; 2ª (idToken nuevo) → uid
      mockVerify.mockResolvedValueOnce(null).mockResolvedValueOnce({ uid: 'u1' });
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id_token: 'newId', refresh_token: 'newRef' }),
      }) as unknown as typeof fetch;

      const session = await getValidSession(
        reqWithCookies({ sophia_fb_id: 'expired', sophia_fb_refresh: 'ref' }),
      );
      expect(session).toEqual({
        uid: 'u1',
        idToken: 'newId',
        tokens: { idToken: 'newId', refreshToken: 'newRef' },
        refreshed: true,
      });
    });

    it('sin cookies → null', async () => {
      const session = await getValidSession(reqWithCookies({}));
      expect(session).toBeNull();
    });

    it('idToken inválido y sin refresh → null', async () => {
      mockVerify.mockResolvedValue(null);
      const session = await getValidSession(reqWithCookies({ sophia_fb_id: 'bad' }));
      expect(session).toBeNull();
    });
  });

  describe('getSessionUser', () => {
    it('lee users/{uid} y mapea el perfil', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          fields: {
            name: { stringValue: 'Maday' },
            email: { stringValue: 'maday@test.com' },
            role: { stringValue: 'manager' },
            gestorId: { stringValue: 'g1' },
          },
        }),
      }) as unknown as typeof fetch;

      const user = await getSessionUser({ uid: 'u1', idToken: 'idt', refreshed: false });
      expect(user).toEqual({
        id: 'u1',
        name: 'Maday',
        email: 'maday@test.com',
        role: 'manager',
        phone: undefined,
        avatar: undefined,
        managerCode: undefined,
        zone: undefined,
        gestorId: 'g1',
        createdAt: undefined,
      });
    });

    it('devuelve null si el doc no existe', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 }) as unknown as typeof fetch;
      const user = await getSessionUser({ uid: 'u1', idToken: 'idt', refreshed: false });
      expect(user).toBeNull();
    });
  });
});
