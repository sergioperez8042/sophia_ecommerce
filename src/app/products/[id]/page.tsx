"use client";

import { useState, use } from 'react';
import { Star, Heart, ShoppingBag, Plus, Minus, Truck, Shield, RotateCcw, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import ProductImage from "@/components/ui/product-image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useCart, useWishlist, useProducts, useCategories } from "@/store";

const Breadcrumb = dynamic(() => import("@/components/ui/breadcrumb"), {
    ssr: false
});

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [activeTab, setActiveTab] = useState('description');
    const [addedToCart, setAddedToCart] = useState(false);

    const { addItem: addToCartStore } = useCart();
    const { toggleItem, isInWishlist } = useWishlist();
    const { products, isLoading } = useProducts();
    const { categories } = useCategories();

    const product = products.find(p => p.id === resolvedParams.id);
    const category = product ? categories.find(c => c.id === product.category_id) : null;

    const isWishlisted = product ? isInWishlist(product.id) : false;

    const productImages = product?.image ? [product.image] : [];
    const currentImage = productImages[selectedImage] || null;

    const discount = product?.price
        ? Math.round(((product.price * 1.2 - product.price) / (product.price * 1.2)) * 100)
        : 0;

    const handleAddToCart = () => {
        if (!product) return;
        for (let i = 0; i < quantity; i++) {
            addToCartStore({
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                originalPrice: product.price * 1.2,
                image: product.image || '',
                category: category?.name,
                inStock: product.active,
            });
        }
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const handleToggleWishlist = () => {
        if (product) toggleItem(product.id);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FEFCF7]">
                <Loader2 className="h-8 w-8 animate-spin text-[#505A4A]/40" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-[#FEFCF7]">
                <div className="max-w-xl mx-auto px-6 py-16 text-center pt-32">
                    <h1 className="text-2xl font-light text-[#333] mb-3">Producto no encontrado</h1>
                    <p className="text-[#999] mb-8">El producto que buscas no existe o fue eliminado.</p>
                    <Link
                        href="/products"
                        className="inline-block border border-[#505A4A] text-[#505A4A] px-8 py-3 text-[13px] font-medium tracking-[0.08em] uppercase hover:bg-[#505A4A] hover:text-white transition-all duration-300"
                    >
                        Ver Productos
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FEFCF7]">
            <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-8 sm:py-12">
                <Breadcrumb
                    items={[
                        { label: 'Productos', href: '/products' },
                        { label: product.name }
                    ]}
                />

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mt-8 sm:mt-12"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20">
                        {/* Galería */}
                        <div>
                            <div className="relative aspect-square overflow-hidden bg-[#F0EDE6] group">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={selectedImage}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute inset-0"
                                    >
                                        <ProductImage
                                            src={currentImage}
                                            alt={product.name}
                                            className="object-cover"
                                        />
                                    </motion.div>
                                </AnimatePresence>

                                {productImages.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setSelectedImage((prev) => (prev - 1 + productImages.length) % productImages.length)}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white text-[#333] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                                        >
                                            <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
                                        </button>
                                        <button
                                            onClick={() => setSelectedImage((prev) => (prev + 1) % productImages.length)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white text-[#333] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                                        >
                                            <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
                                        </button>
                                    </>
                                )}
                            </div>

                            {productImages.length > 1 && (
                                <div className="grid grid-cols-4 gap-2 mt-3">
                                    {productImages.map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index)}
                                            className={`relative aspect-square overflow-hidden bg-[#F0EDE6] transition-all duration-200 ${
                                                selectedImage === index
                                                    ? 'ring-2 ring-[#505A4A]'
                                                    : 'opacity-60 hover:opacity-100'
                                            }`}
                                        >
                                            <ProductImage
                                                src={image}
                                                alt={`${product.name} ${index + 1}`}
                                                className="object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Info del producto */}
                        <div className="lg:py-4">
                            {category && (
                                <span className="text-[11px] uppercase tracking-[0.15em] text-[#999] block mb-3">
                                    {category.name}
                                </span>
                            )}

                            <h1 className="text-[28px] sm:text-[34px] font-light text-[#333] tracking-[-0.02em] leading-tight mb-4">
                                {product.name}
                            </h1>

                            <p className="text-[15px] text-[#777] font-light leading-relaxed mb-6">
                                {product.description}
                            </p>

                            {/* Rating */}
                            {product.rating > 0 && (
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex items-center gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`h-4 w-4 ${
                                                    i < Math.floor(product.rating)
                                                        ? 'text-[#C9A96E] fill-[#C9A96E]'
                                                        : 'text-gray-200 fill-gray-200'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[13px] text-[#999]">
                                        {product.rating} · {product.reviews_count} reseñas
                                    </span>
                                </div>
                            )}

                            {/* Precio */}
                            <div className="flex items-baseline gap-3 mb-8 pb-8 border-b border-[#E8E4DD]">
                                <span className="text-[28px] font-light text-[#333] tracking-tight">
                                    ${product.price.toFixed(2)}
                                </span>
                                <span className="text-[16px] text-[#BBB] line-through">
                                    ${(product.price * 1.2).toFixed(2)}
                                </span>
                                <span className="text-[12px] text-[#505A4A] font-medium tracking-wide uppercase">
                                    -{discount}%
                                </span>
                            </div>

                            {/* Cantidad */}
                            <div className="mb-6">
                                <span className="text-[12px] uppercase tracking-[0.12em] text-[#999] block mb-3">
                                    Cantidad
                                </span>
                                <div className="inline-flex items-center border border-[#D5D0C8] h-[44px]">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-[44px] h-full flex items-center justify-center text-[#999] hover:text-[#333] transition-colors"
                                    >
                                        <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
                                    </button>
                                    <span className="w-[50px] text-center text-[14px] text-[#333] tabular-nums select-none border-x border-[#D5D0C8]">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-[44px] h-full flex items-center justify-center text-[#999] hover:text-[#333] transition-colors"
                                    >
                                        <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                                    </button>
                                </div>
                            </div>

                            {/* Botones */}
                            <div className="flex gap-3 mb-8">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={!product.active}
                                    className={`flex-1 h-[52px] flex items-center justify-center gap-2 text-[13px] font-medium tracking-[0.1em] uppercase transition-all duration-300 ${
                                        addedToCart
                                            ? 'bg-[#414A3C] text-white'
                                            : product.active
                                                ? 'bg-[#505A4A] text-white hover:bg-[#414A3C]'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                                    {addedToCart ? 'Agregado' : (product.active ? 'Agregar al carrito' : 'No disponible')}
                                </button>
                                <button
                                    onClick={handleToggleWishlist}
                                    className={`w-[52px] h-[52px] flex items-center justify-center border transition-all duration-300 ${
                                        isWishlisted
                                            ? 'border-[#505A4A] bg-[#505A4A]/5 text-[#505A4A]'
                                            : 'border-[#D5D0C8] text-[#999] hover:text-[#505A4A] hover:border-[#505A4A]'
                                    }`}
                                >
                                    <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} strokeWidth={1.5} />
                                </button>
                            </div>

                            {/* Trust */}
                            <div className="grid grid-cols-3 gap-4 py-6 border-t border-[#E8E4DD]">
                                <div className="flex flex-col items-center text-center">
                                    <Truck className="h-5 w-5 text-[#505A4A]/50 mb-2" strokeWidth={1.5} />
                                    <span className="text-[11px] text-[#999] tracking-[0.03em]">Envío Express</span>
                                </div>
                                <div className="flex flex-col items-center text-center">
                                    <Shield className="h-5 w-5 text-[#505A4A]/50 mb-2" strokeWidth={1.5} />
                                    <span className="text-[11px] text-[#999] tracking-[0.03em]">Garantía 30 días</span>
                                </div>
                                <div className="flex flex-col items-center text-center">
                                    <RotateCcw className="h-5 w-5 text-[#505A4A]/50 mb-2" strokeWidth={1.5} />
                                    <span className="text-[11px] text-[#999] tracking-[0.03em]">Devolución gratis</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs de información */}
                    <div className="mt-20 border-t border-[#E8E4DD]">
                        <div className="flex">
                            {[
                                { id: 'description', label: 'Descripción' },
                                { id: 'details', label: 'Detalles' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-5 px-6 text-[13px] tracking-[0.08em] uppercase transition-all duration-200 relative ${
                                        activeTab === tab.id
                                            ? 'text-[#333] font-medium'
                                            : 'text-[#AAA] hover:text-[#666]'
                                    }`}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <motion.div
                                            className="absolute top-0 left-0 right-0 h-[2px] bg-[#505A4A]"
                                            layoutId="activeProductTab"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="py-10 max-w-2xl">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {activeTab === 'description' && (
                                        <p className="text-[15px] text-[#666] font-light leading-[1.8]">
                                            {product.description}
                                        </p>
                                    )}

                                    {activeTab === 'details' && (
                                        <div className="space-y-4">
                                            <div className="flex border-b border-[#E8E4DD] pb-4">
                                                <span className="text-[13px] text-[#999] w-36 uppercase tracking-[0.05em]">Categoría</span>
                                                <span className="text-[14px] text-[#555]">{category?.name || 'Sin categoría'}</span>
                                            </div>
                                            <div className="flex border-b border-[#E8E4DD] pb-4">
                                                <span className="text-[13px] text-[#999] w-36 uppercase tracking-[0.05em]">Estado</span>
                                                <span className="text-[14px] text-[#555]">{product.active ? 'Disponible' : 'No disponible'}</span>
                                            </div>
                                            <div className="flex border-b border-[#E8E4DD] pb-4">
                                                <span className="text-[13px] text-[#999] w-36 uppercase tracking-[0.05em]">Valoración</span>
                                                <span className="text-[14px] text-[#555]">{product.rating} / 5 ({product.reviews_count} reseñas)</span>
                                            </div>
                                            {product.featured && (
                                                <div className="flex border-b border-[#E8E4DD] pb-4">
                                                    <span className="text-[13px] text-[#999] w-36 uppercase tracking-[0.05em]">Destacado</span>
                                                    <span className="text-[14px] text-[#505A4A]">Producto destacado</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
