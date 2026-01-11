import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, query, where, getDocs, Timestamp, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendWelcomeEmail } from '@/lib/resend';

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const SUBSCRIBERS_COLLECTION = 'subscribers';

interface Subscriber {
  email: string;
  subscribedAt: Timestamp;
  source: 'newsletter' | 'checkout' | 'contact';
  active: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, source = 'newsletter' } = body;

    console.log('Subscribe request received:', { email, source });

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
      console.error('Firebase not initialized - env vars missing?', {
        hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      return NextResponse.json(
        { error: 'Servicio temporalmente no disponible. Por favor intenta más tarde.' },
        { status: 503 }
      );
    }

    // Check if already subscribed
    const subscribersRef = collection(db, SUBSCRIBERS_COLLECTION);
    
    try {
      const q = query(subscribersRef, where('email', '==', email.toLowerCase().trim()));
      const existingDocs = await getDocs(q);

      if (!existingDocs.empty) {
        return NextResponse.json(
          { message: 'Ya estás suscrito a nuestro boletín', alreadySubscribed: true },
          { status: 200 }
        );
      }
    } catch (queryError) {
      console.error('Error querying existing subscribers:', queryError);
      // Continue anyway - we'll just add the subscriber
    }

    // Add new subscriber to Firestore
    const newSubscriber: Subscriber = {
      email: email.toLowerCase().trim(),
      subscribedAt: Timestamp.now(),
      source,
      active: true,
    };

    await addDoc(subscribersRef, newSubscriber);
    console.log('Subscriber added successfully:', email);

    // Send welcome email (optional - don't fail if email fails)
    try {
      await sendWelcomeEmail({ to: email });
      console.log('Welcome email sent to:', email);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail the subscription if email fails
    }

    return NextResponse.json({
      success: true,
      message: '¡Gracias por suscribirte! Pronto recibirás nuestras novedades.',
    });

  } catch (error) {
    console.error('Error saving subscriber:', error);
    return NextResponse.json(
      { error: 'Error al procesar la suscripción. Por favor intenta de nuevo.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json(
        { error: 'Firebase not initialized' },
        { status: 500 }
      );
    }

    const subscribersRef = collection(db, SUBSCRIBERS_COLLECTION);
    const q = query(subscribersRef, where('active', '==', true));
    const snapshot = await getDocs(q);

    interface SubscriberRecord {
      id: string;
      email?: string;
      source?: string;
      active?: boolean;
      subscribedAt: string | null;
    }

    const subscribers: SubscriberRecord[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      const subscribedAtField = data.subscribedAt as { toDate?: () => Date } | undefined;
      return {
        id: doc.id,
        email: data.email as string | undefined,
        source: data.source as string | undefined,
        active: data.active as boolean | undefined,
        subscribedAt: subscribedAtField?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json({
      total: subscribers.length,
      subscribers,
    });
  } catch (error) {
    console.error('Error getting subscribers:', error);
    return NextResponse.json(
      { error: 'Error al obtener suscriptores' },
      { status: 500 }
    );
  }
}
