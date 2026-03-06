import { NextRequest, NextResponse } from 'next/server';

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Validate email format
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json({ error: 'Formato de email invalido' }, { status: 400 });
    }

    // Limit email length to prevent abuse
    if (trimmedEmail.length > 254) {
      return NextResponse.json({ error: 'Email demasiado largo' }, { status: 400 });
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
          to: [trimmedEmail],
          subject: 'Bienvenida a Sophia Natural',
          html: '<h1>Hola!</h1><p>Gracias por suscribirte. Usa el codigo <strong>BIENVENIDA10</strong> para 10% de descuento.</p>',
        }),
      });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Gracias por suscribirte!',
    });

    // Add rate limiting headers for downstream proxies/CDN
    response.headers.set('X-RateLimit-Limit', '10');

    return response;

  } catch {
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 });
  }
}
