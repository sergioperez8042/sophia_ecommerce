import { NextResponse } from 'next/server';

// This endpoint is informational only.
// Gestores CRUD is handled client-side via GestorService in firestore-services.ts
// This route provides a way to seed initial data via a simple POST call.

export async function GET() {
  return NextResponse.json({
    message: 'Gestores API - Use client-side GestorService for CRUD operations',
    seedEndpoint: 'POST /api/gestores with { seed: true } to create initial gestores',
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.seed) {
      // Return seed data that the client should use with GestorService
      return NextResponse.json({
        message: 'Use GestorService.seed() on the client with this data:',
        gestores: [
          {
            name: 'Arturo',
            whatsapp: '5352010900',
            province: 'La Habana',
            municipalities: ['Diez de Octubre', 'Habana del Este', 'Centro Habana'],
            active: true,
          },
        ],
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
