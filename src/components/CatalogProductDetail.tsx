"use client";

import { useState } from 'react';
import { ArrowLeft, Sun, Moon, Star, Package, Plus, ShoppingBag, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ProductImage from "@/components/ui/product-image";
import { m } from 'framer-motion';
import { useTheme } from '@/store/ThemeContext';
import { useCart, CartProduct } from '@/store/CartContext';
import CartDrawer from '@/components/CartDrawer';

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
    tags: string[];
    ingredients: string[];
    usage?: string;
    weight?: number;
    weight_unit?: string;
    out_of_stock?: boolean;
}

interface CatalogProductDetailProps {
    product: Product;
    categoryName: string;
}

export default function CatalogProductDetail({ product, categoryName }: CatalogProductDetailProps) {
    const { isDark, toggleTheme } = useTheme();
    const { addItem, totalItems } = useCart();
    const [selectedImage] = useState(0);
    const [addedToCart, setAddedToCart] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const images = product.image ? [product.image] : [];

    const formatPrice = (price: number) => `$${price.toFixed(2)}`;

    const handleAddToCart = () => {
        const cartProduct: CartProduct = {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
        };
        addItem(cartProduct);
        setAddedToCart(true);
        setTimeout(() => {
            setAddedToCart(false);
            setIsCartOpen(true);
        }, 800);
    };

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
                        <div className="flex items-center gap-3">
                            <Link
                                href="/"
                                className={`flex items-center justify-center h-9 w-9 rounded-lg transition-colors ${isDark ? 'hover:bg-[#C4B590]/15' : 'hover:bg-gray-100'}`}
                                aria-label="Volver al catalogo"
                            >
                                <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`} />
                            </Link>
                            <Link href="/" className="flex items-center gap-3">
                                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden shadow-sm ring-1 ring-[#505A4A]/15">
                                    <Image
                                        src="/images/sophia_logo_nuevo.jpeg"
                                        alt="Sophia Cosmetica Botanica"
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

                            {/* Cart button */}
                            <m.button
                                onClick={() => setIsCartOpen(true)}
                                className={`relative p-2 rounded-xl transition-colors ${isDark ? 'bg-[#C4B590]/15 text-[#C4B590] hover:bg-[#C4B590]/25' : 'bg-[#505A4A]/10 text-[#505A4A] hover:bg-[#505A4A]/20'}`}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                aria-label="Carrito"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                {totalItems > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#C4B590] text-[#1a1d19] text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {totalItems}
                                    </span>
                                )}
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
                                className={`object-cover ${product.out_of_stock ? 'opacity-70 grayscale-[20%]' : ''}`}
                            />
                        ) : (
                            <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-[#22261f]' : 'bg-[#F0EDE6]'}`}>
                                <span className={`text-sm ${isDark ? 'text-[#7a7568]' : 'text-[#999]'}`}>Sin imagen</span>
                            </div>
                        )}
                        {product.out_of_stock && (
                            <div className="absolute top-3 left-3 bg-red-500/90 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                Agotado
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

                        {/* Rating */}
                        {product.rating > 0 && (
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex items-center gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={`star-${i}`}
                                            className={`h-4 w-4 ${
                                                i < Math.floor(product.rating)
                                                    ? 'text-[#C9A96E] fill-[#C9A96E]'
                                                    : isDark ? 'text-gray-700 fill-gray-700' : 'text-gray-200 fill-gray-200'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <span className={`text-[13px] ${isDark ? 'text-[#8a8273]' : 'text-[#999]'}`}>
                                    {product.rating}
                                </span>
                            </div>
                        )}

                        <p className={`text-sm sm:text-base leading-relaxed mb-5 ${isDark ? 'text-[#8a8278]' : 'text-gray-600'}`}>
                            {product.description}
                        </p>

                        {/* Tags */}
                        {product.tags && product.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-5">
                                {product.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className={`text-[12px] px-3 py-1.5 rounded-lg ${
                                            isDark ? 'bg-[#2a2d26] text-[#a09889]' : 'bg-[#F5F1E8] text-[#666]'
                                        }`}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Modo de uso */}
                        {product.usage && (
                            <div className="mb-4">
                                <span className={`text-[12px] uppercase tracking-[0.12em] block mb-2 ${isDark ? 'text-[#8a8273]' : 'text-[#999]'}`}>
                                    Modo de uso
                                </span>
                                <p className={`text-[14px] leading-relaxed ${isDark ? 'text-[#a09889]' : 'text-[#666]'}`}>
                                    {product.usage}
                                </p>
                            </div>
                        )}

                        {/* Ingredientes */}
                        {product.ingredients && product.ingredients.length > 0 && (
                            <div className="mb-5">
                                <span className={`text-[12px] uppercase tracking-[0.12em] block mb-3 ${isDark ? 'text-[#8a8273]' : 'text-[#999]'}`}>
                                    Ingredientes
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {product.ingredients.map((ingredient) => (
                                        <span
                                            key={ingredient}
                                            className={`text-[12px] px-3 py-1.5 rounded-lg ${
                                                isDark ? 'bg-[#2a2d26] text-[#a09889]' : 'bg-[#F5F1E8] text-[#666]'
                                            }`}
                                        >
                                            {ingredient}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Precio + Peso */}
                        <div className="flex items-baseline gap-4 mb-6">
                            <span className={`text-3xl font-bold ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}>
                                {formatPrice(product.price)}
                            </span>
                            {product.weight != null && product.weight > 0 && (
                                <span className={`text-sm flex items-center gap-1.5 ${isDark ? 'text-[#8a8273]' : 'text-[#999]'}`}>
                                    <Package className="w-3.5 h-3.5" />
                                    {product.weight} {product.weight_unit || 'g'}
                                </span>
                            )}
                        </div>

                        {/* Add to Cart CTA */}
                        {product.out_of_stock ? (
                            <div className="w-full bg-gray-300 text-gray-500 py-4 rounded-xl text-base font-medium flex items-center justify-center gap-3 cursor-not-allowed mb-6">
                                Producto agotado
                            </div>
                        ) : (
                            <m.button
                                onClick={handleAddToCart}
                                className={`w-full py-4 rounded-xl text-base font-medium flex items-center justify-center gap-3 transition-all shadow-md mb-6 ${
                                    addedToCart
                                        ? 'bg-[#C4B590] text-[#1a1d19]'
                                        : 'bg-[#505A4A] text-white hover:bg-[#414A3C]'
                                }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {addedToCart ? (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Agregado al carrito
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5" />
                                        Agregar al carrito
                                    </>
                                )}
                            </m.button>
                        )}

                        {/* Back link */}
                        <Link
                            href="/"
                            className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${isDark ? 'text-[#C4B590] hover:text-[#e8e4dc]' : 'text-[#505A4A] hover:text-gray-900'}`}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver al catalogo
                        </Link>
                    </div>
                </m.div>
            </div>

            {/* Cart Drawer */}
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
}
