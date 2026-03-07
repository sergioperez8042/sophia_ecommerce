"use client";

import { useState } from 'react';
import { ArrowLeft, MessageCircle, Sun, Moon, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ProductImage from "@/components/ui/product-image";
import { m } from 'framer-motion';
import { useTheme } from '@/store/ThemeContext';

const WHATSAPP_NUMBER = "34642633982";

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category_id: string;
    rating: number;
    reviews_count: number;
    featured: boolean;
    active: boolean;
}

interface CatalogProductDetailProps {
    product: Product;
    categoryName: string;
}

export default function CatalogProductDetail({ product, categoryName }: CatalogProductDetailProps) {
    const { isDark, toggleTheme } = useTheme();
    const [selectedImage, setSelectedImage] = useState(0);

    const images = product.image ? [product.image] : [];

    const formatPrice = (price: number) => `$${price.toFixed(2)}`;

    const handleWhatsAppOrder = () => {
        const message = encodeURIComponent(
            `Hola! Me interesa el producto:\n\n` +
            `*${product.name}*\n` +
            `Precio: ${formatPrice(product.price)}\n\n` +
            `Me gustaría hacer un pedido.`
        );
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#1a1d19]' : 'bg-[#FEFCF7]'}`}>
            {/* Header — same as catalog */}
            <m.header
                className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-300 ${isDark ? 'bg-[#1a1d19]/95 border-[#C4B590]/15' : 'bg-white/80 border-[#505A4A]/10'}`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16 sm:h-20">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/"
                                className={`flex items-center justify-center h-9 w-9 rounded-lg transition-colors ${isDark ? 'hover:bg-[#C4B590]/15' : 'hover:bg-gray-100'}`}
                                aria-label="Volver al catálogo"
                            >
                                <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`} />
                            </Link>
                            <Link href="/" className="flex items-center gap-3">
                                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden shadow-sm ring-1 ring-[#505A4A]/15">
                                    <Image
                                        src="/images/sophia_logo_nuevo.jpeg"
                                        alt="Sophia Cosmética Botánica"
                                        fill
                                        sizes="48px"
                                        className="object-cover"
                                        priority
                                    />
                                </div>
                                <span className={`text-base sm:text-lg font-semibold tracking-tight leading-tight ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}>Sophia</span>
                            </Link>
                        </div>

                        <div className="flex items-center gap-2">
                            <m.button
                                onClick={toggleTheme}
                                className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-[#C4B590]/15 text-[#C4B590] hover:bg-[#C4B590]/25' : 'bg-[#505A4A]/10 text-[#505A4A] hover:bg-[#505A4A]/20'}`}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
                            >
                                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </m.button>
                        </div>
                    </div>
                </div>
            </m.header>

            {/* Product Detail */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12"
                >
                    {/* Image */}
                    <div className="relative aspect-square rounded-2xl overflow-hidden">
                        {images.length > 0 ? (
                            <ProductImage
                                src={images[selectedImage]}
                                alt={product.name}
                                className="object-cover"
                            />
                        ) : (
                            <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-[#22261f]' : 'bg-[#F0EDE6]'}`}>
                                <span className={`text-sm ${isDark ? 'text-[#7a7568]' : 'text-[#999]'}`}>Sin imagen</span>
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col">
                        {categoryName && (
                            <span className={`text-xs uppercase tracking-[0.15em] mb-2 ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}>
                                {categoryName}
                            </span>
                        )}

                        <h1 className={`text-2xl sm:text-3xl font-semibold mb-3 ${isDark ? 'text-[#e8e4dc]' : 'text-gray-900'}`}>
                            {product.name}
                        </h1>

                        <p className={`text-sm sm:text-base leading-relaxed mb-6 ${isDark ? 'text-[#8a8278]' : 'text-gray-600'}`}>
                            {product.description}
                        </p>

                        <div className="mb-8">
                            <span className={`text-3xl font-bold ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}>
                                {formatPrice(product.price)}
                            </span>
                        </div>

                        {/* WhatsApp CTA */}
                        <m.button
                            onClick={handleWhatsAppOrder}
                            className="w-full bg-[#505A4A] text-white py-4 rounded-xl text-base font-medium flex items-center justify-center gap-3 hover:bg-[#414A3C] transition-colors shadow-md"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <MessageCircle className="w-5 h-5" />
                            Pedir por WhatsApp
                        </m.button>

                        {/* Back link */}
                        <Link
                            href="/"
                            className={`inline-flex items-center gap-2 mt-8 text-sm font-medium transition-colors ${isDark ? 'text-[#C4B590] hover:text-[#e8e4dc]' : 'text-[#505A4A] hover:text-gray-900'}`}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver al catálogo
                        </Link>
                    </div>
                </m.div>
            </div>
        </div>
    );
}
