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

const SENDER = 'Sophia Cosmética Botánica <onboarding@resend.dev>';

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
        from: SENDER,
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

/**
 * Send a transactional email (welcome, confirmation, etc.)
 */
export async function sendTransactionalEmail(
  to: string,
  subject: string,
  htmlContent: string
) {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: SENDER,
      to: [to],
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend transactional email error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending transactional email:', error);
    return { success: false, error };
  }
}
