import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.json');

interface Subscriber {
  email: string;
  subscribedAt: string;
  source: 'newsletter' | 'checkout' | 'contact';
}

async function getSubscribers(): Promise<Subscriber[]> {
  try {
    const data = await readFile(SUBSCRIBERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveSubscribers(subscribers: Subscriber[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
}

// DELETE - Remove a subscriber
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      );
    }

    const subscribers = await getSubscribers();
    const filtered = subscribers.filter(s => s.email.toLowerCase() !== email.toLowerCase());
    
    if (filtered.length === subscribers.length) {
      return NextResponse.json(
        { error: 'Suscriptor no encontrado' },
        { status: 404 }
      );
    }

    await saveSubscribers(filtered);

    return NextResponse.json({
      success: true,
      message: 'Suscriptor eliminado',
    });

  } catch {
    return NextResponse.json(
      { error: 'Error al eliminar suscriptor' },
      { status: 500 }
    );
  }
}

// POST - Send newsletter (future feature)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, content, testEmail } = body;

    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Asunto y contenido son requeridos' },
        { status: 400 }
      );
    }

    const subscribers = await getSubscribers();
    const recipients = testEmail ? [testEmail] : subscribers.map(s => s.email);

    // Import and send
    const { sendNewsletter } = await import('@/lib/resend');
    const result = await sendNewsletter({
      to: recipients,
      subject,
      content,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Error al enviar newsletter' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Newsletter enviado a ${recipients.length} destinatario(s)`,
      recipients: recipients.length,
    });

  } catch {
    return NextResponse.json(
      { error: 'Error al enviar newsletter' },
      { status: 500 }
    );
  }
}
