import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, addDoc, Timestamp, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendNewsletter } from '@/lib/resend';

const SUBSCRIBERS_COLLECTION = 'subscribers';
const NEWSLETTERS_COLLECTION = 'newsletters';

interface NewsletterRecord {
  id: string;
  subject?: string;
  content?: string;
  previewText?: string;
  recipientCount?: number;
  success?: boolean;
  sentAt: string | null;
}

// Simple auth check - in production use proper auth
const isAuthorized = (request: NextRequest): boolean => {
  const authHeader = request.headers.get('authorization');
  const apiKey = process.env.NEWSLETTER_API_KEY;
  
  if (!apiKey) return false;
  return authHeader === `Bearer ${apiKey}`;
};

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subject, content, previewText } = body;

    if (!subject || !content) {
      return NextResponse.json(
        { error: 'El asunto y contenido son requeridos' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Firebase not initialized' },
        { status: 500 }
      );
    }

    // Get all active subscribers
    const subscribersRef = collection(db, SUBSCRIBERS_COLLECTION);
    const q = query(subscribersRef, where('active', '==', true));
    const snapshot = await getDocs(q);

    const subscribers = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => doc.data().email as string);

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No hay suscriptores activos' },
        { status: 400 }
      );
    }

    // Send newsletter using Resend
    const result = await sendNewsletter({
      to: subscribers,
      subject,
      content,
      previewText,
    });

    // Save newsletter record to Firestore
    const newslettersRef = collection(db, NEWSLETTERS_COLLECTION);
    await addDoc(newslettersRef, {
      subject,
      content,
      previewText: previewText || '',
      sentAt: Timestamp.now(),
      recipientCount: subscribers.length,
      success: result.success,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Newsletter enviada a ${subscribers.length} suscriptores`,
        recipientCount: subscribers.length,
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Error al enviar newsletter' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error sending newsletter:', error);
    return NextResponse.json(
      { error: 'Error al enviar la newsletter' },
      { status: 500 }
    );
  }
}

// GET - List sent newsletters
export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Firebase not initialized' },
        { status: 500 }
      );
    }

    const newslettersRef = collection(db, NEWSLETTERS_COLLECTION);
    const snapshot = await getDocs(newslettersRef);

    const newsletters: NewsletterRecord[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      const sentAtField = data.sentAt as { toDate?: () => Date } | undefined;
      return {
        id: doc.id,
        subject: data.subject as string | undefined,
        content: data.content as string | undefined,
        previewText: data.previewText as string | undefined,
        recipientCount: data.recipientCount as number | undefined,
        success: data.success as boolean | undefined,
        sentAt: sentAtField?.toDate?.()?.toISOString() || null,
      };
    });

    // Sort by date descending
    newsletters.sort((a, b) => 
      new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime()
    );

    return NextResponse.json({
      total: newsletters.length,
      newsletters,
    });
  } catch (error) {
    console.error('Error getting newsletters:', error);
    return NextResponse.json(
      { error: 'Error al obtener newsletters' },
      { status: 500 }
    );
  }
}
