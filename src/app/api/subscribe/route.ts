import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const SUBSCRIBERS_COLLECTION = 'subscribers';

// Brand colors for email
const BRAND_GREEN = '#4A6741';

// Send welcome email using Resend API directly (no library needed)
async function sendWelcomeEmail(to: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.log('RESEND_API_KEY not configured, skipping email');
    return { success: false, error: 'API key not configured' };
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="background: ${BRAND_GREEN}; padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">¡Bienvenida a Sophia Natural! 🌿</h1>
    </div>
    <div style="padding: 30px;">
      <p style="font-size: 16px; color: #333; line-height: 1.6;">
        ¡Hola! Gracias por unirte a nuestra comunidad de belleza natural.
      </p>
      <p style="font-size: 16px; color: #333; line-height: 1.6;">
        Ahora formas parte de miles de mujeres que han elegido cuidar su piel de forma natural y consciente.
      </p>
      <p style="font-size: 16px; color: #333; line-height: 1.6;">
        Como agradecimiento, te regalamos un <strong style="color: ${BRAND_GREEN};">10% de descuento</strong> en tu primera compra.
      </p>
      <div style="background: #f0f5ef; border: 2px dashed ${BRAND_GREEN}; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-size: 12px; color: #666; text-transform: uppercase;">Tu código de descuento</p>
        <p style="margin: 0; font-size: 28px; font-weight: bold; color: ${BRAND_GREEN}; letter-spacing: 3px;">BIENVENIDA10</p>
      </div>
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://sophia-ecommerce.vercel.app/products" style="display: inline-block; background: ${BRAND_GREEN}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Ver Productos
        </a>
      </div>
    </div>
    <div style="background: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee;">
      <p style="margin: 0; font-size: 12px; color: #999;">
        © 2026 Sophia Natural - Cosmética Natural
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Sophia Natural <onboarding@resend.dev>',
        to: [to],
        subject: '¡Bienvenida a Sophia Natural! 🌿 Tu regalo de bienvenida',
        html: htmlContent,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Resend API error:', data);
      return { success: false, error: data.message || 'Email send failed' };
    }

    console.log('Welcome email sent successfully:', data);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function POST(request: NextRequest) {
  console.log('=== SUBSCRIBE API CALLED ===');
  
  try {
    const body = await request.json();
    const { email, source = 'newsletter' } = body;

    console.log('Request body:', { email, source });
    console.log('ENV CHECK:', {
      hasFirebaseApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      hasFirebaseProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      hasResendKey: !!process.env.RESEND_API_KEY,
      dbAvailable: !!db,
    });

    if (!email) {
      return NextResponse.json(
        { error: 'El email es requerido' },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'El email no es válido' },
        { status: 400 }
      );
    }

    // Check if Firebase is available
    if (!db) {
      // Firebase not available - just send email and return success
      console.log('Firebase not available, sending email only');
      const emailResult = await sendWelcomeEmail(email);
      
      return NextResponse.json({
        success: true,
        message: '¡Gracias por suscribirte! Pronto recibirás nuestras novedades.',
        emailSent: emailResult.success,
        note: 'Firebase not configured',
      });
    }

    const subscribersRef = collection(db, SUBSCRIBERS_COLLECTION);

    // Check if already subscribed
    try {
      const q = query(subscribersRef, where('email', '==', email.toLowerCase().trim()));
      const existingDocs = await getDocs(q);

      if (!existingDocs.empty) {
        return NextResponse.json({
          success: true,
          message: '¡Ya estás suscrito a nuestro boletín!',
          alreadySubscribed: true,
        });
      }
    } catch (queryError) {
      console.error('Query error:', queryError);
      // Continue anyway
    }

    // Add new subscriber to Firestore
    const newSubscriber = {
      email: email.toLowerCase().trim(),
      subscribedAt: Timestamp.now(),
      source,
      active: true,
    };

    const docRef = await addDoc(subscribersRef, newSubscriber);
    console.log('Subscriber added with ID:', docRef.id);

    // Send welcome email (don't fail if email fails)
    const emailResult = await sendWelcomeEmail(email);
    console.log('Email result:', emailResult);

    return NextResponse.json({
      success: true,
      message: '¡Gracias por suscribirte! Pronto recibirás nuestras novedades.',
      emailSent: emailResult.success,
    });

  } catch (error) {
    console.error('=== SUBSCRIBE ERROR ===', error);
    return NextResponse.json(
      { error: 'Error al procesar la suscripción' },
      { status: 500 }
    );
  }
}
