"use client";

import { useState } from 'react';
import { Heart, Star, ShoppingBag, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Breadcrumb from "@/components/ui/breadcrumb";

// Categorías disponibles
const categories = [
    {
        id: "skincare",
        name: "Cuidado de la Piel",
        description: "Productos para el cuidado facial y corporal",
        image: "/product1.png",
        product_count: 15,
        color: "bg-green-100 text-green-800"
    },
    {
        id: "makeup",
        name: "Maquillaje",
        description: "Productos de maquillaje natural y orgánico",
        image: "/product2.png",
        product_count: 12,
        color: "bg-pink-100 text-pink-800"
    },
    {
        id: "haircare",
        name: "Cuidado Capilar",
        description: "Productos para el cuidado del cabello",
        image: "/product3.png",
        product_count: 8,
        color: "bg-blue-100 text-blue-800"
    },
    {
        id: "bodycare",
        name: "Cuidado Corporal",
        description: "Productos para el cuidado del cuerpo",
        image: "/product4.png",
        product_count: 10,
        color: "bg-purple-100 text-purple-800"
    }
];

// Tipo para productos
type Product = {
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice: number;
    rating: number;
    reviews: number;
    image: string;
    category: string;
    brand: string;
    inStock: boolean;
    isNew?: boolean;
    isBestseller?: boolean;
};

// Productos de ejemplo por categoría
const productsByCategory: { [key: string]: Product[] } = {
    skincare: [
        {
            id: "1",
            name: "Crema Hidratante Natural",
            description: "Hidratación profunda con aloe vera y aceite de jojoba",
            price: 25.99,
            originalPrice: 32.99,
            rating: 4.8,
            reviews: 124,
            image: "/product1.png",
            category: "Cuidado de la Piel",
            brand: "Sophia Natural",
            inStock: true,
            isBestseller: true
        },
        {
            id: "5",
            name: "Serum Anti-Edad Premium",
            description: "Serum con colágeno y ácido hialurónico para rejuvenecer la piel",
            price: 42.99,
            originalPrice: 55.99,
            rating: 4.9,
            reviews: 98,
            image: "/product5.png",
            category: "Cuidado de la Piel",
            brand: "Sophia Natural",
            inStock: true,
            isNew: true
        },
        {
            id: "6",
            name: "Limpiador Facial Suave",
            description: "Limpiador facial con ingredientes naturales para todo tipo de piel",
            price: 18.99,
            originalPrice: 24.99,
            rating: 4.7,
            reviews: 156,
            image: "/product1.png",
            category: "Cuidado de la Piel",
            brand: "Sophia Natural",
            inStock: true
        }
    ],
    makeup: [
        {
            id: "7",
            name: "Base de Maquillaje Natural",
            description: "Base de maquillaje con cobertura natural y larga duración",
            price: 28.99,
            originalPrice: 35.99,
            rating: 4.6,
            reviews: 87,
            image: "/product2.png",
            category: "Maquillaje",
            brand: "Sophia Natural",
            inStock: true
        },
        {
            id: "8",
            name: "Labial Orgánico",
            description: "Labial con ingredientes orgánicos en tonos naturales",
            price: 15.99,
            originalPrice: 19.99,
            rating: 4.8,
            reviews: 203,
            image: "/product3.png",
            category: "Maquillaje",
            brand: "Sophia Natural",
            inStock: true,
            isBestseller: true
        }
    ],
    haircare: [
        {
            id: "9",
            name: "Champú Nutritivo",
            description: "Champú con aceites naturales para cabello seco y dañado",
            price: 22.99,
            originalPrice: 28.99,
            rating: 4.5,
            reviews: 145,
            image: "/product4.png",
            category: "Cuidado Capilar",
            brand: "Sophia Natural",
            inStock: true
        },
        {
            id: "10",
            name: "Acondicionador Reparador",
            description: "Acondicionador reparador con keratina natural y vitaminas",
            price: 24.99,
            originalPrice: 32.99,
            rating: 4.7,
            reviews: 112,
            image: "/product5.png",
            category: "Cuidado Capilar",
            brand: "Sophia Natural",
            inStock: true
        }
    ],
    bodycare: [
        {
            id: "11",
            name: "Loción Corporal Hidratante",
            description: "Loción corporal con manteca de karité y aceites esenciales",
            price: 19.99,
            originalPrice: 26.99,
            rating: 4.6,
            reviews: 189,
            image: "/product3.png",
            category: "Cuidado Corporal",
            brand: "Sophia Natural",
            inStock: true
        },
        {
            id: "12",
            name: "Exfoliante Corporal Natural",
            description: "Exfoliante corporal con azúcar orgánico y aceites naturales",
            price: 16.99,
            originalPrice: 21.99,
            rating: 4.8,
            reviews: 156,
            image: "/product4.png",
            category: "Cuidado Corporal",
            brand: "Sophia Natural",
            inStock: true,
            isNew: true
        }
    ]
};

export default function CategoriesPage() {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [wishlist, setWishlist] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const toggleWishlist = (productId: string) => {
        setWishlist(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const addToCart = (product: any) => {
        console.log(`${product.name} agregado al carrito`);
        // Aquí implementarías la lógica real del carrito
    };

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

    const selectedProducts = selectedCategory ? productsByCategory[selectedCategory as keyof typeof productsByCategory] || [] : [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="mt-12 sm:mt-16 mb-10 sm:mb-12">
                    <Breadcrumb
                        items={[
                            { label: 'Categorías de Productos' }
                        ]}
                    />
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Header */}
                    <motion.div variants={itemVariants} className="text-center mb-8 md:mb-12 px-4">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-2 md:mb-4">
                            Nuestras Categorías
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-3xl mx-auto px-4">
                            Descubre nuestra amplia gama de productos naturales organizados por categorías
                        </p>
                    </motion.div>

                    {!selectedCategory ? (
                        /* Vista de Categorías */
                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4"
                            variants={containerVariants}
                        >
                            {categories.map((category, index) => (
                                <motion.div
                                    key={category.id}
                                    variants={itemVariants}
                                    whileHover={{ y: -10, scale: 1.02 }}
                                    className="group cursor-pointer"
                                    onClick={() => setSelectedCategory(category.id)}
                                >
                                    <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/95 backdrop-blur-sm">
                                        <CardContent className="p-0">
                                            {/* Imagen de la categoría */}
                                            <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                                                <Image
                                                    src={category.image}
                                                    alt={category.name}
                                                    fill
                                                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                                                />
                                                {/* Overlay con contador */}
                                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors">
                                                    <div className="absolute bottom-4 right-4">
                                                        <Badge className={category.color}>
                                                            {category.product_count} productos
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Información de la categoría */}
                                            <div className="p-6">
                                                <h3 className="text-xl font-bold text-[#4A6741] mb-2 group-hover:text-[#3F5D4C] transition-colors">
                                                    {category.name}
                                                </h3>
                                                <p className="text-gray-700 text-sm line-clamp-2">
                                                    {category.description}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        /* Vista de Productos de la Categoría Seleccionada */
                        <div>
                            {/* Header de la categoría seleccionada */}
                            <motion.div
                                variants={itemVariants}
                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4 px-4"
                            >
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedCategory(null)}
                                        className="border-[#4A6741] text-[#4A6741] hover:bg-[#4A6741] hover:text-white text-sm sm:text-base"
                                    >
                                        ← Volver a Categorías
                                    </Button>
                                    <div className="mt-2 sm:mt-0">
                                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                                            {categories.find(c => c.id === selectedCategory)?.name}
                                        </h2>
                                        <p className="text-sm sm:text-base text-gray-600">
                                            {selectedProducts.length} productos encontrados
                                        </p>
                                    </div>
                                </div>

                                {/* Controles de vista */}
                                <div className="hidden md:flex items-center gap-2 w-full sm:w-auto justify-end">
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
                                <motion.div
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-6"
                                    variants={containerVariants}
                                >
                                    {selectedProducts.map((product, index) => (
                                        <motion.div
                                            key={product.id}
                                            variants={itemVariants}
                                            whileHover={{ y: -5 }}
                                            className="group"
                                        >
                                            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/95 backdrop-blur-sm">
                                                <CardContent className="p-0">
                                                    {/* Imagen del producto */}
                                                    <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                                                        <Link href={`/products/${product.id}`} prefetch={false}>
                                                            <Image
                                                                src={product.image}
                                                                alt={product.name}
                                                                fill
                                                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                            />
                                                        </Link>

                                                        {/* Badges */}
                                                        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1 sm:gap-2">
                                                            <Badge variant="secondary" className="bg-[#4A6741]/90 text-white font-semibold text-xs sm:text-sm">
                                                                {product.category}
                                                            </Badge>
                                                            {product.isBestseller && (
                                                                <Badge className="bg-orange-500 text-white text-xs sm:text-sm">
                                                                    Bestseller
                                                                </Badge>
                                                            )}
                                                            {product.isNew && (
                                                                <Badge className="bg-green-500 text-white text-xs sm:text-sm">
                                                                    Nuevo
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Información del producto */}
                                                    <div className="p-3 sm:p-4 md:p-6">
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <Link href={`/products/${product.id}`} prefetch={false} className="flex-1">
                                                                <h3 className="font-semibold text-sm sm:text-base md:text-lg text-gray-900 group-hover:text-[#4A6741] transition-colors line-clamp-2">
                                                                    {product.name}
                                                                </h3>
                                                            </Link>
                                                            <button
                                                                onClick={() => toggleWishlist(product.id)}
                                                                className={`p-1 rounded transition-colors ${wishlist.includes(product.id)
                                                                    ? 'text-red-500'
                                                                    : 'text-gray-500 hover:text-red-500'
                                                                    }`}
                                                            >
                                                                <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${wishlist.includes(product.id) ? 'fill-current' : ''}`} />
                                                            </button>
                                                        </div>

                                                        <p className="text-gray-700 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                                                            {product.description}
                                                        </p>

                                                        {/* Rating */}
                                                        <div className="flex items-center gap-1 mb-3 sm:mb-4">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-[#D4AF37] text-[#D4AF37]" />
                                                            ))}
                                                            <span className="text-xs sm:text-sm text-gray-600 ml-1 sm:ml-2">
                                                                {product.rating} ({product.reviews})
                                                            </span>
                                                        </div>

                                                        {/* Precio */}
                                                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                                                            <div className="flex items-center gap-1 sm:gap-2">
                                                                <span className="text-lg sm:text-xl md:text-2xl font-bold text-[#4A6741]">
                                                                    €{product.price.toFixed(2)}
                                                                </span>
                                                                {product.originalPrice && (
                                                                    <span className="text-sm sm:text-base md:text-lg text-gray-600 line-through">
                                                                        €{product.originalPrice.toFixed(2)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs sm:text-sm">
                                                                En stock
                                                            </Badge>
                                                        </div>

                                                        {/* Botón de agregar al carrito */}
                                                        <Button
                                                            onClick={() => addToCart(product)}
                                                            className="w-full bg-[#4A6741] hover:bg-[#3F5D4C] text-white text-sm sm:text-base"
                                                        >
                                                            <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                                            Agregar al Carrito
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}