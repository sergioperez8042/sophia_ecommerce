import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function POST(request: NextRequest) {
  try {
    const { email, source = 'footer', name } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json({ error: 'Formato de email inválido' }, { status: 400 });
    }

    if (trimmedEmail.length > 254) {
      return NextResponse.json({ error: 'Email demasiado largo' }, { status: 400 });
    }

    // Check if already exists in Firestore
    if (db) {
      const q = query(
        collection(db, 'subscribers'),
        where('email', '==', trimmedEmail)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        return NextResponse.json({
          success: true,
          message: '¡Ya estás suscrito!',
          alreadySubscribed: true,
        });
      }

      // Save to Firestore
      await addDoc(collection(db, 'subscribers'), {
        email: trimmedEmail,
        name: name?.trim() || '',
        active: true,
        source: source || 'footer',
        subscribedAt: Timestamp.now(),
      });
    }

    // Send welcome email via Resend
    try {
      const { sendTransactionalEmail } = await import('@/lib/resend');

      await sendTransactionalEmail(
        trimmedEmail,
        '¡Bienvenida a Sophia Cosmética Botánica! 🌿',
        `
        <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #1a1d19; color: #e8e0d0; padding: 40px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #C4B590; font-size: 24px; margin: 0;">Sophia</h1>
            <p style="color: #C4B590; font-size: 14px; margin: 5px 0 0;">Cosmética Botánica</p>
          </div>
          <h2 style="color: #C4B590; font-size: 20px;">¡Gracias por suscribirte!</h2>
          <p style="line-height: 1.6; color: #d4cdc0;">
            Ahora formas parte de nuestra comunidad de belleza natural.
            Recibirás tips de cuidado, novedades y ofertas exclusivas.
          </p>
          <div style="background: #2a2d25; border: 1px solid #C4B590; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
            <p style="margin: 0 0 8px; color: #C4B590; font-size: 14px;">Tu código de descuento:</p>
            <p style="margin: 0; font-size: 28px; font-weight: bold; color: #C4B590; letter-spacing: 3px;">BIENVENIDA10</p>
            <p style="margin: 8px 0 0; color: #a09880; font-size: 13px;">10% de descuento en tu primer pedido</p>
          </div>
          <p style="color: #a09880; font-size: 12px; text-align: center; margin-top: 30px;">
            © ${new Date().getFullYear()} Sophia Cosmética Botánica
          </p>
        </div>
        `
      );
    } catch (emailError) {
      console.error('Welcome email error:', emailError);
      // Continue without error - subscription still saved
    }

    return NextResponse.json({
      success: true,
      message: '¡Gracias por suscribirte! Revisa tu email para tu código de descuento.',
    });
  } catch (error) {
    console.error('Subscribe API error:', error);
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 });
  }
}
