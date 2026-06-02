"use client";

import { useState } from "react";
import { useCart, useLocation } from "@/store";
import { Minus, Plus, ShoppingBag, ArrowLeft, X, MapPin, MessageCircle, Loader2, FileText } from "lucide-react";
import ProductImage from "@/components/ui/product-image";
import { m, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Breadcrumb from "@/components/ui/breadcrumb";
import LocationPopup from "@/components/LocationPopup";
import { buildOrderMessage } from "@/lib/whatsapp-message";
import { generateOrderPdf } from "@/lib/order-pdf";
import { sendOrderViaWhatsApp, generateOrderFileName } from "@/lib/order-share";
import { useGestorByLocation } from "@/hooks/useGestorByLocation";

const WHATSAPP_GENERAL = "34642633982";

export default function CartPage() {
    const {
        items,
        updateQuantity,
        removeItem,
        clearCart,
        totalItems,
        subtotal,
        isLoaded
    } = useCart();
    const { location } = useLocation();
    // Resolución asíncrona del gestor (mismo hook que CartDrawer para
    // garantizar que /cart y el drawer se comportan idénticos)
    const { gestor, loading: gestorLoading } = useGestorByLocation(location);

    const [isSending, setIsSending] = useState(false);
    const [showLocationEditor, setShowLocationEditor] = useState(false);

    const formatPrice = (price: number) => `$${price.toFixed(2)}`;

    // PDF del pedido — diseño profesional de marca centralizado en
    // src/lib/order-pdf.ts (compartido con el CartDrawer).
    const buildOrderPdf = () =>
        generateOrderPdf({
            items: items.map((i) => ({
                name: i.product.name,
                price: i.product.price,
                quantity: i.quantity,
            })),
            subtotal,
            province: location?.province,
            municipality: location?.municipality,
            gestor,
        });

    const handleWhatsAppOrder = async () => {
        setIsSending(true);
        try {
            const pdfBlob = await buildOrderPdf();
            const phone = gestor ? gestor.whatsapp : WHATSAPP_GENERAL;
            const message = buildOrderMessage({
                gestorName: gestor?.name,
                municipality: location?.municipality,
                province: location?.province,
                items: items.map((i) => ({
                    productName: i.product.name,
                    quantity: i.quantity,
                    lineSubtotal: i.product.price * i.quantity,
                })),
                subtotal,
                formatPrice,
            });

            // El helper unifica Web Share API + fallback de descarga + redirect
            // a wa.me con el mismo comportamiento que el CartDrawer.
            await sendOrderViaWhatsApp({
                pdfBlob,
                fileName: generateOrderFileName(),
                whatsappNumber: phone,
                message,
            });
            clearCart();
        } catch (err) {
            console.error('Error generating order:', err);
        } finally {
            setIsSending(false);
        }
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FEFCF7]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2E4A3A] border-t-transparent" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[#FEFCF7] dark:bg-[#1a1d19] pt-20">
                <div className="max-w-xl mx-auto px-6 pb-16">
                    <Breadcrumb items={[{ label: 'Carrito' }]} />
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="text-center pt-28 pb-20"
                    >
                        <ShoppingBag className="h-10 w-10 text-[#2E4A3A]/20 dark:text-[#C9A96E]/30 mx-auto mb-8" strokeWidth={1} />
                        <h1 className="text-[28px] font-light text-[#333] dark:text-[#e8e0d0] dark:text-[#e8e0d0] tracking-[-0.01em] mb-3">
                            Tu carrito esta vacio
                        </h1>
                        <p className="text-[15px] text-[#888] dark:text-[#C9A96E]/60 font-light leading-relaxed mb-12">
                            Explora nuestra coleccion y encuentra tu rutina ideal.
                        </p>
                        <Link
                            href="/"
                            className="inline-block border border-[#2E4A3A] dark:border-[#C9A96E] text-[#2E4A3A] dark:text-[#C9A96E] px-10 py-3.5 text-[13px] font-medium tracking-[0.08em] uppercase hover:bg-[#2E4A3A] hover:text-white dark:hover:bg-[#C9A96E] dark:hover:text-[#1a1d19] transition-all duration-300"
                        >
                            Ver Productos
                        </Link>
                    </m.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FEFCF7] dark:bg-[#1a1d19] pt-20">
            <div className="max-w-[1200px] mx-auto px-6 lg:px-10 pb-8 sm:pb-14">
                <Breadcrumb items={[{ label: 'Carrito' }]} />

                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-[32px] sm:text-[38px] font-light text-[#333] dark:text-[#e8e0d0] tracking-[-0.02em] mt-8 mb-2">
                        Tu Carrito
                    </h1>
                    <p className="text-[14px] text-[#999] dark:text-[#C9A96E]/50 font-light mb-12">
                        {totalItems} {totalItems === 1 ? 'artículo' : 'artículos'}
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
                        {/* Items */}
                        <div className="lg:col-span-7">
                            <div className="border-t border-[#E8E4DD] dark:border-[#3a3d36]">
                                <AnimatePresence mode="popLayout">
                                    {items.map((item) => (
                                        <m.div
                                            key={item.product.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.3 } }}
                                            className="border-b border-[#E8E4DD] dark:border-[#3a3d36] py-8"
                                        >
                                            <div className="flex gap-6 sm:gap-8">
                                                <Link href={`/products/${item.product.id}`} className="shrink-0">
                                                    <div className="relative w-[110px] h-[140px] sm:w-[130px] sm:h-[160px] overflow-hidden bg-[#F0EDE6] dark:bg-[#2a2d27] group">
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
                                                            <span className="text-[11px] uppercase tracking-[0.15em] text-[#999] dark:text-[#C9A96E]/50 block mb-1.5">
                                                                {item.product.category}
                                                            </span>
                                                        )}
                                                        <Link href={`/products/${item.product.id}`}>
                                                            <h3 className="text-[16px] sm:text-[18px] font-light text-[#333] dark:text-[#e8e0d0] hover:text-[#2E4A3A] transition-colors tracking-[-0.01em] leading-tight">
                                                                {item.product.name}
                                                            </h3>
                                                        </Link>
                                                        <div className="flex items-baseline gap-2.5 mt-2.5">
                                                            <span className="text-[15px] text-[#333] dark:text-[#e8e0d0]">${item.product.price.toFixed(2)}</span>
                                                            {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                                                                <span className="text-[13px] text-[#BBB] line-through">${item.product.originalPrice.toFixed(2)}</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="inline-flex items-center border border-[#D5D0C8] h-[38px]">
                                                            <button
                                                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                                className="w-[38px] h-full flex items-center justify-center text-[#999] dark:text-[#C9A96E]/50 hover:text-[#333] dark:text-[#e8e0d0] transition-colors"
                                                                aria-label="Disminuir cantidad"
                                                            >
                                                                <Minus className="h-3 w-3" strokeWidth={1.5} />
                                                            </button>
                                                            <span className="w-[38px] text-center text-[13px] text-[#333] dark:text-[#e8e0d0] tabular-nums select-none border-x border-[#D5D0C8]">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                                className="w-[38px] h-full flex items-center justify-center text-[#999] dark:text-[#C9A96E]/50 hover:text-[#333] dark:text-[#e8e0d0] transition-colors"
                                                                aria-label="Aumentar cantidad"
                                                            >
                                                                <Plus className="h-3 w-3" strokeWidth={1.5} />
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center gap-5">
                                                            <span className="text-[15px] text-[#333] dark:text-[#e8e0d0] tabular-nums">
                                                                ${(item.product.price * item.quantity).toFixed(2)}
                                                            </span>
                                                            <button
                                                                onClick={() => removeItem(item.product.id)}
                                                                className="text-[#CCC] hover:text-[#999] dark:text-[#C9A96E]/50 transition-colors"
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
                                className="inline-flex items-center gap-2 mt-8 text-[13px] text-[#2E4A3A] hover:text-[#333] dark:text-[#e8e0d0] tracking-[0.04em] uppercase font-medium transition-colors group"
                            >
                                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" strokeWidth={1.5} />
                                Seguir Comprando
                            </Link>
                        </div>

                        {/* Resumen */}
                        <div className="lg:col-span-5">
                            <div className="sticky top-10">
                                <div className="bg-[#F5F1E8]/60 dark:bg-[#C9A96E]/5 p-8 sm:p-10">
                                    <h2 className="text-[13px] uppercase tracking-[0.15em] text-[#666] font-medium mb-8">
                                        Resumen del pedido
                                    </h2>

                                    {/* Location info */}
                                    {location && (
                                        <div className="flex items-start justify-between gap-3 mb-6 pb-6 border-b border-[#D5D0C8]/40">
                                            <div className="flex items-start gap-2 min-w-0">
                                                <MapPin className="w-4 h-4 text-[#2E4A3A] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                                                <div className="min-w-0">
                                                    <p className="text-[13px] text-[#333] dark:text-[#e8e0d0] font-medium truncate">
                                                        {location.municipality}, {location.province}
                                                    </p>
                                                    {gestorLoading ? (
                                                        <p className="text-[11px] text-[#999] dark:text-[#C9A96E]/50 mt-0.5">Buscando repartidor...</p>
                                                    ) : gestor ? (
                                                        <p className="text-[11px] text-[#2E4A3A] mt-0.5">
                                                            Entrega por {gestor.name}
                                                        </p>
                                                    ) : (
                                                        <p className="text-[11px] text-[#C4956A] mt-0.5">
                                                            Sin repartidor en tu zona
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowLocationEditor(true)}
                                                className="text-[11px] uppercase tracking-[0.1em] text-[#2E4A3A] hover:text-[#26402F] underline underline-offset-2 flex-shrink-0 mt-0.5"
                                            >
                                                Cambiar
                                            </button>
                                        </div>
                                    )}

                                    <div className="space-y-4 text-[14px]">
                                        <div className="flex justify-between">
                                            <span className="text-[#666]">Subtotal productos</span>
                                            <span className="text-[#333] dark:text-[#e8e0d0] tabular-nums">${subtotal.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-[#D5D0C8]/60 mt-6 pt-6">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-[14px] text-[#333] dark:text-[#e8e0d0]">Total a pagar</span>
                                            <span className="text-[24px] font-light text-[#333] dark:text-[#e8e0d0] tabular-nums tracking-tight">
                                                ${subtotal.toFixed(2)}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-[#666] mt-3 leading-relaxed">
                                            Este total cubre <strong className="font-medium text-[#333] dark:text-[#e8e0d0]">solo los productos</strong>. La mensajería y el envío se coordinan directamente con {gestor ? `${gestor.name}, tu gestor de zona.` : 'tu gestor de zona.'}
                                        </p>
                                    </div>

                                    {/* WhatsApp order button */}
                                    <button
                                        onClick={handleWhatsAppOrder}
                                        disabled={isSending || items.length === 0}
                                        className="w-full mt-8 bg-[#2E4A3A] text-white h-[52px] text-[13px] font-medium tracking-[0.1em] uppercase hover:bg-[#26402F] transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
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
                                        <p className="text-[11px] text-[#AAA] tracking-[0.05em]">Devolución 30 días</p>
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

            {showLocationEditor && (
                <LocationPopup open={showLocationEditor} onOpenChange={setShowLocationEditor} />
            )}
        </div>
    );
}
