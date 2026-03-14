import { NextResponse } from 'next/server';

// This route is deprecated - subscriber management is now done via Firestore
// through the admin UI directly. The /api/newsletter/send route handles sending.

export async function GET() {
  return NextResponse.json({
    message: 'Use /api/newsletter/send for newsletter operations. Subscribers are managed via Firestore.',
  });
}
