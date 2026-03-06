"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Star, Search, Leaf, Phone, Mail, Instagram, MessageCircle, Rabbit, Droplets, ShieldCheck, Hand, Sun, Moon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ProductImage from "@/components/ui/product-image";
import { m, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/store/ThemeContext';
import BrandLogo from '@/components/BrandLogo';

const WHATSAPP_NUMBER = "34642633982";
const HERO_VIDEO = "/videos/sophi.mp4";

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

interface Category {
    id: string;
    name: string;
    icon: string;
}

interface CatalogViewProps {
    initialProducts: Product[];
    initialCategories: Category[];
}

export default function CatalogView({ initialProducts, initialCategories }: CatalogViewProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [visibleCount, setVisibleCount] = useState(5);
    const viewMode = "list" as const;
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const { isDark, toggleTheme } = useTheme();

    const filteredProducts = useMemo(() => {
        let filtered = [...initialProducts];

        if (selectedCategory !== "all") {
            filtered = filtered.filter(p => p.category_id === selectedCategory);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.description?.toLowerCase().includes(term)
            );
        }

        return filtered;
    }, [initialProducts, selectedCategory, searchTerm]);

    const getCategoryName = (categoryId: string) => {
        return initialCategories.find(c => c.id === categoryId)?.name || "Sin categoría";
    };

    // Infinite scroll: cargar 5 más al llegar al sentinel
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const hasMore = visibleCount < filteredProducts.length;

    useEffect(() => {
        if (!hasMore || !sentinelRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount(prev => prev + 5);
                }
            },
            { rootMargin: '200px' }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [hasMore, visibleCount]);

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#1a1d19]' : 'bg-[#FEFCF7]'}`}>
            {/* Header */}
            <m.header
                className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-300 ${isDark ? 'bg-[#1a1d19]/95 border-[#C4B590]/15' : 'bg-white/80 border-[#505A4A]/10'}`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16 sm:h-20">
                        <m.div
                            className="flex items-center gap-3"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shadow-sm ring-1 ring-[#505A4A]/15">
                                <Image
                                    src="/images/sophia_logo_nuevo.jpeg"
                                    alt="Sophia Cosmética Botánica"
                                    fill
                                    sizes="56px"
                                    className="object-cover"
                                    priority
                                />
                            </div>
                            <span className={`text-base sm:text-lg font-semibold tracking-tight leading-tight ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}>Sophia</span>
                        </m.div>

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

                            <m.a
                                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola! Me gustaría hacer un pedido`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hidden sm:flex items-center gap-2 bg-[#505A4A] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#414A3C] transition-colors shadow-sm"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <MessageCircle className="w-4 h-4" />
                                Pedir por WhatsApp
                            </m.a>
                        </div>
                    </div>
                </div>
            </m.header>

            {/* Hero Section */}
            <section className="relative h-[55vh] sm:h-[50vh] md:h-[60vh] lg:h-[65vh] max-h-[550px] md:max-h-[600px] min-h-[280px] overflow-hidden mt-3 sm:mt-4 mx-3 sm:mx-4 md:mx-6 rounded-2xl">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover object-[center_25%]"
                >
                    <source src={HERO_VIDEO} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                <div className="absolute inset-0 flex items-end justify-center px-4 pb-10 sm:pb-14 md:pb-16">
                    <m.div
                        className="text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <m.div
                            className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full mb-3"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <m.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Leaf className="w-3.5 h-3.5 text-white" />
                            </m.div>
                            <span className="text-xs sm:text-sm text-white font-medium">Cosmética Botánica</span>
                        </m.div>

                        <m.p
                            className="text-white/90 max-w-xl mx-auto text-sm sm:text-base"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            Productos naturales elaborados con ingredientes orgánicos de la más alta calidad.
                        </m.p>
                    </m.div>
                </div>
            </section>

            {/* Sellos de Calidad */}
            <section className={`border-b transition-colors duration-300 ${isDark ? 'bg-[#22261f] border-[#C4B590]/10' : 'bg-white border-[#505A4A]/10'}`}>
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-center gap-4 sm:gap-10">
                        {[
                            { icon: Rabbit, label: "Cruelty Free" },
                            { icon: Droplets, label: "100% Orgánico" },
                            { icon: ShieldCheck, label: "Sin Parabenos" },
                            { icon: Hand, label: "Hecho a Mano" },
                        ].map((badge, i) => (
                            <m.div
                                key={badge.label}
                                className="flex flex-col items-center gap-1.5 min-w-0 flex-1 cursor-default"
                                initial={{ opacity: 0, y: 15, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: 0.3 + i * 0.15, type: "spring", stiffness: 150 }}
                                whileHover={{ scale: 1.1, y: -3 }}
                            >
                                <m.div
                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-[#C4B590]/10' : 'bg-[#505A4A]/8'}`}
                                    animate={{ y: [0, -3, 0] }}
                                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
                                >
                                    <badge.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`} />
                                </m.div>
                                <span className={`text-[10px] sm:text-xs font-medium text-center leading-tight ${isDark ? 'text-[#b8b0a2]' : 'text-[#505A4A]'}`}>{badge.label}</span>
                            </m.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Filtros y Búsqueda */}
            <section className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
                <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center justify-between">
                    {/* Búsqueda + Toggle de vista */}
                    <div className="flex items-center gap-2 w-full md:w-96">
                        <div className="relative flex-1">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-gray-400' : 'text-[#505A4A]'}`} />
                            <input
                                type="text"
                                placeholder="Buscar productos..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(5); }}
                                aria-label="Buscar productos"
                                className={`w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#505A4A]/50 transition-all ${isDark ? 'border-[#C4B590]/15 bg-[#22261f] text-[#e8e4dc] placeholder-[#7a7568]' : 'border-[#505A4A]/20 bg-white text-gray-900'}`}
                            />
                        </div>
                    </div>

                    {/* Categorías + Toggle */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap flex-1">
                            <button
                                onClick={() => { setSelectedCategory("all"); setVisibleCount(5); }}
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all ${selectedCategory === "all"
                                    ? "bg-[#505A4A] text-white shadow-md"
                                    : isDark ? "bg-[#22261f] text-[#b8b0a2] hover:bg-[#2a2e26] border border-[#C4B590]/15" : "bg-white text-gray-600 hover:bg-[#F5F1E8] border border-[#505A4A]/20"
                                    }`}
                            >
                                Todos ({initialProducts.length})
                            </button>
                            {initialCategories.map(cat => {
                                const count = initialProducts.filter(p => p.category_id === cat.id).length;
                                if (count === 0) return null;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => { setSelectedCategory(cat.id); setVisibleCount(5); }}
                                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all ${selectedCategory === cat.id
                                            ? "bg-[#505A4A] text-white shadow-md"
                                            : isDark ? "bg-[#22261f] text-[#b8b0a2] hover:bg-[#2a2e26] border border-[#C4B590]/15" : "bg-white text-gray-600 hover:bg-[#F5F1E8] border border-[#505A4A]/20"
                                            }`}
                                    >
                                        <span className="sm:hidden">{cat.name.split(' ')[0]}</span>
                                        <span className="hidden sm:inline">{cat.name}</span>
                                        <span className="ml-1 opacity-70">({count})</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Productos */}
            <section className="max-w-7xl mx-auto px-4 pb-12">
                <AnimatePresence mode="wait">
                    {filteredProducts.length === 0 ? (
                        <m.div
                            key="empty"
                            className="text-center py-16"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-[#C4B590]/15' : 'bg-gray-200'}`}>
                                <Search className={`w-8 h-8 ${isDark ? 'text-[#7a7568]' : 'text-gray-400'}`} />
                            </div>
                            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-[#e8e4dc]' : 'text-gray-900'}`}>No se encontraron productos</h3>
                            <p className={isDark ? 'text-[#8a8278]' : 'text-gray-600'}>Prueba con otros filtros o términos de búsqueda</p>
                        </m.div>
                    ) : (
                        <m.div
                            key="products"
                            className="flex flex-col gap-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {filteredProducts.slice(0, visibleCount).map((product, index) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    categoryName={getCategoryName(product.category_id)}
                                    viewMode={viewMode}
                                    index={index}
                                />
                            ))}
                        </m.div>
                    )}
                </AnimatePresence>

                {/* Sentinel para infinite scroll */}
                {hasMore && <div ref={sentinelRef} className="h-4" />}
            </section>

            {/* Footer */}
            <footer className={`py-10 sm:py-12 px-4 pb-24 sm:pb-12 transition-colors duration-300 ${isDark ? 'bg-[#141613]' : 'bg-[#414A3C]'}`}>
                <div className="max-w-lg mx-auto text-center">
                    {/* Logo + Marca */}
                    <div className="flex items-center justify-center gap-2.5 mb-5">
                        <div className="relative w-9 h-9 rounded-lg overflow-hidden ring-1 ring-white/15">
                            <Image
                                src="/images/sophia_logo_nuevo.jpeg"
                                alt="Sophia"
                                fill
                                sizes="36px"
                                className="object-cover"
                            />
                        </div>
                        <div className="text-left">
                            <p className="text-white text-sm font-semibold leading-tight">Sophia</p>
                            <p className="text-white/50 text-[10px] leading-tight">Cosmética Botánica</p>
                        </div>
                    </div>

                    <p className="text-white/60 text-xs leading-relaxed mb-6 max-w-xs mx-auto">
                        Productos naturales elaborados con ingredientes orgánicos de la más alta calidad.
                    </p>

                    {/* Contacto */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-6">
                        <a
                            href="tel:+34642633982"
                            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-xs"
                        >
                            <Phone className="w-3.5 h-3.5" />
                            <span>+34 642 63 39 82</span>
                        </a>
                        <span className="hidden sm:inline text-white/20">|</span>
                        <a
                            href="mailto:chavesophia1994@gmail.com"
                            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-xs"
                        >
                            <Mail className="w-3.5 h-3.5" />
                            <span>chavesophia1994@gmail.com</span>
                        </a>
                        <span className="hidden sm:inline text-white/20">|</span>
                        <a
                            href="https://www.instagram.com/sophia.products_/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-xs"
                        >
                            <Instagram className="w-3.5 h-3.5" />
                            <span>@sophia.products_</span>
                        </a>
                    </div>

                    {/* Separador + Copyright */}
                    <div className="border-t border-white/10 pt-5">
                        <p className="text-white/40 text-[11px]">
                            © 2022 – {new Date().getFullYear()} Sophia Cosmética Botánica
                        </p>
                    </div>
                </div>
            </footer>

            {/* Floating WhatsApp button - mobile only */}
            <div className="sm:hidden fixed bottom-6 right-4 z-50">
                <m.a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola! Me gustaría hacer un pedido`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#505A4A] text-white px-4 py-3 rounded-full shadow-lg shadow-[#505A4A]/30"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-semibold">Pedir</span>
                </m.a>
            </div>
        </div>
    );
}

// Product Card component
function ProductCard({
    product,
    categoryName,
    viewMode,
    index
}: {
    product: Product;
    categoryName: string;
    viewMode: "grid" | "list";
    index: number;
}) {
    const [isHovered, setIsHovered] = useState(false);
    const { isDark } = useTheme();

    const formatPrice = (price: number) => {
        return `$${price.toFixed(2)}`;
    };

    const handleWhatsAppOrder = () => {
        const message = encodeURIComponent(
            `Hola! Me interesa el producto:\n\n` +
            `📦 *${product.name}*\n` +
            `💰 Precio: ${formatPrice(product.price)}\n\n` +
            `¿Podrían darme más información?`
        );
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    };

    if (viewMode === "list") {
        return (
            <m.div
                className={`rounded-2xl overflow-hidden shadow-sm flex ${isDark ? 'bg-[#22261f]' : 'bg-white'}`}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                whileHover={{ scale: 1.02, boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
            >
                <Link href={`/catalogo/${product.id}`} className="relative w-32 sm:w-40 h-32 sm:h-40 flex-shrink-0 overflow-hidden">
                    <ProductImage
                        src={product.image}
                        alt={product.name}
                        className={`object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
                    />
                    {product.featured && (
                        <div className="absolute top-1.5 left-1.5 bg-[#C4B590] text-white p-1 rounded-full">
                            <Star className="w-3 h-3 fill-current" />
                        </div>
                    )}
                </Link>
                <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                    <Link href={`/catalogo/${product.id}`}>
                        <span className={`text-[10px] sm:text-xs font-medium ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}>{categoryName}</span>
                        <h3 className={`font-semibold mt-1 ${isDark ? 'text-[#e8e4dc]' : 'text-gray-900'}`}>{product.name}</h3>
                        <p className={`text-sm mt-1 line-clamp-2 ${isDark ? 'text-[#8a8278]' : 'text-gray-600'}`}>{product.description}</p>
                    </Link>
                    <div className="flex items-center justify-between mt-3">
                        <span className={`text-xl font-bold ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}>{formatPrice(product.price)}</span>
                        <button
                            onClick={handleWhatsAppOrder}
                            className="bg-[#505A4A] text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1 hover:bg-[#414A3C] transition-colors"
                        >
                            <MessageCircle className="w-4 h-4" />
                            Pedir
                        </button>
                    </div>
                </div>
            </m.div>
        );
    }

    return null;
}
