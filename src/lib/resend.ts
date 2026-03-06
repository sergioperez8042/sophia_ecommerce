import { Resend } from 'resend';

// Lazy initialization - only create Resend instance when needed
let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

interface SendNewsletterParams {
  to: string[];
  subject: string;
  content: string;
  previewText?: string;
}

/**
 * Send a newsletter to multiple subscribers
 */
export async function sendNewsletter({ to, subject, content }: SendNewsletterParams) {
  try {
    const resend = getResend();
    // Send in batches to avoid rate limits
    const batchSize = 50;
    const results = [];

    for (let i = 0; i < to.length; i += batchSize) {
      const batch = to.slice(i, i + batchSize);
      
      const { data, error } = await resend.emails.send({
        from: 'Sophia Natural <onboarding@resend.dev>',
        to: batch,
        subject: subject,
        html: content,
      });

      if (error) {
        results.push({ success: false, error, batch });
      } else {
        results.push({ success: true, data, batch });
      }
    }

    return { success: true, results };
  } catch (error) {
    return { success: false, error };
  }
}
