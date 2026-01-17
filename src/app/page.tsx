"use client";

import { useState, useMemo, useEffect } from 'react';
import { Star, Search, Grid3X3, List, Sparkles, Leaf, Phone, Mail, MessageCircle, ArrowRight } from "lucide-react";
import Image from "next/image";
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

// Número de WhatsApp para pedidos
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FEFCF7]">
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        className="w-24 h-24 rounded-full bg-gradient-to-br from-[#4A6741] to-[#3F5D4C] flex items-center justify-center mx-auto mb-4 shadow-lg"
                        animate={{ 
                            scale: [1, 1.15, 1, 1.1, 1],
                            boxShadow: [
                                "0 4px 15px rgba(74, 103, 65, 0.3)",
                                "0 4px 25px rgba(74, 103, 65, 0.5)",
                                "0 4px 15px rgba(74, 103, 65, 0.3)",
                                "0 4px 20px rgba(74, 103, 65, 0.4)",
                                "0 4px 15px rgba(74, 103, 65, 0.3)"
                            ]
                        }}
                        transition={{ 
                            duration: 1.2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <img 
                            src="/images/logo_hand2.png" 
                            alt="Sophia" 
                            className="w-16 h-16 object-contain"
                        />
                    </motion.div>
                    <motion.p
                        className="text-gray-600"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        Cargando catálogo...
                    </motion.p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FEFCF7]">
            {/* Floating WhatsApp Button */}
            <motion.a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola! Me gustaría hacer un pedido`}
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:shadow-xl"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <MessageCircle className="w-6 h-6" />
            </motion.a>

            {/* Header */}
            <motion.header
                className="nav-glass sticky top-0 z-40"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
            >
                <div className="max-w-7xl mx-auto px-4 py-2">
                    <div className="flex items-center justify-between">
                        <motion.div
                            className="flex items-center gap-3"
                            whileHover={{ scale: 1.02 }}
                        >
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.3 }}
                                className="relative h-20"
                            >
                                <img
                                    src="/images/logo-sophia.png"
                                    alt="Sophia"
                                    className="h-full w-auto object-contain"
                                />
                            </motion.div>
                        </motion.div>

                        <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <motion.div
                                    animate={{ x: [0, 5, 0] }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                                    className="text-[#4A6741]"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </motion.div>
                                <motion.a
                                    href="tel:+34642633982"
                                    className="flex items-center gap-2 hover:text-[#4A6741] transition-colors font-medium"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <Phone className="w-4 h-4" />
                                    <span>+34 642 63 39 82</span>
                                </motion.a>
                            </div>
                            <motion.a
                                href="mailto:chavesophia1994@gmail.com"
                                className="flex items-center gap-2 hover:text-[#4A6741] transition-colors"
                                whileHover={{ scale: 1.05 }}
                            >
                                <Mail className="w-4 h-4" />
                                <span>chavesophia1994@gmail.com</span>
                            </motion.a>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Hero Section */}
            <section className="hero-gradient py-16 px-4 relative overflow-hidden">
                {/* Animated background elements */}
                <motion.div
                    className="absolute top-10 left-10 w-32 h-32 rounded-full bg-[#4A6741]/10 blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-[#D4AF37]/10 blur-3xl"
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                />

                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <motion.div
                        className="inline-flex items-center gap-2 bg-[#4A6741]/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        >
                            <Sparkles className="w-4 h-4 text-[#4A6741]" />
                        </motion.div>
                        <span className="text-sm text-[#4A6741] font-medium">Cosmética Natural Artesanal</span>
                    </motion.div>

                    <motion.h2
                        className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                    >
                        Nuestro Catálogo
                    </motion.h2>

                    <motion.p
                        className="text-gray-600 max-w-2xl mx-auto text-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        Descubre nuestra colección de productos naturales elaborados con ingredientes orgánicos de la más alta calidad.
                    </motion.p>
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
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4A6741]" />
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#4A6741]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 text-gray-900 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto">
                        <motion.button
                            onClick={() => setSelectedCategory("all")}
                            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${selectedCategory === "all"
                                ? "bg-[#4A6741] text-white shadow-lg"
                                : "bg-white text-gray-600 hover:bg-[#F5F1E8] border border-[#4A6741]/20"
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
                                        ? "bg-[#4A6741] text-white shadow-lg"
                                        : "bg-white text-gray-600 hover:bg-[#F5F1E8] border border-[#4A6741]/20"
                                        }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {cat.name} ({count})
                                </motion.button>
                            );
                        })}
                    </div>

                    <div className="hidden md:flex items-center gap-2 bg-white rounded-lg p-1 border border-[#4A6741]/20">
                        <motion.button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-[#F5F1E8] text-[#4A6741]" : "text-gray-600"}`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Grid3X3 className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-[#F5F1E8] text-[#4A6741]" : "text-gray-600"}`}
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
                                className="w-16 h-16 bg-[#4A6741]/10 rounded-full flex items-center justify-center mx-auto mb-4"
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Search className="w-8 h-8 text-[#4A6741]" />
                            </motion.div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
                            <p className="text-gray-600">Prueba con otros filtros o términos de búsqueda</p>
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
                className="bg-[#3F5D4C] text-white py-8 px-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
            >
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        className="flex items-center justify-center gap-3 mb-4"
                        whileHover={{ scale: 1.05 }}
                    >
                        <div className="w-10 h-10 bg-gradient-to-br from-[#4A6741] to-[#3F5D4C] rounded-full flex items-center justify-center border border-white/20 overflow-hidden">
                            <img src="/images/logo_hand2.png" alt="Sophia" className="w-8 h-8 object-contain" />
                        </div>
                        <span className="text-lg font-semibold">Sophia Cosmética Natural</span>
                    </motion.div>
                    <p className="text-white/70 text-sm mb-4">
                        Productos artesanales con ingredientes 100% naturales
                    </p>
                    <div className="flex items-center justify-center gap-6 text-sm text-white/70">
                        <a href="tel:+34642633982" className="hover:text-white transition-colors">
                            +34 642 63 39 82
                        </a>
                        <span>•</span>
                        <a href="mailto:chavesophia1994@gmail.com" className="hover:text-white transition-colors">
                            chavesophia1994@gmail.com
                        </a>
                    </div>
                </div>
            </motion.footer>
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
                            className="absolute top-2 left-2 bg-[#D4AF37] text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
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
                        <span className="text-xs text-[#4A6741] font-medium">{categoryName}</span>
                        <h3 className="font-semibold text-gray-900 mt-1">{product.name}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                        <span className="text-xl font-bold text-[#4A6741]">{formatPrice(product.price)}</span>
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
                        className="absolute top-3 left-3 bg-[#D4AF37] text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
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
                    className="text-xs text-[#4A6741] font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {categoryName}
                </motion.span>
                <h3 className="font-semibold text-gray-900 mt-1 line-clamp-1">{product.name}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between mt-3">
                    <motion.span
                        className="text-xl font-bold text-[#4A6741]"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                    >
                        {formatPrice(product.price)}
                    </motion.span>
                    {product.rating > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                            <span>{product.rating.toFixed(1)}</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
