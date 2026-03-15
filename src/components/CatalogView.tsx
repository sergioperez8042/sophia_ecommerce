"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Star, Search, Leaf, Phone, Mail, Instagram, MessageCircle, Rabbit, Droplets, ShieldCheck, Hand, Sun, Moon, LayoutGrid, List, ArrowLeft, ShoppingBag, Plus, Heart, LogOut, User, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ProductImage from "@/components/ui/product-image";
import { m, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/store/ThemeContext';
import { useCart } from '@/store/CartContext';
import { CartProduct } from '@/store/CartContext';
import { useWishlist } from '@/store/WishlistContext';
import BrandLogo from '@/components/BrandLogo';
import NewsletterPopup from '@/components/NewsletterPopup';
import NewsletterFooter from '@/components/NewsletterFooter';
import LocationPopup from '@/components/LocationPopup';
import CatalogHeader from '@/components/CatalogHeader';

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
    out_of_stock?: boolean;
}

interface Category {
    id: string;
    name: string;
    icon: string;
    image: string;
}

interface CatalogViewProps {
    initialProducts: Product[];
    initialCategories: Category[];
    groupByCategory?: boolean;
}

export default function CatalogView({ initialProducts, initialCategories, groupByCategory = false }: CatalogViewProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [visibleCount, setVisibleCount] = useState(5);
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const { isDark } = useTheme();

    // When groupByCategory is active, track if user drilled into a category
    const [browsingCategory, setBrowsingCategory] = useState<string | null>(null);
    const showCategoryMosaic = groupByCategory && viewMode === "grid" && selectedCategory === "all" && !browsingCategory && !searchTerm;

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
        return initialCategories.find(c => c.id === categoryId)?.name || "Sin categoria";
    };

    // Grouped products for list view with groupByCategory
    const groupedProducts = useMemo(() => {
        if (!groupByCategory || viewMode !== "list" || selectedCategory !== "all" || searchTerm) return null;

        const groups: { category: Category; products: Product[] }[] = [];
        const productsByCategory = new Map<string, Product[]>();
        filteredProducts.forEach(p => {
            const list = productsByCategory.get(p.category_id) || [];
            list.push(p);
            productsByCategory.set(p.category_id, list);
        });
        initialCategories.forEach(cat => {
            const products = productsByCategory.get(cat.id);
            if (products && products.length > 0) {
                groups.push({ category: cat, products });
            }
        });
        return groups;
    }, [groupByCategory, viewMode, selectedCategory, searchTerm, filteredProducts, initialCategories]);

    // Categories that have products (for mosaic view)
    const categoriesWithProducts = useMemo(() => {
        if (!groupByCategory) return [];
        const productCountMap = new Map<string, number>();
        initialProducts.forEach(p => {
            productCountMap.set(p.category_id, (productCountMap.get(p.category_id) || 0) + 1);
        });
        return initialCategories.filter(cat => (productCountMap.get(cat.id) || 0) > 0).map(cat => ({
            ...cat,
            productCount: productCountMap.get(cat.id) || 0,
        }));
    }, [groupByCategory, initialProducts, initialCategories]);

    // Products for the currently browsed category
    const browsingProducts = useMemo(() => {
        if (!browsingCategory) return [];
        return initialProducts.filter(p => p.category_id === browsingCategory);
    }, [browsingCategory, initialProducts]);

    const browsingCategoryData = browsingCategory ? initialCategories.find(c => c.id === browsingCategory) : null;

    // Infinite scroll: cargar 5 mas al llegar al sentinel
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
            <CatalogHeader />

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
                            <span className="text-xs sm:text-sm text-white font-medium">Cosmetica Botanica</span>
                        </m.div>

                        <m.p
                            className="text-white/90 max-w-xl mx-auto text-sm sm:text-base"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            Productos naturales elaborados con ingredientes organicos de la mas alta calidad.
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
                            { icon: Droplets, label: "100% Organico" },
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

            {/* Filtros y Busqueda - Minimal */}
            <section className="max-w-7xl mx-auto px-4 pt-5 pb-2">
                {/* Search row */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="relative flex-1">
                        <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-[#7a7568]' : 'text-[#999]'}`} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(5); setBrowsingCategory(null); }}
                            aria-label="Buscar productos"
                            className={`w-full pl-10 pr-4 py-2 rounded-full text-sm focus:outline-none transition-all ${
                                isDark
                                    ? 'bg-[#22261f] text-[#e8e4dc] placeholder-[#7a7568] focus:ring-1 focus:ring-[#C4B590]/30'
                                    : 'bg-[#f5f3ef] text-gray-900 placeholder-[#999] focus:ring-1 focus:ring-[#505A4A]/20'
                            }`}
                        />
                    </div>
                    <div className="flex items-center gap-0.5">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-lg transition-colors ${
                                viewMode === "grid"
                                    ? (isDark ? 'text-[#C4B590]' : 'text-[#505A4A]')
                                    : (isDark ? 'text-[#7a7568] hover:text-[#C4B590]' : 'text-[#ccc] hover:text-[#505A4A]')
                            }`}
                            aria-label="Vista mosaico"
                        >
                            <LayoutGrid className="w-[18px] h-[18px]" />
                        </button>
                        <button
                            onClick={() => { setViewMode("list"); setBrowsingCategory(null); }}
                            className={`p-2 rounded-lg transition-colors ${
                                viewMode === "list"
                                    ? (isDark ? 'text-[#C4B590]' : 'text-[#505A4A]')
                                    : (isDark ? 'text-[#7a7568] hover:text-[#C4B590]' : 'text-[#ccc] hover:text-[#505A4A]')
                            }`}
                            aria-label="Vista lista"
                        >
                            <List className="w-[18px] h-[18px]" />
                        </button>
                    </div>
                </div>

                {/* Category tabs - horizontal scroll, underline style */}
                <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                    <div className={`flex items-center gap-1 border-b ${isDark ? 'border-[#C4B590]/10' : 'border-[#e8e4dd]'}`}>
                        <button
                            onClick={() => { setSelectedCategory("all"); setVisibleCount(5); setBrowsingCategory(null); }}
                            className={`relative px-4 py-2.5 text-[13px] whitespace-nowrap transition-colors ${
                                selectedCategory === "all"
                                    ? (isDark ? 'text-[#C4B590] font-medium' : 'text-[#505A4A] font-medium')
                                    : (isDark ? 'text-[#7a7568] hover:text-[#b8b0a2]' : 'text-[#999] hover:text-[#666]')
                            }`}
                        >
                            Todos
                            {selectedCategory === "all" && (
                                <m.div
                                    layoutId="categoryUnderline"
                                    className={`absolute bottom-0 left-0 right-0 h-[2px] ${isDark ? 'bg-[#C4B590]' : 'bg-[#505A4A]'}`}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </button>
                        {initialCategories.map(cat => {
                            const count = initialProducts.filter(p => p.category_id === cat.id).length;
                            if (count === 0) return null;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => { setSelectedCategory(cat.id); setVisibleCount(5); setBrowsingCategory(null); }}
                                    className={`relative px-4 py-2.5 text-[13px] whitespace-nowrap transition-colors ${
                                        selectedCategory === cat.id
                                            ? (isDark ? 'text-[#C4B590] font-medium' : 'text-[#505A4A] font-medium')
                                            : (isDark ? 'text-[#7a7568] hover:text-[#b8b0a2]' : 'text-[#999] hover:text-[#666]')
                                    }`}
                                >
                                    {cat.name}
                                    {selectedCategory === cat.id && (
                                        <m.div
                                            layoutId="categoryUnderline"
                                            className={`absolute bottom-0 left-0 right-0 h-[2px] ${isDark ? 'bg-[#C4B590]' : 'bg-[#505A4A]'}`}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Productos */}
            <section className="max-w-7xl mx-auto px-4 pb-12">
                <AnimatePresence mode="wait">
                    {/* Category Mosaic View */}
                    {showCategoryMosaic ? (
                        <m.div
                            key="category-mosaic"
                            className="grid grid-cols-2 gap-3 sm:gap-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {categoriesWithProducts.map((cat, i) => (
                                <m.button
                                    key={cat.id}
                                    onClick={() => setBrowsingCategory(cat.id)}
                                    className={`relative aspect-[4/3] rounded-2xl overflow-hidden group ${isDark ? 'ring-1 ring-[#C4B590]/10' : 'ring-1 ring-[#505A4A]/10'}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    {cat.image ? (
                                        <ProductImage
                                            src={cat.image}
                                            alt={cat.name}
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className={`w-full h-full ${isDark ? 'bg-[#22261f]' : 'bg-[#F0EDE6]'}`} />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                                        <h3 className="text-white font-semibold text-sm sm:text-base leading-tight">{cat.name}</h3>
                                        <span className="text-white/70 text-xs mt-0.5">{cat.productCount} {cat.productCount === 1 ? 'producto' : 'productos'}</span>
                                    </div>
                                </m.button>
                            ))}
                        </m.div>
                    ) : browsingCategory && browsingCategoryData ? (
                        /* Products within a browsed category */
                        <m.div
                            key={`browse-${browsingCategory}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <button
                                onClick={() => setBrowsingCategory(null)}
                                className={`flex items-center gap-2 text-sm font-medium mb-4 transition-colors ${isDark ? 'text-[#C4B590] hover:text-[#e8e4dc]' : 'text-[#505A4A] hover:text-gray-900'}`}
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Volver a categorias
                            </button>
                            <h2 className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}>
                                {browsingCategoryData.name}
                            </h2>
                            <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3 sm:gap-4" : "flex flex-col gap-4"}>
                                {browsingProducts.map((product, index) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        categoryName=""
                                        viewMode={viewMode}
                                        index={index}
                                    />
                                ))}
                            </div>
                        </m.div>
                    ) : groupedProducts ? (
                        /* Grouped list view */
                        <m.div
                            key="grouped-list"
                            className="flex flex-col gap-8"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {groupedProducts.map((group) => (
                                <div key={group.category.id}>
                                    <h2 className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}>
                                        {group.category.name}
                                    </h2>
                                    <div className="flex flex-col gap-4">
                                        {group.products.map((product, index) => (
                                            <ProductCard
                                                key={product.id}
                                                product={product}
                                                categoryName=""
                                                viewMode="list"
                                                index={index}
                                                    />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </m.div>
                    ) : filteredProducts.length === 0 ? (
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
                            <p className={isDark ? 'text-[#8a8278]' : 'text-gray-600'}>Prueba con otros filtros o terminos de busqueda</p>
                        </m.div>
                    ) : (
                        <m.div
                            key="products"
                            className={viewMode === "grid" ? "grid grid-cols-2 gap-3 sm:gap-4" : "flex flex-col gap-4"}
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
                {!showCategoryMosaic && !browsingCategory && !groupedProducts && hasMore && <div ref={sentinelRef} className="h-4" />}
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
                            <p className="text-white/50 text-[10px] leading-tight">Cosmetica Botanica</p>
                        </div>
                    </div>

                    <p className="text-white/60 text-xs leading-relaxed mb-6 max-w-xs mx-auto">
                        Productos naturales elaborados con ingredientes organicos de la mas alta calidad.
                    </p>

                    {/* Contacto */}
                    <div className="inline-flex flex-col gap-2.5 mb-6">
                        <a
                            href="tel:+34642633982"
                            className="flex items-center gap-2.5 text-white/70 hover:text-white transition-colors text-xs"
                        >
                            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>+34 642 63 39 82</span>
                        </a>
                        <a
                            href="mailto:chavesophia1994@gmail.com"
                            className="flex items-center gap-2.5 text-white/70 hover:text-white transition-colors text-xs"
                        >
                            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>chavesophia1994@gmail.com</span>
                        </a>
                        <a
                            href="https://www.instagram.com/sophia.products_/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 text-white/70 hover:text-white transition-colors text-xs"
                        >
                            <Instagram className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>@sophia.products_</span>
                        </a>
                    </div>

                    {/* Newsletter */}
                    <div className="border-t border-white/10 pt-4 mb-4">
                        <NewsletterFooter />
                    </div>

                    {/* Copyright */}
                    <div className="border-t border-white/10 pt-5">
                        <p className="text-white/40 text-[11px]">
                            2022 - {new Date().getFullYear()} Sophia Cosmetica Botanica
                        </p>
                    </div>
                </div>
            </footer>

            {/* Location Popup - appears first (immediate) */}
            <LocationPopup />

            {/* Newsletter Popup - appears after (8s + 40% scroll) */}
            <NewsletterPopup />

            {/* Floating WhatsApp button for doubts - visible on all screen sizes */}
            <div className="fixed bottom-6 right-4 z-40">
                <m.a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola! Tengo una consulta sobre sus productos`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg shadow-[#25D366]/30 hover:bg-[#1fb855] transition-colors"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1, type: "spring", stiffness: 200 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="WhatsApp - Dudas"
                >
                    <MessageCircle className="w-6 h-6" />
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
    index,
}: {
    product: Product;
    categoryName: string;
    viewMode: "grid" | "list";
    index: number;
}) {
    const [isHovered, setIsHovered] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);
    const { isDark } = useTheme();
    const { addItem } = useCart();
    const { toggleItem, isInWishlist } = useWishlist();
    const isFavorite = isInWishlist(product.id);

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleItem(product.id);
    };

    const formatPrice = (price: number) => {
        return `$${price.toFixed(2)}`;
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const cartProduct: CartProduct = {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
        };
        addItem(cartProduct);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 1500);
    };

    if (viewMode === "grid") {
        return (
            <m.div
                className={`rounded-2xl overflow-hidden shadow-sm ${isDark ? 'bg-[#22261f]' : 'bg-white'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                whileHover={{ scale: 1.03 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
            >
                <div className="relative aspect-square overflow-hidden">
                    <Link href={`/catalog/${product.id}`} className="block w-full h-full">
                        <ProductImage
                            src={product.image}
                            alt={product.name}
                            className={`object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'} ${product.out_of_stock ? 'opacity-60 grayscale-[30%]' : ''}`}
                        />
                    </Link>
                    {product.featured && !product.out_of_stock && (
                        <div className="absolute top-1.5 left-1.5 bg-[#C4B590] text-white p-1 rounded-full">
                            <Star className="w-3 h-3 fill-current" />
                        </div>
                    )}
                    {product.out_of_stock && (
                        <div className="absolute top-1.5 left-1.5 bg-red-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            Agotado
                        </div>
                    )}
                    <button
                        onClick={handleToggleFavorite}
                        className={`absolute top-1.5 right-1.5 p-1.5 rounded-full transition-all ${
                            isFavorite
                                ? 'bg-white/90 text-red-500'
                                : 'bg-black/20 text-white hover:bg-black/40'
                        }`}
                    >
                        <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                </div>
                <div className="p-2.5 sm:p-3">
                    {categoryName && <span className={`text-[10px] font-medium ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}>{categoryName}</span>}
                    <Link href={`/catalog/${product.id}`}>
                        <h3 className={`font-semibold text-sm mt-0.5 line-clamp-1 ${isDark ? 'text-[#e8e4dc]' : 'text-gray-900'}`}>{product.name}</h3>
                    </Link>
                    {product.rating > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={`card-${product.id}-${i}`}
                                        className={`h-2.5 w-2.5 ${
                                            i < Math.round(product.rating)
                                                ? 'text-[#C9A96E] fill-[#C9A96E]'
                                                : isDark ? 'text-gray-700 fill-gray-700' : 'text-gray-200 fill-gray-200'
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className={`text-[10px] ${isDark ? 'text-[#8a8273]' : 'text-[#999]'}`}>({product.reviews_count})</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                        <span className={`text-base font-bold ${product.out_of_stock ? (isDark ? 'text-[#7a7568]' : 'text-gray-400') : isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}>{formatPrice(product.price)}</span>
                        {product.out_of_stock ? (
                            <span className="bg-gray-300 text-gray-500 px-2 py-1 rounded-full text-[10px] cursor-not-allowed">
                                Agotado
                            </span>
                        ) : (
                            <button
                                onClick={handleAddToCart}
                                className={`p-1.5 rounded-full transition-all ${
                                    addedToCart
                                        ? 'bg-[#C4B590] text-[#1a1d19] scale-110'
                                        : 'bg-[#505A4A] text-white hover:bg-[#414A3C]'
                                }`}
                            >
                                {addedToCart ? (
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <Plus className="w-3.5 h-3.5" />
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </m.div>
        );
    }

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
            <div className="relative w-32 sm:w-40 h-32 sm:h-40 flex-shrink-0 overflow-hidden">
                <Link href={`/catalog/${product.id}`} className="block w-full h-full">
                    <ProductImage
                        src={product.image}
                        alt={product.name}
                        className={`object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'} ${product.out_of_stock ? 'opacity-60 grayscale-[30%]' : ''}`}
                    />
                </Link>
                {product.featured && !product.out_of_stock && (
                    <div className="absolute top-1.5 left-1.5 bg-[#C4B590] text-white p-1 rounded-full">
                        <Star className="w-3 h-3 fill-current" />
                    </div>
                )}
                {product.out_of_stock && (
                    <div className="absolute top-1.5 left-1.5 bg-red-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        Agotado
                    </div>
                )}
                <button
                    onClick={handleToggleFavorite}
                    className={`absolute top-1.5 right-1.5 p-1.5 rounded-full transition-all ${
                        isFavorite
                            ? 'bg-white/90 text-red-500'
                            : 'bg-black/20 text-white hover:bg-black/40'
                    }`}
                >
                    <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
            </div>
            <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                <Link href={`/catalog/${product.id}`}>
                    {categoryName && <span className={`text-[10px] sm:text-xs font-medium ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}>{categoryName}</span>}
                    <h3 className={`font-semibold mt-1 ${isDark ? 'text-[#e8e4dc]' : 'text-gray-900'}`}>{product.name}</h3>
                    {product.rating > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={`list-${product.id}-${i}`}
                                        className={`h-3 w-3 ${
                                            i < Math.round(product.rating)
                                                ? 'text-[#C9A96E] fill-[#C9A96E]'
                                                : isDark ? 'text-gray-700 fill-gray-700' : 'text-gray-200 fill-gray-200'
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className={`text-[10px] ${isDark ? 'text-[#8a8273]' : 'text-[#999]'}`}>({product.reviews_count})</span>
                        </div>
                    )}
                    <p className={`text-sm mt-1 line-clamp-2 ${isDark ? 'text-[#8a8278]' : 'text-gray-600'}`}>{product.description}</p>
                </Link>
                <div className="flex items-center justify-between mt-3">
                    <span className={`text-xl font-bold ${product.out_of_stock ? (isDark ? 'text-[#7a7568]' : 'text-gray-400') : isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}>{formatPrice(product.price)}</span>
                    {product.out_of_stock ? (
                        <span className="bg-gray-300 text-gray-500 px-3 py-1.5 rounded-full text-sm cursor-not-allowed">
                            Agotado
                        </span>
                    ) : (
                        <button
                            onClick={handleAddToCart}
                            className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 transition-all ${
                                addedToCart
                                    ? 'bg-[#C4B590] text-[#1a1d19]'
                                    : 'bg-[#505A4A] text-white hover:bg-[#414A3C]'
                            }`}
                        >
                            {addedToCart ? (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Agregado
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    Agregar
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </m.div>
    );
}
