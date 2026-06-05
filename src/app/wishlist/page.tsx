"use client";

import { useWishlist, useProducts, useCart } from "@/store";
import { useTheme } from "@/store/ThemeContext";
import { Heart, ShoppingBag, ArrowLeft, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProductImage from "@/components/ui/product-image";
import { m, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Breadcrumb from "@/components/ui/breadcrumb";

export default function WishlistPage() {
    const { items: wishlistIds, removeFromWishlist, isLoaded } = useWishlist();
    const { products, isLoading: productsLoading } = useProducts();
    const { addItem: addToCart } = useCart();
    const { isDark } = useTheme();

    // Map IDs to product objects
    const wishlistItems = products.filter(p => wishlistIds.includes(p.id));

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.6, staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
    };

    if (!isLoaded || productsLoading) {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDark ? 'bg-[#15241B]' : 'bg-gray-50'}`}>
                <div className={`animate-spin rounded-full h-8 w-8 border-2 border-t-transparent ${isDark ? 'border-[#C4AC91]' : 'border-[#2E4A3A]'}`} />
            </div>
        );
    }

    if (wishlistItems.length === 0) {
        return (
            <div className={`min-h-screen pt-20 transition-colors duration-300 ${isDark ? 'bg-[#15241B]' : 'bg-gradient-to-b from-[#FEFCF7] to-[#F5F1E8]'}`}>
                <div className="container mx-auto px-4 pb-8">
                    <div className="mb-6">
                        <Breadcrumb items={[{ label: 'Lista de Favoritos' }]} />
                    </div>

                    <m.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16"
                    >
                        <div className="max-w-md mx-auto">
                            <Heart className={`h-24 w-24 mx-auto mb-6 ${isDark ? 'text-[#C4AC91]/40' : 'text-[#2E4A3A]/40'}`} />
                            <h2 className={`text-3xl font-bold mb-4 ${isDark ? 'text-[#e8e4dc]' : 'text-gray-900'}`}>Tu lista de favoritos está vacía</h2>
                            <p className={`mb-8 text-lg font-medium ${isDark ? 'text-[#b8b0a2]' : 'text-gray-700'}`}>Explora nuestros productos y guarda tus favoritos aquí.</p>
                            <Link href="/products">
                                <Button className={`font-bold px-8 py-3 text-lg shadow-lg ${isDark ? 'bg-[#C4AC91] hover:bg-[#b3a47e] text-[#15241B]' : 'bg-[#2E4A3A] hover:bg-[#26402F] text-white'}`}>
                                    Explorar Productos
                                </Button>
                            </Link>
                        </div>
                    </m.div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen pt-20 transition-colors duration-300 ${isDark ? 'bg-[#15241B]' : 'bg-gradient-to-b from-[#FEFCF7] to-[#F5F1E8]'}`}>
            <div className="container mx-auto px-4 pb-8">
                <div className="mb-6">
                    <Breadcrumb items={[{ label: 'Lista de Favoritos' }]} />
                </div>

                <m.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Header */}
                    <m.div variants={itemVariants} className="mb-8">
                        <Card className={`shadow-xl border-0 backdrop-blur-sm ${isDark ? 'bg-[#15241B]' : 'bg-white/90'}`}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Heart className={`h-8 w-8 ${isDark ? 'text-[#C4AC91] fill-[#C4AC91]' : 'text-[#2E4A3A] fill-[#2E4A3A]'}`} />
                                        <div>
                                            <h1 className={`text-3xl font-bold ${isDark ? 'text-[#e8e4dc]' : 'text-gray-900'}`}>Mis Favoritos</h1>
                                            <p className={`font-medium ${isDark ? 'text-[#b8b0a2]' : 'text-gray-700'}`}>
                                                {wishlistItems.length} producto{wishlistItems.length !== 1 ? 's' : ''} guardado{wishlistItems.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className={`font-bold text-lg px-4 py-2 ${isDark ? 'bg-[#C4AC91]/15 text-[#C4AC91]' : 'bg-[#2E4A3A]/10 text-[#2E4A3A]'}`}>
                                        {wishlistItems.length} productos
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </m.div>

                    {/* Grid de productos */}
                    <AnimatePresence>
                        <m.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            variants={containerVariants}
                        >
                            {wishlistItems.map((product) => (
                                <m.div
                                    key={product.id}
                                    variants={itemVariants}
                                    exit="exit"
                                    layout
                                    className="group"
                                >
                                    <Card className={`overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col ${isDark ? 'bg-[#15241B]' : 'bg-white/95 backdrop-blur-sm'}`}>
                                        <CardContent className="p-0 relative flex-1 flex flex-col">
                                            {/* Botón eliminar */}
                                            <m.button
                                                onClick={() => removeFromWishlist(product.id)}
                                                className={`absolute top-3 right-3 z-10 rounded-full p-2 shadow-md transition-all duration-200 ${isDark ? 'bg-[#15241B]/90 hover:bg-[#15241B] text-[#b8b0a2] hover:text-[#C4AC91]' : 'bg-white/90 hover:bg-white text-gray-600 hover:text-[#2E4A3A]'}`}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                title="Eliminar producto"
                                            >
                                                <X className="h-4 w-4" />
                                            </m.button>

                                            {/* Imagen del producto */}
                                            <Link href={`/products/${product.id}`} className={`relative aspect-square overflow-hidden block ${isDark ? 'bg-[#15241B]' : 'bg-gray-100'}`}>
                                                <ProductImage
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                            </Link>

                                            {/* Información del producto */}
                                            <div className="p-6 flex-1 flex flex-col">
                                                <Link href={`/products/${product.id}`} className="mb-2 block">
                                                    <h3 className={`text-xl font-bold transition-colors line-clamp-1 ${isDark ? 'text-[#C4AC91] hover:text-[#dbcca0]' : 'text-[#2E4A3A] hover:text-[#26402F]'}`}>
                                                        {product.name}
                                                    </h3>
                                                </Link>

                                                <p className={`text-sm mb-4 line-clamp-2 ${isDark ? 'text-[#b8b0a2]' : 'text-gray-700'}`}>
                                                    {product.description}
                                                </p>

                                                <div className="mt-auto">
                                                    {/* Precio */}
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className={`text-2xl font-bold ${isDark ? 'text-[#C4AC91]' : 'text-[#2E4A3A]'}`}>${product.price.toFixed(2)}</span>
                                                        <Badge
                                                            variant="secondary"
                                                            className={`font-semibold ${
                                                                product.active
                                                                    ? (isDark ? 'bg-[#C4AC91]/15 text-[#C4AC91]' : 'bg-[#2E4A3A]/10 text-[#2E4A3A]')
                                                                    : (isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800')
                                                            }`}
                                                        >
                                                            {product.active ? 'En stock' : 'No disponible'}
                                                        </Badge>
                                                    </div>

                                                    {/* Botones */}
                                                    <div className="flex flex-col gap-2">
                                                        <Button
                                                            onClick={() => addToCart(product)}
                                                            className={`w-full font-bold ${isDark ? 'bg-[#C4AC91] hover:bg-[#b3a47e] text-[#15241B]' : 'bg-[#2E4A3A] hover:bg-[#26402F] text-white'}`}
                                                            disabled={!product.active}
                                                        >
                                                            <ShoppingBag className="h-4 w-4 mr-2" />
                                                            Agregar al Carrito
                                                        </Button>
                                                        <Link href={`/products/${product.id}`} className="w-full">
                                                            <Button
                                                                variant="outline"
                                                                className={`w-full ${isDark ? 'border-[#C4AC91] text-[#C4AC91] hover:bg-[#C4AC91] hover:text-[#15241B]' : 'border-[#2E4A3A] text-[#2E4A3A] hover:bg-[#2E4A3A] hover:text-white'}`}
                                                            >
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                Ver Detalles
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </m.div>
                            ))}
                        </m.div>
                    </AnimatePresence>

                    {/* Footer Actions */}
                    <m.div variants={itemVariants} className="mt-12 text-center">
                        <Link href="/products">
                            <Button variant="outline" className={`font-bold px-8 py-3 text-lg ${isDark ? 'border-[#C4AC91] text-[#C4AC91] hover:bg-[#C4AC91] hover:text-[#15241B]' : 'border-[#2E4A3A] text-[#2E4A3A] hover:bg-[#2E4A3A] hover:text-white'}`}>
                                <ArrowLeft className="h-5 w-5 mr-2" />
                                Seguir Explorando
                            </Button>
                        </Link>
                    </m.div>
                </m.div>
            </div>
        </div>
    );
}
