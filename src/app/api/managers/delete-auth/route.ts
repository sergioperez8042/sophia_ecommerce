import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseAuth, unauthorizedResponse } from '@/lib/api-auth';
import { getAdminAuth } from '@/lib/firebase-admin-sdk';

export async function POST(request: NextRequest) {
  // Verify the caller is authenticated
  const caller = await verifyFirebaseAuth(request);
  if (!caller) return unauthorizedResponse();

  try {
    const { userId } = await request.json();
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    const adminAuth = getAdminAuth();
    await adminAuth.deleteUser(userId);

    return NextResponse.json({ success: true });
  } catch (err) {
    const error = err as { code?: string; message?: string };
    if (error.code === 'auth/user-not-found') {
      // User already deleted, that's fine
      return NextResponse.json({ success: true, note: 'User already deleted' });
    }
    console.error('Error deleting auth user:', error.message);
    return NextResponse.json(
      { error: 'Error al eliminar usuario de Auth' },
      { status: 500 }
    );
  }
}
