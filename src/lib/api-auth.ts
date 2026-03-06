import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify the request has a valid authorization header.
 * Uses a shared API key approach (ADMIN_API_KEY env var).
 * This matches the existing pattern in newsletter/send/route.ts.
 */
export function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) return false;

  return authHeader === `Bearer ${apiKey}`;
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'No autorizado. Se requiere autenticación.' },
    { status: 401 }
  );
}
