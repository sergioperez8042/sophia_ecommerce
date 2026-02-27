import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Configuración del correo del negocio
const BUSINESS_EMAIL = '8042sergi@gmail.com';

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

        const customerName = `${shippingInfo.firstName} ${shippingInfo.lastName}`;
        const shippingAddress = `${shippingInfo.address}\n${shippingInfo.postalCode} ${shippingInfo.city}\n${shippingInfo.country}`;
        
        // Generar detalles de productos
        const orderDetails = items.map((item, i) => 
            `${i + 1}. ${item.product.name} - ${item.quantity} x ${item.product.price.toFixed(2)}€ = ${(item.quantity * item.product.price).toFixed(2)}€`
        ).join('\n');

        // Configurar transporte de email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || BUSINESS_EMAIL,
                pass: process.env.EMAIL_PASS || '',
            },
        });

        // Convertir base64 a buffer
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');

        // Email al negocio
        const businessMailOptions = {
            from: `"Sophia Pedidos" <${process.env.EMAIL_USER || BUSINESS_EMAIL}>`,
            to: BUSINESS_EMAIL,
            subject: `🛒 Nuevo Pedido ${orderNumber} - ${customerName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #505A4A; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">SOPHIA</h1>
                        <p style="color: #E8F5E9; margin: 5px 0;">Nuevo Pedido Recibido</p>
                    </div>
                    
                    <div style="padding: 20px; background-color: #f9f9f9;">
                        <h2 style="color: #505A4A;">Pedido: ${orderNumber}</h2>
                        
                        <div style="background-color: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <h3 style="color: #333; margin-top: 0;">👤 Cliente</h3>
                            <p><strong>Nombre:</strong> ${customerName}</p>
                            <p><strong>Email:</strong> ${shippingInfo.email}</p>
                            <p><strong>Teléfono:</strong> ${shippingInfo.phone}</p>
                        </div>
                        
                        <div style="background-color: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <h3 style="color: #333; margin-top: 0;">📍 Dirección de Envío</h3>
                            <p>${shippingAddress.replace(/\n/g, '<br>')}</p>
                        </div>
                        
                        <div style="background-color: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <h3 style="color: #333; margin-top: 0;">📦 Productos</h3>
                            <div>${orderDetails.replace(/\n/g, '<br>')}</div>
                        </div>
                        
                        <div style="background-color: #505A4A; color: white; padding: 15px; border-radius: 8px; text-align: center;">
                            <p style="margin: 5px 0;">Subtotal: ${subtotal.toFixed(2)}€</p>
                            <p style="margin: 5px 0;">Envío: ${shipping === 0 ? 'GRATIS' : shipping.toFixed(2) + '€'}</p>
                            <h2 style="margin: 10px 0;">TOTAL: ${total.toFixed(2)}€</h2>
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
                    filename: `Pedido-${orderNumber}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                },
            ],
        };

        // Email de confirmación al cliente
        const customerMailOptions = {
            from: `"Sophia Cosmética" <${process.env.EMAIL_USER || BUSINESS_EMAIL}>`,
            to: shippingInfo.email,
            subject: `✨ Confirmación de Pedido ${orderNumber} - Sophia`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #505A4A; padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">SOPHIA</h1>
                        <p style="color: #E8F5E9; margin: 5px 0;">Cosmética Botánica</p>
                    </div>
                    
                    <div style="padding: 30px; background-color: #f9f9f9;">
                        <h2 style="color: #505A4A; text-align: center;">¡Gracias por tu pedido, ${shippingInfo.firstName}!</h2>
                        
                        <p style="text-align: center; color: #666;">
                            Hemos recibido tu pedido y lo estamos procesando.
                        </p>
                        
                        <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                            <p style="color: #666; margin: 0;">Número de pedido</p>
                            <h2 style="color: #505A4A; margin: 10px 0;">${orderNumber}</h2>
                        </div>
                        
                        <div style="background-color: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <h3 style="color: #333; margin-top: 0;">📍 Enviaremos tu pedido a:</h3>
                            <p style="color: #666;">${shippingAddress.replace(/\n/g, '<br>')}</p>
                        </div>
                        
                        <div style="background-color: #E8F5E9; padding: 20px; border-radius: 8px; text-align: center;">
                            <h3 style="color: #505A4A; margin-top: 0;">Total: ${total.toFixed(2)}€</h3>
                            <p style="color: #666; font-size: 14px;">Pago: Contra entrega / Transferencia bancaria</p>
                        </div>
                        
                        <p style="text-align: center; color: #666; margin-top: 20px; font-size: 14px;">
                            Te contactaremos pronto para confirmar los detalles.
                        </p>
                    </div>
                    
                    <div style="background-color: #505A4A; color: white; padding: 20px; text-align: center; font-size: 12px;">
                        <p style="margin: 5px 0;">www.sophia-cosmetica.com</p>
                        <p style="margin: 10px 0 0;">© 2022 Sophia - Cosmética Botánica</p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: `Pedido-${orderNumber}.pdf`,
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
        console.error('Error enviando email:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Error al enviar el email',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
