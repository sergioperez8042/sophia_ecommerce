"use client";

import { useState, useEffect, use } from 'react';
import { Star, Heart, ShoppingBag, Plus, Minus, Share2, Shield, Truck, RotateCcw, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import dynamic from 'next/dynamic';

// Importar Breadcrumb dinámicamente para evitar problemas de SSR
const Breadcrumb = dynamic(() => import("@/components/ui/breadcrumb"), {
    ssr: false
});

// Simulando datos del producto basándose en el ID
const getProductById = (id: string) => {
    const products = [
        {
            id: "1",
            name: "Crema Hidratante Natural",
            description: "Hidratación profunda con aloe vera y aceite de jojoba para una piel suave y radiante",
            longDescription: "Nuestra crema hidratante natural combina los beneficios del aloe vera orgánico con aceite de jojoba premium para proporcionar una hidratación profunda y duradera. Formulada sin parabenos ni químicos agresivos, es perfecta para todo tipo de piel, especialmente la piel sensible.",
            price: 25.99,
            originalPrice: 32.99,
            rating: 4.8,
            reviews: 124,
            images: ["/product1.png", "/product2.png", "/product3.png"],
            category: "Cuidado Facial",
            brand: "Sophia Natural",
            inStock: true,
            features: [
                "100% ingredientes naturales",
                "Sin parabenos ni sulfatos",
                "Certificado orgánico",
                "Cruelty-free",
                "Apto para piel sensible"
            ],
            ingredients: "Aloe Barbadensis Leaf Juice, Simmondsia Chinensis (Jojoba) Seed Oil, Butyrospermum Parkii (Shea) Butter, Glycerin, Cetyl Alcohol, Stearyl Alcohol, Tocopheryl Acetate (Vitamin E)"
        },
        {
            id: "2",
            name: "Serum Vitamina C",
            description: "Serum antioxidante para iluminar y rejuvenecer tu piel",
            longDescription: "Este potente serum de vitamina C está formulado con ácido L-ascórbico estabilizado para máxima eficacia. Ayuda a reducir manchas oscuras, unifica el tono de la piel y proporciona protección antioxidante contra los radicales libres.",
            price: 35.99,
            originalPrice: 45.99,
            rating: 4.9,
            reviews: 89,
            images: ["/product2.png", "/product1.png", "/product3.png"],
            category: "Tratamiento",
            brand: "Sophia Natural",
            inStock: true,
            features: [
                "20% Vitamina C estabilizada",
                "Reduce manchas oscuras",
                "Antioxidante potente",
                "Absorción rápida",
                "Resultados visibles en 4 semanas"
            ],
            ingredients: "Ascorbic Acid, Hyaluronic Acid, Vitamin E, Ferulic Acid, Water, Glycerin, Propylene Glycol"
        }
    ];

    return products.find(p => p.id === id) || products[0];
};

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [activeTab, setActiveTab] = useState('description');
    const [isWishlisted, setIsWishlisted] = useState(false);

    const product = getProductById(resolvedParams.id);

    // Funciones para el carousel
    const nextImage = () => {
        setSelectedImage((prev) => (prev + 1) % product.images.length);
    };

    const prevImage = () => {
        setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Breadcrumb
                        items={[
                            { label: 'Productos', href: '/products' },
                            { label: product.category, href: `/products?category=${product.category.toLowerCase()}` },
                            { label: product.name }
                        ]}
                    />
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 lg:grid-cols-2 gap-12"
                >
                    {/* Galería de imágenes con carousel */}
                    <motion.div variants={itemVariants} className="space-y-4">
                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-lg group">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={selectedImage}
                                    initial={{ opacity: 0, x: 300 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -300 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute inset-0"
                                >
                                    <Image
                                        src={product.images[selectedImage]}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                </motion.div>
                            </AnimatePresence>

                            {/* Botones de navegación del carousel */}
                            <button
                                onClick={prevImage}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>

                            {/* Indicadores de carousel */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                                {product.images.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${selectedImage === index
                                            ? 'bg-white w-6'
                                            : 'bg-white/50 hover:bg-white/75'
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Badge de descuento */}
                            {product.originalPrice > product.price && (
                                <Badge className="absolute top-4 left-4 bg-red-500 hover:bg-red-600 z-10">
                                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                                </Badge>
                            )}
                        </div>

                        {/* Thumbnails */}
                        <div className="grid grid-cols-3 gap-2">
                            {product.images.map((image, index) => (
                                <motion.button
                                    key={index}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedImage(index)}
                                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300 ${selectedImage === index
                                        ? 'border-[#4A6741] shadow-md'
                                        : 'border-gray-200 hover:border-[#4A6741]/50'
                                        }`}
                                >
                                    <Image
                                        src={image}
                                        alt={`${product.name} ${index + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Información del producto */}
                    <motion.div variants={itemVariants} className="space-y-6">
                        {/* Header del producto */}
                        <div>
                            <Badge variant="secondary" className="mb-2 bg-[#4A6741]/10 text-[#4A6741] hover:bg-[#4A6741]/20 font-semibold">
                                {product.category}
                            </Badge>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                            <p className="text-lg text-gray-800 font-medium leading-relaxed">{product.description}</p>
                        </div>

                        {/* Rating y reviews */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`h-5 w-5 stroke-1 ${i < Math.floor(product.rating)
                                            ? 'text-yellow-500 fill-yellow-400'
                                            : 'text-gray-300 fill-gray-200'
                                            }`}
                                    />
                                ))}
                                <span className="ml-2 text-sm font-bold text-gray-900">{product.rating}</span>
                            </div>
                            <span className="text-sm text-gray-700 font-medium">({product.reviews} reseñas)</span>
                        </div>

                        {/* Precio */}
                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-bold text-[#4A6741]">${product.price}</span>
                            {product.originalPrice > product.price && (
                                <span className="text-xl text-gray-500 line-through">${product.originalPrice}</span>
                            )}
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                                En stock
                            </Badge>
                        </div>

                        {/* Cantidad y acciones */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-gray-900">Cantidad:</span>
                                <div className="flex items-center bg-white border-2 border-[#4A6741]/40 rounded-lg shadow-md hover:border-[#4A6741]/60 transition-all duration-200">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="h-10 w-10 p-0 hover:bg-[#4A6741] hover:text-white border-r-2 border-[#4A6741]/40 rounded-r-none text-[#4A6741] font-bold transition-all"
                                    >
                                        <Minus className="h-5 w-5 stroke-[3]" />
                                    </Button>
                                    <span className="px-4 py-2 font-bold text-gray-900 min-w-[3rem] text-center bg-gray-50 text-lg">
                                        {quantity}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="h-10 w-10 p-0 hover:bg-[#4A6741] hover:text-white border-l-2 border-[#4A6741]/40 rounded-l-none text-[#4A6741] font-bold transition-all"
                                    >
                                        <Plus className="h-5 w-5 stroke-[3]" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Link href="/cart">
                                        <Button className="w-full bg-[#4A6741] hover:bg-[#3F5D4C] text-white h-12 text-lg font-bold shadow-lg">
                                            <ShoppingBag className="mr-2 h-6 w-6 stroke-2 fill-white/20" />
                                            Agregar al carrito
                                        </Button>
                                    </Link>
                                </motion.div>

                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                        size="lg"
                                        onClick={() => setIsWishlisted(!isWishlisted)}
                                        className="h-12 w-12 p-0 bg-[#4A6741] hover:bg-[#3F5D4C] text-white group relative shadow-md flex items-center justify-center border-0"
                                        title="Añadir a favoritos"
                                    >
                                        <Heart
                                            className={`h-6 w-6 stroke-2 transition-colors ${isWishlisted
                                                    ? 'fill-white text-white'
                                                    : 'text-white'
                                                }`}
                                        />
                                        {/* Tooltip mejorado */}
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap shadow-lg z-50 pointer-events-none">
                                            {isWishlisted ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                                        </div>
                                    </Button>
                                </motion.div>

                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                        size="lg"
                                        className="h-12 w-12 p-0 bg-[#4A6741] hover:bg-[#3F5D4C] text-white group relative shadow-md flex items-center justify-center border-0"
                                        title="Compartir producto"
                                    >
                                        <Share2 className="h-6 w-6 stroke-2 text-white" />
                                        {/* Tooltip mejorado */}
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap shadow-lg z-50 pointer-events-none">
                                            Compartir producto
                                        </div>
                                    </Button>
                                </motion.div>
                            </div>
                        </div>

                        {/* Beneficios */}
                        <motion.div
                            variants={itemVariants}
                            className="grid grid-cols-3 gap-4 py-6 border-t border-b border-gray-200"
                        >
                            <div className="flex flex-col items-center text-center">
                                <Truck className="h-8 w-8 text-[#4A6741] mb-2 stroke-2" />
                                <span className="text-sm font-semibold text-gray-900">Envío gratis</span>
                                <span className="text-xs text-gray-600">Pedidos +$50</span>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <Shield className="h-8 w-8 text-[#4A6741] mb-2 stroke-2" />
                                <span className="text-sm font-semibold text-gray-900">Garantía</span>
                                <span className="text-xs text-gray-600">30 días</span>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <RotateCcw className="h-8 w-8 text-[#4A6741] mb-2 stroke-2" />
                                <span className="text-sm font-semibold text-gray-900">Devoluciones</span>
                                <span className="text-xs text-gray-600">Sin costo</span>
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.div>

                {/* Tabs de información adicional */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-24"
                >
                    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                        <CardContent className="p-0">
                            {/* Tab headers */}
                            <div className="flex space-x-0 border-b border-gray-200 bg-gray-50/50">
                                {[
                                    { id: 'description', label: 'Descripción' },
                                    { id: 'features', label: 'Características' },
                                    { id: 'ingredients', label: 'Ingredientes' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 py-6 px-6 font-semibold text-lg transition-all duration-300 relative ${activeTab === tab.id
                                            ? 'text-[#4A6741] bg-white'
                                            : 'text-gray-600 hover:text-[#4A6741] hover:bg-white/50'
                                            }`}
                                    >
                                        {tab.label}
                                        {activeTab === tab.id && (
                                            <motion.div
                                                className="absolute bottom-0 left-0 right-0 h-1 bg-[#4A6741]"
                                                layoutId="activeTab"
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Tab content */}
                            <div className="p-8">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="min-h-[200px]"
                                >
                                    {activeTab === 'description' && (
                                        <div className="prose prose-gray max-w-none">
                                            <p className="text-gray-800 leading-relaxed text-lg font-light tracking-wide m-0">
                                                {product.longDescription}
                                            </p>
                                        </div>
                                    )}

                                    {activeTab === 'features' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {product.features.map((feature, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                                    className="flex items-start space-x-4 p-4 bg-green-50/50 rounded-lg border border-green-100 hover:shadow-sm transition-shadow duration-200"
                                                >
                                                    <div className="h-3 w-3 bg-[#4A6741] rounded-full flex-shrink-0 mt-1.5" />
                                                    <span className="text-gray-800 font-medium text-base">{feature}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}

                                    {activeTab === 'ingredients' && (
                                        <div className="prose prose-gray max-w-none">
                                            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-6">
                                                <h4 className="text-lg font-semibold text-[#4A6741] mb-4 flex items-center">
                                                    <Sparkles className="w-5 h-5 mr-2 stroke-2 text-amber-600" />
                                                    Ingredientes principales:
                                                </h4>
                                                <p className="text-gray-800 leading-relaxed text-base font-light m-0">
                                                    {product.ingredients}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}