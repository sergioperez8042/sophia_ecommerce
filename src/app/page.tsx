"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Star, Search, Grid3X3, List, Leaf, Phone, Mail, MessageCircle, Rabbit, Droplets, ShieldCheck, Hand, Sun, Moon } from "lucide-react";
import Image from "next/image";
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/store/ThemeContext';

// Número de WhatsApp para pedidos
const WHATSAPP_NUMBER = "34642633982";
const HERO_VIDEOS = ["/videos/sophia_video.mp4", "/videos/sophia_video2.mp4"];

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

export default function HomePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [activeVideo, setActiveVideo] = useState(0);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

    const nextVideo = useCallback(() => {
        setActiveVideo(prev => (prev + 1) % HERO_VIDEOS.length);
    }, []);

    useEffect(() => {
        videoRefs.current.forEach((video, i) => {
            if (!video) return;
            if (i === activeVideo) {
                video.currentTime = 0;
                const tryPlay = () => video.play().catch(() => {});
                if (video.readyState >= 3) {
                    tryPlay();
                } else {
                    video.addEventListener('canplay', tryPlay, { once: true });
                }
            } else {
                video.pause();
            }
        });
    }, [activeVideo]);

    useEffect(() => {
        const fetchData = async () => {
            if (!db) {
                console.error('Firebase not initialized');
                setLoading(false);
                return;
            }

            try {
                const categoriesSnapshot = await getDocs(collection(db, 'categories'));
                const categoriesData = categoriesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Category[];
                setCategories(categoriesData);

                const productsQuery = query(
                    collection(db, 'products'),
                    where('active', '==', true)
                );
                const productsSnapshot = await getDocs(productsQuery);
                const productsData = productsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Product[];
                setProducts(productsData);
            } catch (error) {
                console.error('Error loading catalog:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredProducts = useMemo(() => {
        let filtered = [...products];

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
    }, [products, selectedCategory, searchTerm]);

    const getCategoryName = (categoryId: string) => {
        return categories.find(c => c.id === categoryId)?.name || "Sin categoría";
    };

    const { isDark, toggleTheme } = useTheme();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--cream-white)]">
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        className="w-28 h-28 rounded-2xl bg-[#505A4A] flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden"
                        animate={{
                            scale: [1, 1.08, 1],
                            boxShadow: [
                                "0 4px 15px rgba(80, 90, 74, 0.3)",
                                "0 8px 30px rgba(80, 90, 74, 0.5)",
                                "0 4px 15px rgba(80, 90, 74, 0.3)"
                            ]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <img
                            src="/images/sophia_logo_nuevo.jpeg"
                            alt="Sophia"
                            className="w-full h-full object-cover"
                        />
                    </motion.div>
                    <motion.p
                        className="text-[#505A4A] font-medium"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        Cargando catálogo...
                    </motion.p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#1a1d19]' : 'bg-[#FEFCF7]'}`}>
            {/* Header */}
            <motion.header
                className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-300 ${isDark ? 'bg-[#1a1d19]/95 border-[#C4B590]/15' : 'bg-white/80 border-[#505A4A]/10'}`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
            >

                {/* Main header */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16 sm:h-20">
                        {/* Logo */}
                        <motion.div
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
                        </motion.div>

                        <div className="flex items-center gap-2">
                        {/* Dark mode toggle */}
                        <motion.button
                            onClick={toggleTheme}
                            className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-[#C4B590]/15 text-[#C4B590] hover:bg-[#C4B590]/25' : 'bg-[#505A4A]/10 text-[#505A4A] hover:bg-[#505A4A]/20'}`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
                        >
                            <AnimatePresence mode="wait">
                                {isDark ? (
                                    <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                                        <Sun className="w-4 h-4" />
                                    </motion.div>
                                ) : (
                                    <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                                        <Moon className="w-4 h-4" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>

                        {/* CTA - hidden on mobile, shown in header on desktop */}
                        <motion.a
                            href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola! Me gustaría hacer un pedido`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden sm:flex items-center gap-2 bg-[#505A4A] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#414A3C] transition-colors shadow-sm"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <MessageCircle className="w-4 h-4" />
                            Pedir por WhatsApp
                        </motion.a>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Hero Section - Video Carousel */}
            <section className="relative h-64 sm:h-72 md:h-80 overflow-hidden">
                {/* Video carousel */}
                {HERO_VIDEOS.map((src, i) => (
                    <video
                        key={src}
                        ref={el => { videoRefs.current[i] = el; }}
                        autoPlay={i === 0}
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                        style={{ opacity: activeVideo === i ? 1 : 0 }}
                        onEnded={nextVideo}
                    >
                        <source src={src} type="video/mp4" />
                    </video>
                ))}
                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#414A3C]/70 via-[#505A4A]/30 to-[#505A4A]/20" />

                {/* Carousel indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {HERO_VIDEOS.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveVideo(i)}
                            className={`h-1.5 rounded-full transition-all duration-500 ${activeVideo === i ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
                        />
                    ))}
                </div>

                {/* Content overlay */}
                <div className="absolute inset-0 flex items-center justify-center px-4">
                    <motion.div
                        className="text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <motion.div
                            className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full mb-3"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Leaf className="w-3.5 h-3.5 text-white" />
                            </motion.div>
                            <span className="text-xs sm:text-sm text-white font-medium">Cosmética Botánica</span>
                        </motion.div>

                        <motion.p
                            className="text-white/90 max-w-xl mx-auto text-sm sm:text-base"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            Productos naturales elaborados con ingredientes orgánicos de la más alta calidad.
                        </motion.p>
                    </motion.div>
                </div>
            </section>

            {/* Sellos de Calidad */}
            <section className={`border-b transition-colors duration-300 ${isDark ? 'bg-[#22261f] border-[#C4B590]/10' : 'bg-white border-[#505A4A]/10'}`}>
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-center gap-6 sm:gap-10 overflow-x-auto">
                        {[
                            { icon: Rabbit, label: "Cruelty Free" },
                            { icon: Droplets, label: "100% Orgánico" },
                            { icon: ShieldCheck, label: "Sin Parabenos" },
                            { icon: Hand, label: "Hecho a Mano" },
                        ].map((badge, i) => (
                            <motion.div
                                key={badge.label}
                                className="flex flex-col items-center gap-1.5 min-w-[70px] cursor-default"
                                initial={{ opacity: 0, y: 15, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: 0.3 + i * 0.15, type: "spring", stiffness: 150 }}
                                whileHover={{ scale: 1.1, y: -3 }}
                            >
                                <motion.div
                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-[#C4B590]/10' : 'bg-[#505A4A]/8'}`}
                                    animate={{ y: [0, -3, 0] }}
                                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
                                >
                                    <badge.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`} />
                                </motion.div>
                                <span className={`text-[10px] sm:text-xs font-medium text-center leading-tight ${isDark ? 'text-[#b8b0a2]' : 'text-[#505A4A]'}`}>{badge.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Filtros y Búsqueda */}
            <motion.section
                className="max-w-7xl mx-auto px-4 py-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-[#505A4A]'}`} />
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#505A4A]/50 transition-all ${isDark ? 'border-[#C4B590]/15 bg-[#22261f] text-[#e8e4dc] placeholder-[#7a7568]' : 'border-[#505A4A]/20 bg-white text-gray-900'}`}
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto">
                        <motion.button
                            onClick={() => setSelectedCategory("all")}
                            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${selectedCategory === "all"
                                ? "bg-[#505A4A] text-white shadow-lg"
                                : isDark ? "bg-[#22261f] text-[#b8b0a2] hover:bg-[#2a2e26] border border-[#C4B590]/15" : "bg-white text-gray-600 hover:bg-[#F5F1E8] border border-[#505A4A]/20"
                                }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Todos ({products.length})
                        </motion.button>
                        {categories.map(cat => {
                            const count = products.filter(p => p.category_id === cat.id).length;
                            if (count === 0) return null;
                            return (
                                <motion.button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${selectedCategory === cat.id
                                        ? "bg-[#505A4A] text-white shadow-lg"
                                        : isDark ? "bg-[#22261f] text-[#b8b0a2] hover:bg-[#2a2e26] border border-[#C4B590]/15" : "bg-white text-gray-600 hover:bg-[#F5F1E8] border border-[#505A4A]/20"
                                        }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {cat.name} ({count})
                                </motion.button>
                            );
                        })}
                    </div>

                    <div className={`hidden md:flex items-center gap-2 rounded-lg p-1 border ${isDark ? 'bg-[#22261f] border-[#C4B590]/15' : 'bg-white border-[#505A4A]/20'}`}>
                        <motion.button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? isDark ? "bg-[#C4B590]/15 text-[#C4B590]" : "bg-[#F5F1E8] text-[#505A4A]" : isDark ? "text-[#8a8278]" : "text-gray-600"}`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Grid3X3 className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-md transition-colors ${viewMode === "list" ? isDark ? "bg-[#C4B590]/15 text-[#C4B590]" : "bg-[#F5F1E8] text-[#505A4A]" : isDark ? "text-[#8a8278]" : "text-gray-600"}`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <List className="w-5 h-5" />
                        </motion.button>
                    </div>
                </div>
            </motion.section>

            {/* Productos */}
            <section className="max-w-7xl mx-auto px-4 pb-12">
                <AnimatePresence mode="wait">
                    {filteredProducts.length === 0 ? (
                        <motion.div
                            className="text-center py-16"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <motion.div
                                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-[#C4B590]/15' : 'bg-gray-200'}`}
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Search className={`w-8 h-8 ${isDark ? 'text-[#7a7568]' : 'text-gray-400'}`} />
                            </motion.div>
                            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-[#e8e4dc]' : 'text-gray-900'}`}>No se encontraron productos</h3>
                            <p className={isDark ? 'text-[#8a8278]' : 'text-gray-600'}>Prueba con otros filtros o términos de búsqueda</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            className={
                                viewMode === "grid"
                                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                    : "flex flex-col gap-4"
                            }
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {filteredProducts.map((product, index) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    categoryName={getCategoryName(product.category_id)}
                                    viewMode={viewMode}
                                    index={index}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* Footer */}
            <motion.footer
                className="bg-[#414A3C] text-white py-8 sm:py-10 px-4 pb-24 sm:pb-10"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
            >
                <div className="max-w-7xl mx-auto">
                    {/* Contact info - stacked on mobile */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm">
                        <a 
                            href="tel:+34642633982" 
                            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full"
                        >
                            <Phone className="w-4 h-4" />
                            <span>+34 642 63 39 82</span>
                        </a>
                        <a 
                            href="mailto:chavesophia1994@gmail.com" 
                            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full"
                        >
                            <Mail className="w-4 h-4" />
                            <span className="truncate max-w-[200px] sm:max-w-none">chavesophia1994@gmail.com</span>
                        </a>
                    </div>
                    
                    {/* Copyright */}
                    <div className="mt-6 pt-4 border-t border-white/10 text-center">
                        <p className="text-white/50 text-xs">
                            © 2022 Sophia. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </motion.footer>

            {/* Floating WhatsApp button - mobile only */}
            <div className="sm:hidden fixed bottom-6 right-4 z-50">
                <motion.a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola! Me gustaría hacer un pedido`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#505A4A] text-white px-4 py-3 rounded-full shadow-lg shadow-[#505A4A]/30"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-semibold">Pedir</span>
                </motion.a>
            </div>
        </div>
    );
}

// Componente de tarjeta de producto con animaciones
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
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
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
            <motion.div
                className="product-card rounded-2xl overflow-hidden shadow-sm flex bg-white"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.02, boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
            >
                <div className="relative w-40 h-40 flex-shrink-0 overflow-hidden">
                    <Image
                        src={product.image || "/images/no-image.png"}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500"
                        style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)' }}
                    />
                    {product.featured && (
                        <motion.div
                            className="absolute top-2 left-2 bg-[#C4B590] text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: "spring" }}
                        >
                            <Star className="w-3 h-3 fill-current" />
                            Destacado
                        </motion.div>
                    )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                        <span className={`text-xs font-medium ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}>{categoryName}</span>
                        <h3 className={`font-semibold mt-1 ${isDark ? 'text-[#e8e4dc]' : 'text-gray-900'}`}>{product.name}</h3>
                        <p className={`text-sm mt-1 line-clamp-2 ${isDark ? 'text-[#8a8278]' : 'text-gray-600'}`}>{product.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                        <span className={`text-xl font-bold ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}>{formatPrice(product.price)}</span>
                        <motion.button
                            onClick={handleWhatsAppOrder}
                            className="bg-[#25D366] text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <MessageCircle className="w-4 h-4" />
                            Pedir
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="product-card rounded-2xl overflow-hidden shadow-sm group bg-white"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4, type: "spring", stiffness: 100 }}
            whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            <div className="relative aspect-square overflow-hidden">
                <Image
                    src={product.image || "/images/no-image.png"}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500"
                    style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)' }}
                />
                {product.featured && (
                    <motion.div
                        className="absolute top-3 left-3 bg-[#C4B590] text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.3, type: "spring" }}
                    >
                        <Star className="w-3 h-3 fill-current" />
                        Destacado
                    </motion.div>
                )}

                {/* Overlay con botón de WhatsApp */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.button
                        onClick={handleWhatsAppOrder}
                        className="bg-[#25D366] text-white px-4 py-2 rounded-full flex items-center gap-2 font-medium"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: isHovered ? 0 : 20, opacity: isHovered ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <MessageCircle className="w-4 h-4" />
                        Hacer Pedido
                    </motion.button>
                </motion.div>
            </div>
            <div className="p-4">
                <motion.span
                    className={`text-xs font-medium ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {categoryName}
                </motion.span>
                <h3 className={`font-semibold mt-1 line-clamp-1 ${isDark ? 'text-[#e8e4dc]' : 'text-gray-900'}`}>{product.name}</h3>
                <p className={`text-sm mt-1 line-clamp-2 ${isDark ? 'text-[#8a8278]' : 'text-gray-600'}`}>{product.description}</p>
                <div className="flex items-center justify-between mt-3">
                    <motion.span
                        className={`text-xl font-bold ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                    >
                        {formatPrice(product.price)}
                    </motion.span>
                    {product.rating > 0 && (
                        <div className={`flex items-center gap-1 text-sm ${isDark ? 'text-[#8a8278]' : 'text-gray-600'}`}>
                            <Star className="w-4 h-4 fill-[#C4B590] text-[#C4B590]" />
                            <span>{product.rating.toFixed(1)}</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
