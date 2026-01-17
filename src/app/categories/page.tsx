"use client";

import { useState } from 'react';
import { Heart, Star, ShoppingBag, Grid3X3, List, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Breadcrumb from "@/components/ui/breadcrumb";
import { useCategories, useProducts, useWishlist, useCart } from "@/store";

export default function CategoriesPage() {
    const { activeCategories, isLoading: categoriesLoading } = useCategories();
    const { products, isLoading: productsLoading } = useProducts();
    const { addItem: addToCart } = useCart();
    const { toggleItem: toggleWishlist, isInWishlist } = useWishlist();

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const isLoading = categoriesLoading || productsLoading;

    // Get products for selected category
    const selectedProducts = selectedCategory
        ? products.filter(p => p.category_id === selectedCategory && p.active)
        : [];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-12 h-12 animate-spin text-[#4A6741]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen hero-gradient relative overflow-hidden">
            {/* Animated background elements (Hero Gradient Style) */}
            <motion.div
                className="absolute top-20 left-10 w-32 h-32 rounded-full bg-[#4A6741]/10 blur-3xl"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                    rotate: [0, 180, 360],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <motion.div
                className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-[#D4AF37]/10 blur-3xl"
                animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.2, 0.5, 0.2],
                    rotate: [360, 180, 0],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
            />

            <div className="container mx-auto px-4 py-8 relative z-10">
                {/* Breadcrumb */}
                <div className="mt-24 mb-10">
                    <Breadcrumb
                        items={[
                            { label: 'Categorías de Productos', href: '/categories' },
                            ...(selectedCategory ? [{ label: activeCategories.find(c => c.id === selectedCategory)?.name || 'Categoría' }] : [])
                        ]}
                    />
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Header */}
                    <motion.div variants={itemVariants} className="text-center mb-12 px-4">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
                            {selectedCategory
                                ? activeCategories.find(c => c.id === selectedCategory)?.name
                                : "Nuestras Categorías"
                            }
                        </h1>
                        <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto">
                            {selectedCategory
                                ? activeCategories.find(c => c.id === selectedCategory)?.description
                                : "Descubre nuestra amplia gama de productos naturales organizados por categorías"
                            }
                        </p>
                    </motion.div>

                    {!selectedCategory ? (
                        /* Vista de Categorías */
                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                            variants={containerVariants}
                        >
                            {activeCategories.map((category) => {
                                // Calculate product count for this category
                                const productCount = products.filter(p => p.category_id === category.id && p.active).length;

                                // No mostrar categorías sin productos
                                if (productCount === 0) return null;

                                return (
                                    <motion.div
                                        key={category.id}
                                        variants={itemVariants}
                                        whileHover={{ y: -10, scale: 1.02 }}
                                        className="group cursor-pointer"
                                        onClick={() => setSelectedCategory(category.id)}
                                    >
                                        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/95 backdrop-blur-sm h-full flex flex-col">
                                            <CardContent className="p-0 flex-1 flex flex-col">
                                                {/* Imagen de la categoría */}
                                                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                                                    <Image
                                                        src={category.image || '/images/placeholder.jpg'}
                                                        alt={category.name}
                                                        fill
                                                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                                                        unoptimized
                                                    />
                                                    {/* Overlay con contador */}
                                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors">
                                                        <div className="absolute bottom-4 right-4">
                                                            <Badge className="bg-white/90 text-[#4A6741] hover:bg-white">
                                                                {productCount} productos
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Información de la categoría */}
                                                <div className="p-6 flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-[#4A6741] mb-2 group-hover:text-[#3F5D4C] transition-colors">
                                                            {category.name}
                                                        </h3>
                                                        <p className="text-gray-700 text-sm line-clamp-2">
                                                            {category.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    ) : (
                        /* Vista de Productos de la Categoría Seleccionada */
                        <div>
                            {/* Header de la categoría seleccionada */}
                            <motion.div
                                variants={itemVariants}
                                className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4"
                            >
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedCategory(null)}
                                    className="border-[#4A6741] text-[#4A6741] hover:bg-[#4A6741] hover:text-white"
                                >
                                    ← Volver a Categorías
                                </Button>

                                {/* Controles de vista */}
                                <div className="hidden md:flex items-center gap-2">
                                    <Button
                                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setViewMode('grid')}
                                        className={viewMode === 'grid' ? 'bg-[#4A6741] text-white' : 'border-[#4A6741] text-[#4A6741]'}
                                    >
                                        <Grid3X3 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={viewMode === 'list' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setViewMode('list')}
                                        className={viewMode === 'list' ? 'bg-[#4A6741] text-white' : 'border-[#4A6741] text-[#4A6741]'}
                                    >
                                        <List className="h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.div>

                            {/* Grid de productos */}
                            <AnimatePresence>
                                {selectedProducts.length > 0 ? (
                                    <motion.div
                                        className={`grid gap-6 ${viewMode === 'grid'
                                            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                                            : 'grid-cols-1'
                                            }`}
                                        variants={containerVariants}
                                    >
                                        {selectedProducts.map((product) => (
                                            <motion.div
                                                key={product.id}
                                                variants={itemVariants}
                                                whileHover={{ y: -5 }}
                                                className="group"
                                            >
                                                <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/95 backdrop-blur-sm h-full">
                                                    <CardContent className={`p-0 ${viewMode === 'list' ? 'flex' : ''}`}>
                                                        {/* Imagen del producto */}
                                                        <div className={`relative bg-gray-100 overflow-hidden ${viewMode === 'list' ? 'w-48 aspect-square' : 'aspect-square'
                                                            }`}>
                                                            <Link href={`/products/${product.id}`} prefetch={false}>
                                                                <Image
                                                                    src={product.image || '/images/placeholder.jpg'}
                                                                    alt={product.name}
                                                                    fill
                                                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                                    unoptimized
                                                                />
                                                            </Link>

                                                            {/* Badges */}
                                                            <div className="absolute top-3 left-3 flex flex-col gap-2">
                                                                {product.featured && (
                                                                    <Badge className="bg-amber-500 text-white">
                                                                        Destacado
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Información del producto */}
                                                        <div className={`p-6 flex-1 flex flex-col justify-between ${viewMode === 'list' ? 'py-4' : ''}`}>
                                                            <div>
                                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                                    <Link href={`/products/${product.id}`} prefetch={false} className="flex-1">
                                                                        <h3 className="font-semibold text-lg text-gray-900 group-hover:text-[#4A6741] transition-colors line-clamp-2">
                                                                            {product.name}
                                                                        </h3>
                                                                    </Link>
                                                                    <button
                                                                        onClick={() => toggleWishlist(product.id)}
                                                                        className={`p-1 rounded transition-colors ${isInWishlist(product.id)
                                                                            ? 'text-red-500'
                                                                            : 'text-gray-400 hover:text-red-500'
                                                                            }`}
                                                                    >
                                                                        <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                                                                    </button>
                                                                </div>

                                                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                                                    {product.description}
                                                                </p>

                                                                {/* Rating */}
                                                                <div className="flex items-center gap-1 mb-4">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <Star
                                                                            key={i}
                                                                            className={`w-4 h-4 ${i < Math.round(product.rating || 0) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-300'}`}
                                                                        />
                                                                    ))}
                                                                    <span className="text-sm text-gray-500 ml-2">
                                                                        ({product.reviews_count || 0})
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="mt-auto">
                                                                {/* Precio */}
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-2xl font-bold text-[#4A6741]">
                                                                            €{product.price.toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                                        En stock
                                                                    </Badge>
                                                                </div>

                                                                {/* Botón de agregar al carrito */}
                                                                <Button
                                                                    onClick={() => addToCart(product)}
                                                                    className="w-full bg-[#4A6741] hover:bg-[#3F5D4C] text-white"
                                                                >
                                                                    <ShoppingBag className="w-4 h-4 mr-2" />
                                                                    Agregar al Carrito
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <div className="text-center py-20 bg-white/50 rounded-xl">
                                        <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                        <p className="text-xl text-gray-500">No hay productos en esta categoría aún.</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}