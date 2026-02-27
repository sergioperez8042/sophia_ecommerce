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

// Brand colors
const BRAND_GREEN = '#505A4A';
const BRAND_GREEN_DARK = '#414A3C';

interface SendWelcomeEmailParams {
  to: string;
  subscriberName?: string;
}

interface SendNewsletterParams {
  to: string[];
  subject: string;
  content: string;
  previewText?: string;
}

// Welcome email HTML template
function getWelcomeEmailHtml(subscriberName?: string): string {
  const greeting = subscriberName ? `¡Hola ${subscriberName}!` : '¡Hola!';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenida a Sophia Natural</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8f9fa;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_GREEN} 0%, ${BRAND_GREEN_DARK} 100%); padding: 40px 30px; text-align: center;">
              <img src="https://sophia-ecommerce.vercel.app/logo.png" alt="Sophia Natural" width="120" style="margin-bottom: 20px;" />
              <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 600;">
                ¡Bienvenida a la familia Sophia! 🌿
              </h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #333333; margin: 0 0 20px 0; line-height: 1.6;">
                ${greeting}
              </p>
              
              <p style="font-size: 16px; color: #555555; margin: 0 0 20px 0; line-height: 1.7;">
                Gracias por unirte a nuestra comunidad de belleza natural. Ahora formas parte de miles de mujeres que han elegido cuidar su piel de forma natural y consciente.
              </p>
              
              <p style="font-size: 16px; color: #555555; margin: 0 0 30px 0; line-height: 1.7;">
                Como agradecimiento por confiar en nosotras, te regalamos un <strong style="color: ${BRAND_GREEN};">10% de descuento</strong> en tu primera compra.
              </p>
              
              <!-- Discount Code Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 30px 0;">
                <tr>
                  <td style="background-color: #f0f5ef; border: 2px dashed ${BRAND_GREEN}; border-radius: 12px; padding: 25px; text-align: center;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">
                      Tu código de descuento
                    </p>
                    <p style="margin: 0; font-size: 32px; font-weight: 700; color: ${BRAND_GREEN}; letter-spacing: 3px;">
                      BIENVENIDA10
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://sophia-ecommerce.vercel.app/products" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_GREEN} 0%, ${BRAND_GREEN_DARK} 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 30px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(74, 103, 65, 0.3);">
                      Descubrir productos ✨
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- What to Expect Section -->
          <tr>
            <td style="padding: 0 30px 40px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fafafa; border-radius: 12px; padding: 25px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 15px 0; font-size: 18px; color: ${BRAND_GREEN};">
                      ¿Qué recibirás en nuestras newsletters?
                    </h3>
                    <ul style="margin: 0; padding: 0 0 0 20px; color: #555555; line-height: 1.8;">
                      <li>🌸 Tips de belleza natural y rutinas de skincare</li>
                      <li>🎁 Ofertas exclusivas solo para suscriptoras</li>
                      <li>✨ Novedades y lanzamientos antes que nadie</li>
                      <li>💚 Historias de nuestra comunidad</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0 0 15px 0; font-size: 14px; color: #888888;">
                Síguenos en redes sociales
              </p>
              <div style="margin-bottom: 20px;">
                <a href="#" style="display: inline-block; margin: 0 10px;"><img src="https://cdn-icons-png.flaticon.com/32/2111/2111463.png" alt="Instagram" width="24" /></a>
                <a href="#" style="display: inline-block; margin: 0 10px;"><img src="https://cdn-icons-png.flaticon.com/32/733/733547.png" alt="Facebook" width="24" /></a>
                <a href="#" style="display: inline-block; margin: 0 10px;"><img src="https://cdn-icons-png.flaticon.com/32/3670/3670051.png" alt="TikTok" width="24" /></a>
              </div>
              <p style="margin: 0; font-size: 12px; color: #aaaaaa;">
                © 2024 Sophia Natural. Todos los derechos reservados.
              </p>
              <p style="margin: 10px 0 0 0; font-size: 11px; color: #bbbbbb;">
                Recibes este email porque te suscribiste a nuestra newsletter.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Send a welcome email to a new newsletter subscriber
 */
export async function sendWelcomeEmail({ to, subscriberName }: SendWelcomeEmailParams) {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: 'Sophia Natural <onboarding@resend.dev>',
      to: [to],
      subject: '¡Bienvenida a Sophia Natural! 🌿 Tu regalo de bienvenida',
      html: getWelcomeEmailHtml(subscriberName),
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
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
