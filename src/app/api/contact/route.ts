import { NextRequest, NextResponse } from 'next/server';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const OWNER_EMAIL = 'chavesophia1994@gmail.com';

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      return NextResponse.json({ error: 'Nombre inválido' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail) || trimmedEmail.length > 254) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    if (typeof subject !== 'string' || subject.trim().length < 2 || subject.trim().length > 200) {
      return NextResponse.json({ error: 'Asunto inválido' }, { status: 400 });
    }

    if (typeof message !== 'string' || message.trim().length < 10 || message.trim().length > 5000) {
      return NextResponse.json({ error: 'El mensaje debe tener al menos 10 caracteres' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Servicio de email no configurado. Por favor, contáctanos por WhatsApp.' },
        { status: 503 }
      );
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Sophia Web <onboarding@resend.dev>',
        to: [OWNER_EMAIL],
        reply_to: trimmedEmail,
        subject: `[Contacto Web] ${subject.trim()}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #505A4A;">Nuevo mensaje de contacto</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666;"><strong>Nombre:</strong></td><td style="padding: 8px 0;">${name.trim()}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td><td style="padding: 8px 0;"><a href="mailto:${trimmedEmail}">${trimmedEmail}</a></td></tr>
              <tr><td style="padding: 8px 0; color: #666;"><strong>Asunto:</strong></td><td style="padding: 8px 0;">${subject.trim()}</td></tr>
            </table>
            <div style="margin-top: 16px; padding: 16px; background: #f5f1e8; border-radius: 8px;">
              <p style="color: #333; white-space: pre-wrap;">${message.trim()}</p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Error al enviar el mensaje. Inténtalo de nuevo.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Mensaje enviado correctamente' });
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
