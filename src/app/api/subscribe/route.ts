import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, query, where, getDocs, Timestamp, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  console.log('=== SUBSCRIBE API CALLED ===');
  
  try {
    const body = await request.json();
    const { email, source = 'newsletter' } = body;

    console.log('Request body:', { email, source });

    if (!email) {
      console.log('Error: email is required');
      return NextResponse.json(
        { error: 'El email es requerido' },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      console.log('Error: invalid email format');
      return NextResponse.json(
        { error: 'El email no es válido' },
        { status: 400 }
      );
    }

    // Check if Firebase is available
    console.log('Firebase db available:', !!db);
    
    if (!db) {
      console.error('Firebase not initialized - env vars:', {
        hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      });
      return NextResponse.json(
        { error: 'Servicio temporalmente no disponible' },
        { status: 503 }
      );
    }

    const subscribersRef = collection(db, SUBSCRIBERS_COLLECTION);
    console.log('Collection reference created');

    // Check if already subscribed (simplified - without index requirement)
    try {
      const q = query(subscribersRef, where('email', '==', email.toLowerCase().trim()));
      console.log('Query created, executing...');
      const existingDocs = await getDocs(q);
      console.log('Query executed, docs found:', existingDocs.size);

      if (!existingDocs.empty) {
        return NextResponse.json({
          success: true,
          message: '¡Ya estás suscrito a nuestro boletín!',
          alreadySubscribed: true,
        });
      }
    } catch (queryError) {
      console.error('Query error (continuing anyway):', queryError);
      // If query fails (e.g., no index), continue and try to add anyway
    }

    // Add new subscriber to Firestore
    const newSubscriber: Subscriber = {
      email: email.toLowerCase().trim(),
      subscribedAt: Timestamp.now(),
      source,
      active: true,
    };

    console.log('Adding subscriber:', newSubscriber.email);
    const docRef = await addDoc(subscribersRef, newSubscriber);
    console.log('Subscriber added with ID:', docRef.id);

    return NextResponse.json({
      success: true,
      message: '¡Gracias por suscribirte! Pronto recibirás nuestras novedades.',
    });

  } catch (error) {
    console.error('=== SUBSCRIBE ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Error al procesar la suscripción' },
      { status: 500 }
    );
  }
}
