import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, addDoc, Timestamp, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { isAuthorized, verifyFirebaseAuth, unauthorizedResponse } from '@/lib/api-auth';

const SUBSCRIBERS_COLLECTION = 'subscribers';
const NEWSLETTERS_COLLECTION = 'newsletters';

export async function POST(request: NextRequest) {
  try {
    // Verify admin auth: API key OR valid Firebase token
    if (!isAuthorized(request)) {
      const firebaseUser = await verifyFirebaseAuth(request);
      if (!firebaseUser) {
        return unauthorizedResponse();
      }
    }

    const body = await request.json();
    const { subject, content, testEmail } = body;

    if (!subject || !content) {
      return NextResponse.json(
        { error: 'El asunto y contenido son requeridos' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 });
    }

    let recipients: string[];

    if (testEmail) {
      // Test mode - send only to specified email
      recipients = [testEmail];
    } else {
      // Get all active subscribers
      const subscribersRef = collection(db, SUBSCRIBERS_COLLECTION);
      const q = query(subscribersRef, where('active', '==', true));
      const snapshot = await getDocs(q);
      recipients = snapshot.docs.map(
        (doc: QueryDocumentSnapshot<DocumentData>) => doc.data().email as string
      );

      if (recipients.length === 0) {
        return NextResponse.json({ error: 'No hay suscriptores activos' }, { status: 400 });
      }
    }

    // Send via Resend
    let sendResult = { success: false, totalSent: 0 };
    try {
      const { sendNewsletter } = await import('@/lib/resend');
      const result = await sendNewsletter({ to: recipients, subject, content });
      sendResult = { success: result.success, totalSent: recipients.length };
    } catch (emailError) {
      console.error('Newsletter send error:', emailError);
      return NextResponse.json({ error: 'Error al enviar con Resend' }, { status: 500 });
    }

    // Save newsletter record (only for non-test sends)
    if (!testEmail) {
      const newslettersRef = collection(db, NEWSLETTERS_COLLECTION);
      await addDoc(newslettersRef, {
        subject,
        content,
        sentAt: Timestamp.now(),
        recipientCount: recipients.length,
        success: sendResult.success,
      });
    }

    if (sendResult.success) {
      return NextResponse.json({
        success: true,
        message: testEmail
          ? `Email de prueba enviado a ${testEmail}`
          : `Newsletter enviada a ${recipients.length} suscriptores`,
        recipientCount: recipients.length,
      });
    } else {
      return NextResponse.json(
        { error: 'Error al enviar newsletter', sent: sendResult.totalSent },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json({ error: 'Error al enviar la newsletter' }, { status: 500 });
  }
}

// GET - List sent newsletters
export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      const firebaseUser = await verifyFirebaseAuth(request);
      if (!firebaseUser) {
        return unauthorizedResponse();
      }
    }

    if (!db) {
      return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 });
    }

    const newslettersRef = collection(db, NEWSLETTERS_COLLECTION);
    const snapshot = await getDocs(newslettersRef);

    const newsletters = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      const sentAtField = data.sentAt as { toDate?: () => Date } | undefined;
      return {
        id: doc.id,
        subject: data.subject,
        content: data.content,
        recipientCount: data.recipientCount,
        success: data.success,
        sentAt: sentAtField?.toDate?.()?.toISOString() || null,
      };
    });

    newsletters.sort(
      (a, b) => new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime()
    );

    return NextResponse.json({ total: newsletters.length, newsletters });
  } catch {
    return NextResponse.json({ error: 'Error al obtener newsletters' }, { status: 500 });
  }
}
