import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * Escape HTML special characters to prevent XSS in email templates.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface OrderItem {
    product: {
        id: number;
        name: string;
        price: number;
        image: string;
    };
    quantity: number;
}

interface ShippingInfo {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
}

export async function POST(request: NextRequest) {
    try {
        // Validate email service configuration
        const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL;
        if (!BUSINESS_EMAIL) {
            return NextResponse.json(
                { success: false, error: 'Email service not configured' },
                { status: 503 }
            );
        }

        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;
        if (!emailUser || !emailPass) {
            return NextResponse.json(
                { success: false, error: 'Email service not configured' },
                { status: 503 }
            );
        }

        const body = await request.json();
        const {
            orderNumber,
            shippingInfo,
            items,
            subtotal,
            shipping,
            total,
            pdfBase64
        } = body as {
            orderNumber: string;
            shippingInfo: ShippingInfo;
            items: OrderItem[];
            subtotal: number;
            shipping: number;
            total: number;
            pdfBase64: string;
        };

        // Escape all user-provided strings for safe HTML embedding
        const safeFirstName = escapeHtml(shippingInfo.firstName);
        const safeLastName = escapeHtml(shippingInfo.lastName);
        const customerName = `${safeFirstName} ${safeLastName}`;
        const safeEmail = escapeHtml(shippingInfo.email);
        const safePhone = escapeHtml(shippingInfo.phone);
        const safeAddress = escapeHtml(shippingInfo.address);
        const safePostalCode = escapeHtml(shippingInfo.postalCode);
        const safeCity = escapeHtml(shippingInfo.city);
        const safeCountry = escapeHtml(shippingInfo.country);
        const safeOrderNumber = escapeHtml(orderNumber);

        const shippingAddress = `${safeAddress}\n${safePostalCode} ${safeCity}\n${safeCountry}`;

        // Generar detalles de productos (escape product names)
        const orderDetails = items.map((item, i) =>
            `${i + 1}. ${escapeHtml(item.product.name)} - ${item.quantity} x $${item.product.price.toFixed(2)} = $${(item.quantity * item.product.price).toFixed(2)}`
        ).join('\n');

        // Configurar transporte de email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: emailUser,
                pass: emailPass,
            },
        });

        // Convertir base64 a buffer
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');

        // Email al negocio
        const businessMailOptions = {
            from: `"Sophia Pedidos" <${emailUser}>`,
            to: BUSINESS_EMAIL,
            subject: `Nuevo Pedido ${safeOrderNumber} - ${customerName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #505A4A; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">SOPHIA</h1>
                        <p style="color: #E8F5E9; margin: 5px 0;">Nuevo Pedido Recibido</p>
                    </div>

                    <div style="padding: 20px; background-color: #f9f9f9;">
                        <h2 style="color: #505A4A;">Pedido: ${safeOrderNumber}</h2>

                        <div style="background-color: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <h3 style="color: #333; margin-top: 0;">Cliente</h3>
                            <p><strong>Nombre:</strong> ${customerName}</p>
                            <p><strong>Email:</strong> ${safeEmail}</p>
                            <p><strong>Telefono:</strong> ${safePhone}</p>
                        </div>

                        <div style="background-color: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <h3 style="color: #333; margin-top: 0;">Direccion de Envio</h3>
                            <p>${shippingAddress.replace(/\n/g, '<br>')}</p>
                        </div>

                        <div style="background-color: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <h3 style="color: #333; margin-top: 0;">Productos</h3>
                            <div>${orderDetails.replace(/\n/g, '<br>')}</div>
                        </div>

                        <div style="background-color: #505A4A; color: white; padding: 15px; border-radius: 8px; text-align: center;">
                            <p style="margin: 5px 0;">Subtotal: $${subtotal.toFixed(2)}</p>
                            <p style="margin: 5px 0;">Envio: ${shipping === 0 ? 'GRATIS' : '$' + shipping.toFixed(2)}</p>
                            <h2 style="margin: 10px 0;">TOTAL: $${total.toFixed(2)}</h2>
                        </div>
                    </div>

                    <div style="background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
                        <p>Pago: Contra entrega / Transferencia</p>
                        <p>Factura PDF adjunta</p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: `Pedido-${safeOrderNumber}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                },
            ],
        };

        // Email de confirmación al cliente
        const customerMailOptions = {
            from: `"Sophia" <${emailUser}>`,
            to: shippingInfo.email,
            subject: `Confirmacion de Pedido ${safeOrderNumber} - Sophia`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #505A4A; padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">SOPHIA</h1>
                        <p style="color: #E8F5E9; margin: 5px 0;">Productos Naturales</p>
                    </div>

                    <div style="padding: 30px; background-color: #f9f9f9;">
                        <h2 style="color: #505A4A; text-align: center;">Gracias por tu pedido, ${safeFirstName}!</h2>

                        <p style="text-align: center; color: #666;">
                            Hemos recibido tu pedido y lo estamos procesando.
                        </p>

                        <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                            <p style="color: #666; margin: 0;">Numero de pedido</p>
                            <h2 style="color: #505A4A; margin: 10px 0;">${safeOrderNumber}</h2>
                        </div>

                        <div style="background-color: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <h3 style="color: #333; margin-top: 0;">Enviaremos tu pedido a:</h3>
                            <p style="color: #666;">${shippingAddress.replace(/\n/g, '<br>')}</p>
                        </div>

                        <div style="background-color: #E8F5E9; padding: 20px; border-radius: 8px; text-align: center;">
                            <h3 style="color: #505A4A; margin-top: 0;">Total: $${total.toFixed(2)}</h3>
                            <p style="color: #666; font-size: 14px;">Pago: Contra entrega / Transferencia bancaria</p>
                        </div>

                        <p style="text-align: center; color: #666; margin-top: 20px; font-size: 14px;">
                            Te contactaremos pronto para confirmar los detalles.
                        </p>
                    </div>

                    <div style="background-color: #505A4A; color: white; padding: 20px; text-align: center; font-size: 12px;">
                        <p style="margin: 5px 0;">www.sophia-cosmetica.com</p>
                        <p style="margin: 10px 0 0;">&copy; 2022 Sophia</p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: `Pedido-${safeOrderNumber}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                },
            ],
        };

        // Enviar emails
        await transporter.sendMail(businessMailOptions);
        await transporter.sendMail(customerMailOptions);

        return NextResponse.json({ 
            success: true, 
            message: 'Emails enviados correctamente' 
        });

    } catch (error) {
        console.error('Error sending order email:', error instanceof Error ? error.message : error);
        return NextResponse.json(
            {
                success: false,
                error: 'Error al enviar el email'
            },
            { status: 500 }
        );
    }
}
