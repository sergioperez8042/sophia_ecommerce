import { NextRequest, NextResponse } from 'next/server';
import { sendTransactionalEmail } from '@/lib/resend';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  in_transit: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_MESSAGES: Record<string, { title: string; message: string; icon: string }> = {
  confirmed: {
    title: '¡Tu pedido ha sido confirmado!',
    message: 'Hemos confirmado tu pedido y lo estamos preparando para el envío. Te avisaremos cuando esté en camino.',
    icon: '✓',
  },
  in_transit: {
    title: '¡Tu pedido está en camino!',
    message: 'Tu pedido ha salido y está siendo entregado por nuestro gestor de zona. Pronto lo tendrás en tus manos.',
    icon: '🚚',
  },
  delivered: {
    title: '¡Pedido entregado!',
    message: 'Tu pedido ha sido entregado. Esperamos que disfrutes de nuestros productos. ¡Gracias por confiar en Sophia!',
    icon: '✓',
  },
  cancelled: {
    title: 'Pedido cancelado',
    message: 'Tu pedido ha sido cancelado. Si tienes alguna pregunta, no dudes en contactarnos.',
    icon: '✕',
  },
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildStatusEmailHtml(data: {
  customerName: string;
  orderNumber: string;
  newStatus: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
}): string {
  const statusInfo = STATUS_MESSAGES[data.newStatus];
  if (!statusInfo) return '';

  const safeName = escapeHtml(data.customerName || 'Cliente');
  const safeOrderNumber = escapeHtml(data.orderNumber);
  const statusLabel = STATUS_LABELS[data.newStatus] || data.newStatus;

  const isCancelled = data.newStatus === 'cancelled';
  const accentColor = isCancelled ? '#9B1C1C' : '#505A4A';
  const accentBg = isCancelled ? '#FEF2F2' : '#F0F2ED';

  const itemsHtml = data.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;font-size:14px;">${escapeHtml(item.name)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:14px;text-align:center;">x${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;font-size:14px;text-align:right;font-weight:600;">$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

  <!-- Header -->
  <tr>
    <td style="background-color:${accentColor};padding:32px 40px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;letter-spacing:2px;">SOPHIA</h1>
      <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Productos Naturales</p>
    </td>
  </tr>

  <!-- Status badge -->
  <tr>
    <td style="padding:32px 40px 0;text-align:center;">
      <div style="display:inline-block;background:${accentBg};border-radius:8px;padding:12px 24px;">
        <span style="color:${accentColor};font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${statusLabel}</span>
      </div>
    </td>
  </tr>

  <!-- Main content -->
  <tr>
    <td style="padding:24px 40px;">
      <h2 style="color:#333;margin:0 0 8px;font-size:20px;font-weight:600;text-align:center;">${statusInfo.title}</h2>
      <p style="color:#666;margin:0 0 24px;font-size:14px;line-height:1.6;text-align:center;">${statusInfo.message}</p>

      <!-- Order number -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:8px;margin-bottom:20px;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="color:#999;margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Número de pedido</p>
            <p style="color:#333;margin:0;font-size:16px;font-weight:600;">${safeOrderNumber}</p>
          </td>
          <td style="padding:16px 20px;text-align:right;">
            <p style="color:#999;margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Cliente</p>
            <p style="color:#333;margin:0;font-size:14px;">${safeName}</p>
          </td>
        </tr>
      </table>

      <!-- Items -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr>
          <td style="padding:0 0 8px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #f0f0f0;">Producto</td>
          <td style="padding:0 0 8px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:center;border-bottom:2px solid #f0f0f0;">Cant.</td>
          <td style="padding:0 0 8px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:right;border-bottom:2px solid #f0f0f0;">Precio</td>
        </tr>
        ${itemsHtml}
      </table>

      <!-- Total -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:${accentBg};border-radius:8px;">
        <tr>
          <td style="padding:16px 20px;">
            <span style="color:#666;font-size:14px;">Total</span>
          </td>
          <td style="padding:16px 20px;text-align:right;">
            <span style="color:${accentColor};font-size:20px;font-weight:700;">$${data.subtotal.toFixed(2)}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background-color:#fafafa;padding:24px 40px;text-align:center;border-top:1px solid #f0f0f0;">
      <p style="color:#999;margin:0 0 4px;font-size:12px;">¿Tienes alguna pregunta?</p>
      <p style="color:#666;margin:0;font-size:12px;">Contáctanos por WhatsApp o responde a este email</p>
      <p style="color:#ccc;margin:16px 0 0;font-size:11px;">&copy; ${new Date().getFullYear()} Sophia</p>
    </td>
  </tr>

</table>
</td></tr></table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerEmail, customerName, orderNumber, newStatus, items, subtotal } = body;

    if (!customerEmail || !orderNumber || !newStatus) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos (email, orderNumber, newStatus)' },
        { status: 400 }
      );
    }

    // Only send for statuses that have messages configured
    if (!STATUS_MESSAGES[newStatus]) {
      return NextResponse.json({ success: true, message: 'No email needed for this status' });
    }

    const html = buildStatusEmailHtml({
      customerName: customerName || 'Cliente',
      orderNumber,
      newStatus,
      items: items || [],
      subtotal: subtotal || 0,
    });

    const statusLabel = STATUS_LABELS[newStatus] || newStatus;
    const subject = `Pedido ${orderNumber} — ${statusLabel} | Sophia`;

    const result = await sendTransactionalEmail(customerEmail, subject, html);

    if (!result.success) {
      console.error('Error sending status email:', result.error);
      return NextResponse.json(
        { success: false, error: 'Error al enviar el email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Email de estado enviado' });
  } catch (error) {
    console.error('Error in order-status API:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
