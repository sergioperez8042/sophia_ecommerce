import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from './firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Verify the request has a valid authorization header.
 * Uses a shared API key approach (ADMIN_API_KEY env var).
 */
export function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) return false;

  return authHeader === `Bearer ${apiKey}`;
}

/**
 * Verify the request using a Firebase ID token.
 * Returns the decoded token if valid, null otherwise.
 */
export async function verifyFirebaseAuth(request: NextRequest): Promise<DecodedIdToken | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  if (!token) return null;

  const adminAuth = getAdminAuth();
  if (!adminAuth) return null;

  try {
    return await adminAuth.verifyIdToken(token);
  } catch {
    return null;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'No autorizado. Se requiere autenticación.' },
    { status: 401 }
  );
}
