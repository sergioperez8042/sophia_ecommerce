"use client";

import { useWishlist, useProducts, useCart } from "@/store";
import { Heart, Star, ShoppingBag, ArrowLeft, X, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProductImage from "@/components/ui/product-image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Breadcrumb from "@/components/ui/breadcrumb";

export default function WishlistPage() {
    const { items: wishlistIds, removeFromWishlist, isLoaded } = useWishlist();
    const { products, isLoading: productsLoading } = useProducts();
    const { addItem: addToCart } = useCart();

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
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-12 h-12 animate-spin text-[#505A4A]" />
            </div>
        );
    }

    if (wishlistItems.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#FEFCF7] to-[#F5F1E8]">
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-6">
                        <Breadcrumb items={[{ label: 'Lista de Favoritos' }]} />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16"
                    >
                        <div className="max-w-md mx-auto">
                            <Heart className="h-24 w-24 text-[#505A4A]/40 mx-auto mb-6" />
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tu lista de favoritos está vacía</h2>
                            <p className="text-gray-700 mb-8 text-lg font-medium">Explora nuestros productos y guarda tus favoritos aquí.</p>
                            <Link href="/products">
                                <Button className="bg-[#505A4A] hover:bg-[#414A3C] text-white font-bold px-8 py-3 text-lg shadow-lg">
                                    Explorar Productos
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FEFCF7] to-[#F5F1E8]">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <Breadcrumb items={[{ label: 'Lista de Favoritos' }]} />
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Header */}
                    <motion.div variants={itemVariants} className="mb-8">
                        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Heart className="h-8 w-8 text-red-500 fill-red-500" />
                                        <div>
                                            <h1 className="text-3xl font-bold text-gray-900">Mis Favoritos</h1>
                                            <p className="text-gray-700 font-medium">
                                                {wishlistItems.length} producto{wishlistItems.length !== 1 ? 's' : ''} guardado{wishlistItems.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="bg-[#505A4A]/10 text-[#505A4A] font-bold text-lg px-4 py-2">
                                        {wishlistItems.length} productos
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Grid de productos */}
                    <AnimatePresence>
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            variants={containerVariants}
                        >
                            {wishlistItems.map((product, index) => (
                                <motion.div
                                    key={product.id}
                                    variants={itemVariants}
                                    exit="exit"
                                    layout
                                    className="group"
                                >
                                    <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/95 backdrop-blur-sm h-full flex flex-col">
                                        <CardContent className="p-0 relative flex-1 flex flex-col">
                                            {/* Botón eliminar */}
                                            <motion.button
                                                onClick={() => removeFromWishlist(product.id)}
                                                className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-white text-gray-600 hover:text-red-500 rounded-full p-2 shadow-md transition-all duration-200"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                title="Eliminar producto"
                                            >
                                                <X className="h-4 w-4" />
                                            </motion.button>

                                            {/* Imagen del producto */}
                                            <Link href={`/products/${product.id}`} className="relative aspect-square bg-gray-100 overflow-hidden block">
                                                <ProductImage
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                            </Link>

                                            {/* Información del producto */}
                                            <div className="p-6 flex-1 flex flex-col">
                                                <Link href={`/products/${product.id}`} className="mb-2 block">
                                                    <h3 className="text-xl font-bold text-[#505A4A] hover:text-[#414A3C] transition-colors line-clamp-1">
                                                        {product.name}
                                                    </h3>
                                                </Link>

                                                <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                                                    {product.description}
                                                </p>

                                                <div className="mt-auto">
                                                    {/* Precio */}
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className="text-2xl font-bold text-[#505A4A]">€{product.price.toFixed(2)}</span>
                                                        <Badge
                                                            variant="secondary"
                                                            className={`${product.active ? 'bg-[#505A4A]/10 text-[#505A4A]' : 'bg-red-100 text-red-800'} font-semibold`}
                                                        >
                                                            {product.active ? 'En stock' : 'No disponible'}
                                                        </Badge>
                                                    </div>

                                                    {/* Botones */}
                                                    <div className="flex flex-col gap-2">
                                                        <Button
                                                            onClick={() => addToCart(product)}
                                                            className="w-full bg-[#505A4A] hover:bg-[#414A3C] text-white font-bold"
                                                            disabled={!product.active}
                                                        >
                                                            <ShoppingBag className="h-4 w-4 mr-2" />
                                                            Agregar al Carrito
                                                        </Button>
                                                        <Link href={`/products/${product.id}`} className="w-full">
                                                            <Button
                                                                variant="outline"
                                                                className="w-full border-[#505A4A] text-[#505A4A] hover:bg-[#505A4A] hover:text-white"
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
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>

                    {/* Footer Actions */}
                    <motion.div variants={itemVariants} className="mt-12 text-center">
                        <Link href="/products">
                            <Button variant="outline" className="border-[#505A4A] text-[#505A4A] hover:bg-[#505A4A] hover:text-white font-bold px-8 py-3 text-lg">
                                <ArrowLeft className="h-5 w-5 mr-2" />
                                Seguir Explorando
                            </Button>
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}