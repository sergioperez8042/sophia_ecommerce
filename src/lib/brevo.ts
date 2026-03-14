import { BrevoClient } from '@getbrevo/brevo';

// Lazy initialization - only create Brevo instance when needed
let brevoInstance: BrevoClient | null = null;

function getBrevo(): BrevoClient {
  if (!brevoInstance) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error('BREVO_API_KEY environment variable is not set');
    }
    brevoInstance = new BrevoClient({ apiKey });
  }
  return brevoInstance;
}

const getSender = () => ({
  email: process.env.BREVO_SENDER_EMAIL || 'chavesophia1994@gmail.com',
  name: process.env.BREVO_SENDER_NAME || 'Sophia Cosmética Botánica',
});

/**
 * Add a contact to Brevo
 */
export async function addBrevoContact(email: string, name?: string) {
  try {
    const client = getBrevo();
    await client.contacts.createContact({
      email,
      attributes: name ? { NOMBRE: name } : undefined,
      updateEnabled: true,
    });
    return { success: true };
  } catch (error) {
    console.error('Error adding Brevo contact:', error);
    return { success: false, error };
  }
}

/**
 * Remove a contact from Brevo
 */
export async function removeBrevoContact(email: string) {
  try {
    const client = getBrevo();
    await client.contacts.deleteContact({ identifier: email, identifierType: 'email_id' });
    return { success: true };
  } catch (error) {
    console.error('Error removing Brevo contact:', error);
    return { success: false, error };
  }
}

/**
 * Send a transactional email (welcome email, etc.)
 */
export async function sendTransactionalEmail(
  to: string,
  subject: string,
  htmlContent: string
) {
  try {
    const client = getBrevo();
    const sender = getSender();

    const result = await client.transactionalEmails.sendTransacEmail({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending transactional email:', error);
    return { success: false, error };
  }
}

/**
 * Send newsletter to multiple recipients in batches
 */
export async function sendBatchEmail(
  recipients: string[],
  subject: string,
  htmlContent: string
) {
  try {
    const client = getBrevo();
    const sender = getSender();
    const batchSize = 50;
    const results = [];

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      try {
        const result = await client.transactionalEmails.sendTransacEmail({
          sender,
          to: batch.map((email) => ({ email })),
          subject,
          htmlContent,
        });
        results.push({ success: true, data: result, count: batch.length });
      } catch (error) {
        results.push({ success: false, error, count: batch.length });
      }
    }

    const totalSent = results.filter((r) => r.success).reduce((sum, r) => sum + r.count, 0);
    const totalFailed = results.filter((r) => !r.success).reduce((sum, r) => sum + r.count, 0);

    return {
      success: totalFailed === 0,
      totalSent,
      totalFailed,
      results,
    };
  } catch (error) {
    return { success: false, error, totalSent: 0, totalFailed: recipients.length };
  }
}
