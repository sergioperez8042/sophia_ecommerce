import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    // Send welcome email via Resend API
    const apiKey = process.env.RESEND_API_KEY;
    
    if (apiKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Sophia <onboarding@resend.dev>',
          to: [email],
          subject: 'Bienvenida a Sophia Natural',
          html: '<h1>Hola!</h1><p>Gracias por suscribirte. Usa el codigo <strong>BIENVENIDA10</strong> para 10% de descuento.</p>',
        }),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Gracias por suscribirte!',
    });

  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 });
  }
}
