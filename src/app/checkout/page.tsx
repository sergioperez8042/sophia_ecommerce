"use client";

import { useState, useRef } from 'react';
import { Truck, CheckCircle, ArrowLeft, MapPin, Download, User, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Breadcrumb from "@/components/ui/breadcrumb";
import { useCart, useAuth, usePricing } from "@/store";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type CheckoutStep = 'shipping' | 'confirmation';

// Configuración de WhatsApp
const WHATSAPP_NUMBER = '34642633982';

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

export default function CheckoutPage() {
    const { items, subtotal, shipping, total, clearCart } = useCart();
    const { user, isAuthenticated, isManager } = useAuth();
    const { getPrice, getPriceInfo } = usePricing();

    const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderNumber, setOrderNumber] = useState<string | null>(null);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

    const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        country: 'España',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Store items for PDF generation after cart is cleared
    const [orderItems, setOrderItems] = useState<typeof items>([]);
    const [orderSubtotal, setOrderSubtotal] = useState(0);
    const [orderShipping, setOrderShipping] = useState(0);
    const [orderTotal, setOrderTotal] = useState(0);

    // Redirect if cart is empty
    if (items.length === 0 && !orderNumber) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 pt-20">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-16">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Tu carrito está vacío</h2>
                        <p className="text-gray-600 mb-8">Añade productos antes de proceder al checkout.</p>
                        <Link href="/products">
                            <Button className="bg-[#505A4A] hover:bg-[#414A3C] text-white">
                                Ver Productos
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const validateShipping = () => {
        const newErrors: Record<string, string> = {};

        if (!shippingInfo.firstName.trim()) newErrors.firstName = 'Nombre requerido';
        if (!shippingInfo.lastName.trim()) newErrors.lastName = 'Apellido requerido';
        if (!shippingInfo.email.trim()) {
            newErrors.email = 'Email requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingInfo.email)) {
            newErrors.email = 'Email inválido';
        }
        if (!shippingInfo.phone.trim()) newErrors.phone = 'Teléfono requerido';
        if (!shippingInfo.address.trim()) newErrors.address = 'Dirección requerida';
        if (!shippingInfo.city.trim()) newErrors.city = 'Ciudad requerida';
        if (!shippingInfo.postalCode.trim()) newErrors.postalCode = 'Código postal requerido';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Generar PDF profesional
    const generateOrderPDF = (orderNum: string, cartItems: typeof items, cartSubtotal: number, cartShipping: number, cartTotal: number) => {
        const doc = new jsPDF();
        const primaryColor: [number, number, number] = [74, 103, 65]; // #505A4A
        const secondaryColor: [number, number, number] = [63, 93, 76]; // #414A3C
        const lightGreen: [number, number, number] = [240, 253, 244]; // green-50

        // Header con fondo verde
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 45, 'F');

        // Logo/Nombre de la marca
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(32);
        doc.setFont('helvetica', 'bold');
        doc.text('SOPHIA', 20, 28);

        // Subtítulo
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Cosmética Botánica', 20, 36);

        // Número de pedido en header
        doc.setFontSize(12);
        doc.text(`Pedido: ${orderNum}`, 140, 25);
        doc.setFontSize(10);
        doc.text(new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }), 140, 32);

        // Línea decorativa
        doc.setDrawColor(...secondaryColor);
        doc.setLineWidth(0.5);
        doc.line(20, 55, 190, 55);

        // Título del documento
        doc.setTextColor(...primaryColor);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('CONFIRMACIÓN DE PEDIDO', 105, 65, { align: 'center' });

        // Sección: Datos del Cliente
        let yPos = 80;
        doc.setFillColor(...lightGreen);
        doc.roundedRect(15, yPos - 5, 85, 45, 3, 3, 'F');

        doc.setTextColor(...primaryColor);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('DATOS DEL CLIENTE', 20, yPos + 3);

        doc.setTextColor(60, 60, 60);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${shippingInfo.firstName} ${shippingInfo.lastName}`, 20, yPos + 13);
        doc.text(shippingInfo.email, 20, yPos + 21);
        doc.text(shippingInfo.phone, 20, yPos + 29);

        // Sección: Dirección de Envío
        doc.setFillColor(...lightGreen);
        doc.roundedRect(110, yPos - 5, 85, 45, 3, 3, 'F');

        doc.setTextColor(...primaryColor);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('DIRECCIÓN DE ENVÍO', 115, yPos + 3);

        doc.setTextColor(60, 60, 60);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(shippingInfo.address, 115, yPos + 13);
        doc.text(`${shippingInfo.postalCode} ${shippingInfo.city}`, 115, yPos + 21);
        doc.text(shippingInfo.country, 115, yPos + 29);

        // Sección: Gestor (si el usuario es gestor)
        if (isManager && user) {
            yPos = yPos + 50;
            doc.setFillColor(255, 248, 220); // Amarillo suave
            doc.roundedRect(15, yPos - 5, 180, 25, 3, 3, 'F');

            doc.setTextColor(...primaryColor);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('GESTOR', 20, yPos + 3);

            doc.setTextColor(60, 60, 60);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`${user.name} (${user.email})`, 20, yPos + 13);
            doc.text(`Código: ${user.managerCode || 'N/A'}`, 115, yPos + 13);
        }

        // Tabla de productos
        yPos = isManager && user ? yPos + 35 : 135;
        doc.setTextColor(...primaryColor);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('DETALLE DE PRODUCTOS', 20, yPos);

        const tableData = cartItems.map((item, index) => [
            (index + 1).toString(),
            item.product.name,
            item.quantity.toString(),
            `${item.product.price.toFixed(2)} €`,
            `${(item.quantity * item.product.price).toFixed(2)} €`
        ]);

        autoTable(doc, {
            startY: yPos + 5,
            head: [['#', 'Producto', 'Cant.', 'Precio', 'Total']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 10
            },
            bodyStyles: {
                fontSize: 9,
                textColor: [60, 60, 60]
            },
            alternateRowStyles: {
                fillColor: [250, 250, 250]
            },
            columnStyles: {
                0: { cellWidth: 15, halign: 'center' },
                1: { cellWidth: 80 },
                2: { cellWidth: 20, halign: 'center' },
                3: { cellWidth: 30, halign: 'right' },
                4: { cellWidth: 30, halign: 'right' }
            },
            margin: { left: 15, right: 15 }
        });

        // Resumen de totales
        const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 200;
        yPos = finalY + 15;

        // Caja de totales
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(120, yPos - 5, 75, 40, 3, 3, 'F');
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.3);
        doc.roundedRect(120, yPos - 5, 75, 40, 3, 3, 'S');

        doc.setTextColor(80, 80, 80);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Subtotal:', 125, yPos + 5);
        doc.text(`${cartSubtotal.toFixed(2)} €`, 190, yPos + 5, { align: 'right' });

        doc.text('Envío:', 125, yPos + 14);
        doc.text(cartShipping === 0 ? 'GRATIS' : `${cartShipping.toFixed(2)} €`, 190, yPos + 14, { align: 'right' });

        doc.setDrawColor(200, 200, 200);
        doc.line(125, yPos + 19, 190, yPos + 19);

        doc.setTextColor(...primaryColor);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL:', 125, yPos + 28);
        doc.text(`${cartTotal.toFixed(2)} €`, 190, yPos + 28, { align: 'right' });

        // Método de pago
        yPos = yPos + 50;
        doc.setFillColor(...lightGreen);
        doc.roundedRect(15, yPos - 5, 180, 20, 3, 3, 'F');
        doc.setTextColor(...primaryColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Método de pago:', 20, yPos + 5);
        doc.setFont('helvetica', 'normal');
        doc.text('Pago contra entrega / Transferencia bancaria', 65, yPos + 5);

        // Footer
        const pageHeight = doc.internal.pageSize.height;
        doc.setFillColor(...primaryColor);
        doc.rect(0, pageHeight - 25, 210, 25, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Gracias por tu compra en Sophia', 105, pageHeight - 15, { align: 'center' });
        doc.text('www.sophia-cosmetica.com | info@sophia-cosmetica.com', 105, pageHeight - 8, { align: 'center' });

        // Sello decorativo
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(1);
        doc.circle(30, pageHeight - 12, 8, 'S');
        doc.setFontSize(6);
        doc.text('SOPHIA', 30, pageHeight - 11, { align: 'center' });
        doc.text('2025', 30, pageHeight - 8, { align: 'center' });

        return doc;
    };

    const generateWhatsAppMessage = (orderNum: string, cartItems: typeof items, cartSubtotal: number, cartShipping: number, cartTotal: number) => {
        let message = `*NUEVO PEDIDO - SOPHIA*\n`;
        message += `================================\n\n`;
        message += `*Pedido:* ${orderNum}\n`;
        message += `*Fecha:* ${new Date().toLocaleDateString('es-ES')}\n\n`;

        message += `*CLIENTE*\n`;
        message += `Nombre: ${shippingInfo.firstName} ${shippingInfo.lastName}\n`;
        message += `Email: ${shippingInfo.email}\n`;
        message += `Tel: ${shippingInfo.phone}\n\n`;

        message += `*ENVIO*\n`;
        message += `${shippingInfo.address}\n`;
        message += `${shippingInfo.postalCode} ${shippingInfo.city}\n`;
        message += `${shippingInfo.country}\n\n`;

        message += `*PRODUCTOS*\n`;
        cartItems.forEach((item, index) => {
            message += `${index + 1}. ${item.product.name}\n`;
            message += `   ${item.quantity} x ${item.product.price.toFixed(2)}EUR = ${(item.quantity * item.product.price).toFixed(2)}EUR\n`;
        });

        message += `\n*TOTAL*\n`;
        message += `Subtotal: ${cartSubtotal.toFixed(2)}EUR\n`;
        message += `Envio: ${cartShipping === 0 ? 'GRATIS' : cartShipping.toFixed(2) + 'EUR'}\n`;
        message += `*TOTAL: ${cartTotal.toFixed(2)}EUR*\n\n`;

        // Info del gestor si es un gestor
        if (isManager && user) {
            message += `*GESTOR*\n`;
            message += `Nombre: ${user.name}\n`;
            message += `Email: ${user.email}\n`;
            message += `Código: ${user.managerCode || 'N/A'}\n\n`;
        }

        message += `Pago: Contra entrega / Transferencia\n`;
        message += `================================\n`;
        message += `Factura PDF descargada en el dispositivo del cliente`;

        return encodeURIComponent(message);
    };

    const sendWhatsAppOrder = (orderNum: string, cartItems: typeof items, cartSubtotal: number, cartShipping: number, cartTotal: number) => {
        const message = generateWhatsAppMessage(orderNum, cartItems, cartSubtotal, cartShipping, cartTotal);
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
        window.open(whatsappUrl, '_blank');
    };

    const downloadPDF = () => {
        if (pdfBlob && orderNumber) {
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Pedido-${orderNumber}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        }
    };

    const sendOrderEmail = async (
        orderNum: string,
        cartItems: typeof items,
        cartSubtotal: number,
        cartShipping: number,
        cartTotal: number,
        pdfBase64: string
    ) => {
        try {
            const response = await fetch('/api/send-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderNumber: orderNum,
                    shippingInfo,
                    items: cartItems,
                    subtotal: cartSubtotal,
                    shipping: cartShipping,
                    total: cartTotal,
                    pdfBase64,
                }),
            });

            const result = await response.json();
            if (!result.success) {
                console.error('Error enviando email:', result.error);
            }
        } catch (error) {
            console.error('Error enviando email:', error);
        }
    };

    const handleSubmitOrder = async () => {
        if (!validateShipping()) return;

        setIsProcessing(true);

        // Guardar datos del carrito antes de limpiar
        const cartItems = [...items];
        const cartSubtotal = subtotal;
        const cartShipping = shipping;
        const cartTotal = total;

        setOrderItems(cartItems);
        setOrderSubtotal(cartSubtotal);
        setOrderShipping(cartShipping);
        setOrderTotal(cartTotal);

        // Pequeña espera para UX
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generar número de pedido
        const generatedOrderNumber = `SOP-${Date.now().toString(36).toUpperCase()}`;
        setOrderNumber(generatedOrderNumber);

        // Generar PDF
        const pdf = generateOrderPDF(generatedOrderNumber, cartItems, cartSubtotal, cartShipping, cartTotal);
        const pdfOutput = pdf.output('blob');
        setPdfBlob(pdfOutput);

        // Convertir PDF a base64 para enviar por email
        const pdfBase64 = pdf.output('datauristring').split(',')[1];

        // Enviar email con el pedido y PDF
        await sendOrderEmail(generatedOrderNumber, cartItems, cartSubtotal, cartShipping, cartTotal, pdfBase64);

        // Descargar PDF automáticamente
        const pdfUrl = URL.createObjectURL(pdfOutput);
        const pdfLink = document.createElement('a');
        pdfLink.href = pdfUrl;
        pdfLink.download = `Pedido-${generatedOrderNumber}.pdf`;
        pdfLink.click();
        URL.revokeObjectURL(pdfUrl);

        // Pequeña espera antes de abrir WhatsApp
        await new Promise(resolve => setTimeout(resolve, 500));

        // Enviar pedido a WhatsApp
        sendWhatsAppOrder(generatedOrderNumber, cartItems, cartSubtotal, cartShipping, cartTotal);

        // Limpiar carrito
        clearCart();

        setIsProcessing(false);
        setCurrentStep('confirmation');
    };

    const steps = [
        { id: 'shipping', label: 'Envío', icon: Truck },
        { id: 'confirmation', label: 'Confirmación', icon: CheckCircle },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 pt-20">
            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Breadcrumb
                        items={[
                            { label: 'Carrito', href: '/cart' },
                            { label: 'Checkout' }
                        ]}
                    />
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex justify-center">
                        <div className="flex items-center space-x-4 md:space-x-8">
                            {steps.map((step, index) => {
                                const Icon = step.icon;
                                const isActive = step.id === currentStep;
                                const isCompleted = steps.findIndex(s => s.id === currentStep) > index;

                                return (
                                    <div key={step.id} className="flex items-center">
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${isActive ? 'bg-[#505A4A] border-[#505A4A] text-white' :
                                                isCompleted ? 'bg-green-100 border-[#505A4A] text-[#505A4A]' :
                                                    'bg-gray-100 border-gray-300 text-gray-500'
                                            }`}>
                                            {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                        </div>
                                        <span className={`ml-2 font-medium hidden sm:block ${isActive ? 'text-[#505A4A]' : 'text-gray-500'
                                            }`}>
                                            {step.label}
                                        </span>
                                        {index < steps.length - 1 && (
                                            <div className={`w-8 md:w-16 h-0.5 ml-4 ${isCompleted ? 'bg-[#505A4A]' : 'bg-gray-300'
                                                }`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <AnimatePresence mode="wait">
                            {/* Shipping Step */}
                            {currentStep === 'shipping' && (
                                <motion.div
                                    key="shipping"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <Card className="shadow-lg border-0">
                                        <CardContent className="p-6">
                                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                                <MapPin className="w-6 h-6 text-[#505A4A]" />
                                                Información de Envío
                                            </h2>

                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Nombre *
                                                    </label>
                                                    <Input
                                                        value={shippingInfo.firstName}
                                                        onChange={(e) => setShippingInfo({ ...shippingInfo, firstName: e.target.value })}
                                                        className={errors.firstName ? 'border-red-500' : ''}
                                                        placeholder="Tu nombre"
                                                    />
                                                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Apellido *
                                                    </label>
                                                    <Input
                                                        value={shippingInfo.lastName}
                                                        onChange={(e) => setShippingInfo({ ...shippingInfo, lastName: e.target.value })}
                                                        className={errors.lastName ? 'border-red-500' : ''}
                                                        placeholder="Tu apellido"
                                                    />
                                                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Email *
                                                    </label>
                                                    <Input
                                                        type="email"
                                                        value={shippingInfo.email}
                                                        onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                                                        className={errors.email ? 'border-red-500' : ''}
                                                        placeholder="tu@email.com"
                                                    />
                                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Teléfono *
                                                    </label>
                                                    <Input
                                                        type="tel"
                                                        value={shippingInfo.phone}
                                                        onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                                                        className={errors.phone ? 'border-red-500' : ''}
                                                        placeholder="+34 600 000 000"
                                                    />
                                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Dirección *
                                                    </label>
                                                    <Input
                                                        value={shippingInfo.address}
                                                        onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                                                        className={errors.address ? 'border-red-500' : ''}
                                                        placeholder="Calle, número, piso..."
                                                    />
                                                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Ciudad *
                                                    </label>
                                                    <Input
                                                        value={shippingInfo.city}
                                                        onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                                                        className={errors.city ? 'border-red-500' : ''}
                                                        placeholder="Tu ciudad"
                                                    />
                                                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Código Postal *
                                                    </label>
                                                    <Input
                                                        value={shippingInfo.postalCode}
                                                        onChange={(e) => setShippingInfo({ ...shippingInfo, postalCode: e.target.value })}
                                                        className={errors.postalCode ? 'border-red-500' : ''}
                                                        placeholder="28001"
                                                    />
                                                    {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
                                                </div>
                                            </div>

                                            <div className="mt-6 flex justify-between">
                                                <Link href="/cart">
                                                    <Button variant="outline" className="gap-2">
                                                        <ArrowLeft className="w-4 h-4" />
                                                        Volver al carrito
                                                    </Button>
                                                </Link>
                                                <Button
                                                    onClick={handleSubmitOrder}
                                                    disabled={isProcessing}
                                                    className="bg-[#505A4A] hover:bg-[#414A3C] text-white min-w-[180px]"
                                                >
                                                    {isProcessing ? (
                                                        <span className="flex items-center gap-2">
                                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                            </svg>
                                                            Procesando...
                                                        </span>
                                                    ) : (
                                                        `Realizar Pedido €${total.toFixed(2)}`
                                                    )}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            {/* Confirmation Step */}
                            {currentStep === 'confirmation' && (
                                <motion.div
                                    key="confirmation"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <Card className="shadow-lg border-0">
                                        <CardContent className="p-8 text-center">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", duration: 0.5 }}
                                                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                                            >
                                                <CheckCircle className="w-10 h-10 text-green-600" />
                                            </motion.div>

                                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                                ¡Pedido Enviado!
                                            </h2>
                                            <p className="text-gray-600 mb-6">
                                                Tu pedido ha sido enviado por WhatsApp. Te contactaremos pronto para confirmar.
                                            </p>

                                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                                <p className="text-sm text-gray-500">Número de pedido</p>
                                                <p className="text-2xl font-bold text-[#505A4A]">{orderNumber}</p>
                                            </div>

                                            <div className="text-left bg-green-50 rounded-lg p-4 mb-6">
                                                <h3 className="font-semibold text-gray-900 mb-2">Dirección de envío:</h3>
                                                <p className="text-gray-700">
                                                    {shippingInfo.firstName} {shippingInfo.lastName}<br />
                                                    {shippingInfo.address}<br />
                                                    {shippingInfo.postalCode} {shippingInfo.city}<br />
                                                    {shippingInfo.country}
                                                </p>
                                            </div>

                                            {/* Botón descargar PDF */}
                                            {pdfBlob && (
                                                <div className="mb-6">
                                                    <Button
                                                        onClick={downloadPDF}
                                                        className="bg-[#505A4A] hover:bg-[#414A3C] text-white gap-2 w-full sm:w-auto"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Descargar Factura PDF
                                                    </Button>
                                                </div>
                                            )}

                                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                                <Link href="/products">
                                                    <Button className="bg-[#505A4A] hover:bg-[#414A3C] text-white w-full sm:w-auto">
                                                        Seguir comprando
                                                    </Button>
                                                </Link>
                                                <Link href="/">
                                                    <Button variant="outline" className="w-full sm:w-auto border-gray-400 text-gray-700 hover:bg-gray-100">
                                                        Volver al inicio
                                                    </Button>
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Order Summary Sidebar */}
                    {currentStep !== 'confirmation' && (
                        <div className="lg:col-span-1">
                            <Card className="shadow-lg border-0 sticky top-24">
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen del pedido</h3>

                                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                                        {items.map((item) => (
                                            <div key={item.product.id} className="flex items-center gap-3">
                                                <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                    <Image
                                                        src={item.product.image}
                                                        alt={item.product.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <span className="absolute -top-1 -right-1 bg-[#505A4A] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                                        {item.quantity}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {item.product.name}
                                                    </p>
                                                    <p className="text-sm text-gray-700 font-medium">
                                                        €{item.product.price.toFixed(2)} x {item.quantity}
                                                    </p>
                                                </div>
                                                <span className="text-sm font-bold text-gray-900">
                                                    €{(item.product.price * item.quantity).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t pt-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-700 font-medium">Subtotal</span>
                                            <span className="text-gray-900 font-semibold">€{subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-700 font-medium">Envío</span>
                                            <span className={shipping === 0 ? 'text-green-600 font-semibold' : 'text-gray-900 font-semibold'}>
                                                {shipping === 0 ? 'Gratis' : `€${shipping.toFixed(2)}`}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                            <span className="text-gray-900">Total</span>
                                            <span className="text-[#505A4A]">€{total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {shipping > 0 && (
                                        <div className="mt-4 bg-yellow-50 rounded-lg p-3 text-sm">
                                            <p className="text-yellow-800">
                                                Añade €{(50 - subtotal).toFixed(2)} más para envío gratis
                                            </p>
                                        </div>
                                    )}

                                    {/* Manager Discount Badge */}
                                    {isManager && (
                                        <div className="mt-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-4 border border-green-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white">
                                                    <Percent className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs text-green-700 font-medium">Precio de Gestor Aplicado</p>
                                                    <p className="text-sm font-bold text-green-800">30% de descuento</p>
                                                    <p className="text-xs text-green-600">{user?.name} • {user?.managerCode}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Show user info if authenticated */}
                                    {isAuthenticated && user && !isManager && (
                                        <div className="mt-4 bg-gradient-to-r from-[#505A4A]/10 to-[#414A3C]/10 rounded-lg p-4 border border-[#505A4A]/20">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#505A4A] flex items-center justify-center text-white font-bold text-sm">
                                                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs text-[#505A4A] font-medium">Cliente</p>
                                                    <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                                    <p className="text-xs text-gray-600">{user.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!isAuthenticated && (
                                        <div className="mt-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
                                            <p className="text-blue-800 text-sm font-medium">
                                                💡 ¿Eres gestor?
                                            </p>
                                            <p className="text-blue-700 text-xs mt-1">
                                                <Link href="/auth" className="underline hover:text-blue-900">Inicia sesión</Link> para obtener precios especiales con 30% de descuento.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
