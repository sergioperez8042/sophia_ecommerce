"use client";

import { useState, useEffect } from "react";
import { useCart, useLocation } from "@/store";
import { Minus, Plus, ShoppingBag, ArrowLeft, X, MapPin, MessageCircle, Loader2, FileText } from "lucide-react";
import ProductImage from "@/components/ui/product-image";
import { m, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Breadcrumb from "@/components/ui/breadcrumb";
import { GestorService } from "@/lib/firestore-services";
import { IGestor } from "@/entities/all";

const WHATSAPP_GENERAL = "34642633982";

export default function CartPage() {
    const {
        items,
        updateQuantity,
        removeItem,
        clearCart,
        totalItems,
        subtotal,
        shipping,
        total,
        isLoaded
    } = useCart();
    const { location } = useLocation();
    const [gestor, setGestor] = useState<IGestor | null>(null);
    const [gestorLoading, setGestorLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Find gestor when location changes
    useEffect(() => {
        if (!location?.municipality) {
            setGestor(null);
            return;
        }
        const findGestor = async () => {
            setGestorLoading(true);
            try {
                const found = await GestorService.findByMunicipality(location.municipality);
                setGestor(found);
            } catch {
                setGestor(null);
            } finally {
                setGestorLoading(false);
            }
        };
        findGestor();
    }, [location?.municipality]);

    const formatPrice = (price: number) => `$${price.toFixed(2)}`;

    // Generate minimalist branded PDF
    const generateOrderPDF = async (): Promise<Blob> => {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        const pw = doc.internal.pageSize.getWidth();
        const margin = 25;
        const contentWidth = pw - margin * 2;

        // Background
        doc.setFillColor(254, 252, 247);
        doc.rect(0, 0, pw, doc.internal.pageSize.getHeight(), 'F');

        // Top accent line
        doc.setFillColor(80, 90, 74);
        doc.rect(0, 0, pw, 3, 'F');

        // Brand name
        let y = 30;
        doc.setTextColor(80, 90, 74);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'normal');
        doc.text('Sophia', margin, y);

        doc.setFontSize(9);
        doc.setTextColor(160, 152, 137);
        doc.text('Cosmetica Botanica', margin, y + 8);

        // Date
        doc.setFontSize(9);
        doc.setTextColor(160, 152, 137);
        const dateStr = new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
        doc.text(dateStr, pw - margin, y, { align: 'right' });

        // Separator
        y += 18;
        doc.setDrawColor(196, 181, 144);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pw - margin, y);

        // Location
        y += 12;
        if (location) {
            doc.setFontSize(9);
            doc.setTextColor(120, 120, 120);
            doc.text(`Entrega: ${location.municipality}, ${location.province}`, margin, y);
            y += 10;
        }

        // Items header
        y += 2;
        doc.setFontSize(8);
        doc.setTextColor(160, 152, 137);
        doc.text('PRODUCTO', margin, y);
        doc.text('CANT.', margin + contentWidth * 0.6, y);
        doc.text('PRECIO', margin + contentWidth * 0.75, y);
        doc.text('SUBTOTAL', pw - margin, y, { align: 'right' });

        y += 4;
        doc.setDrawColor(230, 226, 219);
        doc.setLineWidth(0.2);
        doc.line(margin, y, pw - margin, y);
        y += 8;

        // Items
        doc.setTextColor(60, 60, 60);
        items.forEach((item) => {
            if (y > 265) {
                doc.addPage();
                doc.setFillColor(254, 252, 247);
                doc.rect(0, 0, pw, doc.internal.pageSize.getHeight(), 'F');
                y = 25;
            }
            const itemSub = item.product.price * item.quantity;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(item.product.name.substring(0, 35), margin, y);
            doc.setFontSize(9);
            doc.setTextColor(120, 120, 120);
            doc.text(String(item.quantity), margin + contentWidth * 0.63, y);
            doc.text(formatPrice(item.product.price), margin + contentWidth * 0.75, y);
            doc.setTextColor(80, 90, 74);
            doc.text(formatPrice(itemSub), pw - margin, y, { align: 'right' });

            y += 5;
            doc.setDrawColor(240, 237, 230);
            doc.setLineWidth(0.1);
            doc.line(margin, y, pw - margin, y);
            y += 8;
            doc.setTextColor(60, 60, 60);
        });

        // Total
        y += 4;
        doc.setDrawColor(196, 181, 144);
        doc.setLineWidth(0.4);
        doc.line(margin + contentWidth * 0.5, y, pw - margin, y);
        y += 12;

        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        doc.text('Total', margin + contentWidth * 0.55, y);

        doc.setFontSize(16);
        doc.setTextColor(80, 90, 74);
        doc.setFont('helvetica', 'bold');
        doc.text(formatPrice(subtotal), pw - margin, y, { align: 'right' });

        // Footer
        const footerY = doc.internal.pageSize.getHeight() - 15;
        doc.setDrawColor(230, 226, 219);
        doc.setLineWidth(0.2);
        doc.line(margin, footerY - 8, pw - margin, footerY - 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(180, 175, 165);
        doc.text('Sophia Cosmetica Botanica', pw / 2, footerY, { align: 'center' });

        return doc.output('blob');
    };

    const handleWhatsAppOrder = async () => {
        setIsSending(true);
        try {
            const pdfBlob = await generateOrderPDF();
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Sophia_Pedido_${Date.now()}.pdf`;
            link.click();
            URL.revokeObjectURL(url);

            const phone = gestor ? gestor.whatsapp : WHATSAPP_GENERAL;
            const itemsList = items
                .map((i) => `- ${i.product.name} x${i.quantity} (${formatPrice(i.product.price * i.quantity)})`)
                .join('\n');
            const message = `Hola${gestor ? ` ${gestor.name}` : ''}, te envio mi pedido de Sophia:\n\n${itemsList}\n\nTotal: ${formatPrice(subtotal)}\n\nZona: ${location?.municipality || ''}, ${location?.province || ''}\n\nTe adjunto el PDF con los detalles.`;
            const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

            setTimeout(() => {
                window.open(waUrl, '_blank');
                clearCart();
            }, 500);
        } catch (err) {
            console.error('Error generating order:', err);
        } finally {
            setIsSending(false);
        }
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FEFCF7]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#505A4A] border-t-transparent" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[#FEFCF7] pt-20">
                <div className="max-w-xl mx-auto px-6 pb-16">
                    <Breadcrumb items={[{ label: 'Carrito' }]} />
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="text-center pt-28 pb-20"
                    >
                        <ShoppingBag className="h-10 w-10 text-[#505A4A]/20 mx-auto mb-8" strokeWidth={1} />
                        <h1 className="text-[28px] font-light text-[#333] tracking-[-0.01em] mb-3">
                            Tu carrito esta vacio
                        </h1>
                        <p className="text-[15px] text-[#888] font-light leading-relaxed mb-12">
                            Explora nuestra coleccion y encuentra tu rutina ideal.
                        </p>
                        <Link
                            href="/"
                            className="inline-block border border-[#505A4A] text-[#505A4A] px-10 py-3.5 text-[13px] font-medium tracking-[0.08em] uppercase hover:bg-[#505A4A] hover:text-white transition-all duration-300"
                        >
                            Ver Productos
                        </Link>
                    </m.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FEFCF7] pt-20">
            <div className="max-w-[1200px] mx-auto px-6 lg:px-10 pb-8 sm:pb-14">
                <Breadcrumb items={[{ label: 'Carrito' }]} />

                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-[32px] sm:text-[38px] font-light text-[#333] tracking-[-0.02em] mt-8 mb-2">
                        Tu Carrito
                    </h1>
                    <p className="text-[14px] text-[#999] font-light mb-12">
                        {totalItems} {totalItems === 1 ? 'articulo' : 'articulos'}
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
                        {/* Items */}
                        <div className="lg:col-span-7">
                            <div className="border-t border-[#E8E4DD]">
                                <AnimatePresence mode="popLayout">
                                    {items.map((item) => (
                                        <m.div
                                            key={item.product.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.3 } }}
                                            className="border-b border-[#E8E4DD] py-8"
                                        >
                                            <div className="flex gap-6 sm:gap-8">
                                                <Link href={`/products/${item.product.id}`} className="shrink-0">
                                                    <div className="relative w-[110px] h-[140px] sm:w-[130px] sm:h-[160px] overflow-hidden bg-[#F0EDE6] group">
                                                        <ProductImage
                                                            src={item.product.image}
                                                            alt={item.product.name}
                                                            className="object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                                                        />
                                                    </div>
                                                </Link>

                                                <div className="flex-1 flex flex-col justify-between min-h-[140px] sm:min-h-[160px]">
                                                    <div>
                                                        {item.product.category && (
                                                            <span className="text-[11px] uppercase tracking-[0.15em] text-[#999] block mb-1.5">
                                                                {item.product.category}
                                                            </span>
                                                        )}
                                                        <Link href={`/products/${item.product.id}`}>
                                                            <h3 className="text-[16px] sm:text-[18px] font-light text-[#333] hover:text-[#505A4A] transition-colors tracking-[-0.01em] leading-tight">
                                                                {item.product.name}
                                                            </h3>
                                                        </Link>
                                                        <div className="flex items-baseline gap-2.5 mt-2.5">
                                                            <span className="text-[15px] text-[#333]">${item.product.price.toFixed(2)}</span>
                                                            {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                                                                <span className="text-[13px] text-[#BBB] line-through">${item.product.originalPrice.toFixed(2)}</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="inline-flex items-center border border-[#D5D0C8] h-[38px]">
                                                            <button
                                                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                                className="w-[38px] h-full flex items-center justify-center text-[#999] hover:text-[#333] transition-colors"
                                                                aria-label="Disminuir cantidad"
                                                            >
                                                                <Minus className="h-3 w-3" strokeWidth={1.5} />
                                                            </button>
                                                            <span className="w-[38px] text-center text-[13px] text-[#333] tabular-nums select-none border-x border-[#D5D0C8]">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                                className="w-[38px] h-full flex items-center justify-center text-[#999] hover:text-[#333] transition-colors"
                                                                aria-label="Aumentar cantidad"
                                                            >
                                                                <Plus className="h-3 w-3" strokeWidth={1.5} />
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center gap-5">
                                                            <span className="text-[15px] text-[#333] tabular-nums">
                                                                ${(item.product.price * item.quantity).toFixed(2)}
                                                            </span>
                                                            <button
                                                                onClick={() => removeItem(item.product.id)}
                                                                className="text-[#CCC] hover:text-[#999] transition-colors"
                                                                title="Eliminar"
                                                            >
                                                                <X className="h-[18px] w-[18px]" strokeWidth={1.5} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </m.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 mt-8 text-[13px] text-[#505A4A] hover:text-[#333] tracking-[0.04em] uppercase font-medium transition-colors group"
                            >
                                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" strokeWidth={1.5} />
                                Seguir Comprando
                            </Link>
                        </div>

                        {/* Resumen */}
                        <div className="lg:col-span-5">
                            <div className="sticky top-10">
                                <div className="bg-[#F5F1E8]/60 p-8 sm:p-10">
                                    <h2 className="text-[13px] uppercase tracking-[0.15em] text-[#666] font-medium mb-8">
                                        Resumen del pedido
                                    </h2>

                                    {/* Location info */}
                                    {location && (
                                        <div className="flex items-center gap-2 mb-6 pb-6 border-b border-[#D5D0C8]/40">
                                            <MapPin className="w-4 h-4 text-[#505A4A]" strokeWidth={1.5} />
                                            <div>
                                                <p className="text-[13px] text-[#333] font-medium">
                                                    {location.municipality}, {location.province}
                                                </p>
                                                {gestorLoading ? (
                                                    <p className="text-[11px] text-[#999] mt-0.5">Buscando repartidor...</p>
                                                ) : gestor ? (
                                                    <p className="text-[11px] text-[#505A4A] mt-0.5">
                                                        Entrega por {gestor.name}
                                                    </p>
                                                ) : (
                                                    <p className="text-[11px] text-[#C4956A] mt-0.5">
                                                        Sin repartidor en tu zona
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4 text-[14px]">
                                        <div className="flex justify-between">
                                            <span className="text-[#666]">Subtotal</span>
                                            <span className="text-[#333] tabular-nums">${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#666]">Envio</span>
                                            {shipping === 0 ? (
                                                <span className="text-[#505A4A]">Cortesia</span>
                                            ) : (
                                                <span className="text-[#333] tabular-nums">${shipping.toFixed(2)}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border-t border-[#D5D0C8]/60 mt-6 pt-6">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-[14px] text-[#333]">Total</span>
                                            <span className="text-[24px] font-light text-[#333] tabular-nums tracking-tight">
                                                ${total.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* WhatsApp order button */}
                                    <button
                                        onClick={handleWhatsAppOrder}
                                        disabled={isSending || items.length === 0}
                                        className="w-full mt-8 bg-[#505A4A] text-white h-[52px] text-[13px] font-medium tracking-[0.1em] uppercase hover:bg-[#414A3C] transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isSending ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Generando pedido...
                                            </>
                                        ) : (
                                            <>
                                                <MessageCircle className="w-4 h-4" />
                                                Pedir por WhatsApp
                                            </>
                                        )}
                                    </button>

                                    <p className="text-[11px] text-[#AAA] text-center mt-4 font-light leading-relaxed">
                                        <FileText className="w-3 h-3 inline mr-1" />
                                        Se descargara un PDF con tu pedido y se abrira WhatsApp
                                        {gestor ? ` con ${gestor.name}` : ''}.
                                    </p>
                                </div>

                                {/* Garantias */}
                                <div className="mt-8 flex justify-between px-2">
                                    <div className="text-center">
                                        <p className="text-[11px] text-[#AAA] tracking-[0.05em]">Envio Express</p>
                                    </div>
                                    <div className="text-[#DDD]">·</div>
                                    <div className="text-center">
                                        <p className="text-[11px] text-[#AAA] tracking-[0.05em]">Devolucion 30 dias</p>
                                    </div>
                                    <div className="text-[#DDD]">·</div>
                                    <div className="text-center">
                                        <p className="text-[11px] text-[#AAA] tracking-[0.05em]">Pago Seguro</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </m.div>
            </div>
        </div>
    );
}
