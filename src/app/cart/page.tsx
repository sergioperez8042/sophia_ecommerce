"use client";

import { useCart } from "@/store";
import { Minus, Plus, ShoppingBag, ArrowLeft, X } from "lucide-react";
import ProductImage from "@/components/ui/product-image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Breadcrumb from "@/components/ui/breadcrumb";

export default function CartPage() {
    const {
        items,
        updateQuantity,
        removeItem,
        totalItems,
        subtotal,
        shipping,
        total,
        isLoaded
    } = useCart();

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FEFCF7]">
                <div className="animate-spin rounded-full h-6 w-6 border border-[#505A4A] border-t-transparent" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[#FEFCF7]">
                <div className="max-w-xl mx-auto px-6 py-16">
                    <Breadcrumb items={[{ label: 'Carrito' }]} />
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="text-center pt-28 pb-20"
                    >
                        <ShoppingBag className="h-10 w-10 text-[#505A4A]/20 mx-auto mb-8" strokeWidth={1} />
                        <h1 className="text-[28px] font-light text-[#333] tracking-[-0.01em] mb-3">
                            Tu carrito está vacío
                        </h1>
                        <p className="text-[15px] text-[#888] font-light leading-relaxed mb-12">
                            Explora nuestra colección y encuentra tu rutina ideal.
                        </p>
                        <Link
                            href="/products"
                            className="inline-block border border-[#505A4A] text-[#505A4A] px-10 py-3.5 text-[13px] font-medium tracking-[0.08em] uppercase hover:bg-[#505A4A] hover:text-white transition-all duration-300"
                        >
                            Ver Productos
                        </Link>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FEFCF7]">
            <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-8 sm:py-14">
                <Breadcrumb items={[{ label: 'Carrito' }]} />

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-[32px] sm:text-[38px] font-light text-[#333] tracking-[-0.02em] mt-8 mb-2">
                        Tu Carrito
                    </h1>
                    <p className="text-[14px] text-[#999] font-light mb-12">
                        {totalItems} {totalItems === 1 ? 'artículo' : 'artículos'}
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
                        {/* Items */}
                        <div className="lg:col-span-7">
                            <div className="border-t border-[#E8E4DD]">
                                <AnimatePresence mode="popLayout">
                                    {items.map((item) => (
                                        <motion.div
                                            key={item.product.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.3 } }}
                                            className="border-b border-[#E8E4DD] py-8"
                                        >
                                            <div className="flex gap-6 sm:gap-8">
                                                {/* Imagen */}
                                                <Link href={`/products/${item.product.id}`} className="shrink-0">
                                                    <div className="relative w-[110px] h-[140px] sm:w-[130px] sm:h-[160px] overflow-hidden bg-[#F0EDE6] group">
                                                        <ProductImage
                                                            src={item.product.image}
                                                            alt={item.product.name}
                                                            className="object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                                                        />
                                                    </div>
                                                </Link>

                                                {/* Detalles */}
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
                                                        {/* Cantidad */}
                                                        <div className="inline-flex items-center border border-[#D5D0C8] h-[38px]">
                                                            <button
                                                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                                className="w-[38px] h-full flex items-center justify-center text-[#999] hover:text-[#333] transition-colors"
                                                            >
                                                                <Minus className="h-3 w-3" strokeWidth={1.5} />
                                                            </button>
                                                            <span className="w-[38px] text-center text-[13px] text-[#333] tabular-nums select-none border-x border-[#D5D0C8]">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                                className="w-[38px] h-full flex items-center justify-center text-[#999] hover:text-[#333] transition-colors"
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
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            <Link
                                href="/products"
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

                                    <div className="space-y-4 text-[14px]">
                                        <div className="flex justify-between">
                                            <span className="text-[#666]">Subtotal</span>
                                            <span className="text-[#333] tabular-nums">${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#666]">Envío</span>
                                            {shipping === 0 ? (
                                                <span className="text-[#505A4A]">Cortesía</span>
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

                                    <Link href="/checkout" className="block mt-8">
                                        <button className="w-full bg-[#505A4A] text-white h-[52px] text-[13px] font-medium tracking-[0.1em] uppercase hover:bg-[#414A3C] transition-colors duration-300">
                                            Finalizar Compra
                                        </button>
                                    </Link>

                                    {shipping > 0 && (
                                        <p className="text-[12px] text-[#AAA] text-center mt-5 font-light">
                                            Envío gratuito en pedidos superiores a $50
                                        </p>
                                    )}
                                </div>

                                {/* Garantías */}
                                <div className="mt-8 flex justify-between px-2">
                                    <div className="text-center">
                                        <p className="text-[11px] text-[#AAA] tracking-[0.05em]">Envío Express</p>
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
                </motion.div>
            </div>
        </div>
    );
}
