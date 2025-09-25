import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, ShoppingBag, Leaf } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

interface ProductGridProps {
    products: any[];
    isLoading: boolean;
    viewMode?: string;
}

export default function ProductGrid({ products, isLoading, viewMode = "grid" }: ProductGridProps) {
    const addToCart = (product: any, e: any) => {
        e.preventDefault();
        e.stopPropagation();

        const savedCart = localStorage.getItem('sophia_cart');
        const currentCart = savedCart ? JSON.parse(savedCart) : [];

        const existingItem = currentCart.find((item: any) => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            currentCart.push({ ...product, quantity: 1 });
        }

        localStorage.setItem('sophia_cart', JSON.stringify(currentCart));
        window.dispatchEvent(new Event('cartUpdate'));
    };

    if (isLoading) {
        return (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                {Array(8).fill(0).map((_, i) => (
                    <Card key={i} className="product-card">
                        {viewMode === 'grid' ? (
                            <>
                                <Skeleton className="h-64 w-full rounded-t-lg" />
                                <CardContent className="p-6">
                                    <Skeleton className="h-6 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-full mb-4" />
                                    <Skeleton className="h-8 w-24" />
                                </CardContent>
                            </>
                        ) : (
                            <div className="flex">
                                <Skeleton className="h-32 w-32 rounded-l-lg" />
                                <CardContent className="p-4 flex-1">
                                    <Skeleton className="h-6 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-full mb-2" />
                                    <Skeleton className="h-4 w-2/3 mb-4" />
                                    <Skeleton className="h-8 w-24" />
                                </CardContent>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
            >
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <Leaf className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No se encontraron productos
                </h3>
                <p className="text-gray-800 mb-6">
                    Intenta ajustar tus filtros o buscar con otros términos
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Limpiar filtros
                </Button>
            </motion.div>
        );
    }

    const GridView = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
                {products.map((product, index) => (
                    <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                        <Link href={`/product?id=${product.id}`}>
                            <Card className="product-card group hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer">
                                <div className="relative overflow-hidden">
                                    <Image
                                        src={product.image_url || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop'}
                                        alt={product.name}
                                        width={400}
                                        height={300}
                                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                                    />

                                    {product.compare_price && product.compare_price > product.price && (
                                        <Badge className="absolute top-4 left-4 bg-red-500 text-white">
                                            -{Math.round(((product.compare_price - product.price) / product.compare_price) * 100)}%
                                        </Badge>
                                    )}

                                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="bg-white/90 hover:bg-white transition-all duration-200"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                        >
                                            <Heart className="w-4 h-4 text-gray-700" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="bg-white/90 hover:bg-white transition-all duration-200"
                                            onClick={(e) => addToCart(product, e)}
                                        >
                                            <ShoppingBag className="w-4 h-4 text-gray-700" />
                                        </Button>
                                    </div>

                                    {product.stock <= 5 && product.stock > 0 && (
                                        <Badge className="absolute bottom-4 left-4 bg-orange-500 text-white">
                                            ¡Últimas {product.stock} unidades!
                                        </Badge>
                                    )}

                                    {product.stock === 0 && (
                                        <Badge className="absolute bottom-4 left-4 bg-gray-500 text-white">
                                            Agotado
                                        </Badge>
                                    )}
                                </div>

                                <CardContent className="p-6">
                                    <div className="mb-2">
                                        <Badge variant="outline" className="text-[#4A6741] border-[#4A6741]/30 text-xs">
                                            {product.category_name || 'Sin categoría'}
                                        </Badge>
                                    </div>

                                    <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-[#4A6741] transition-colors line-clamp-2">
                                        {product.name}
                                    </h3>

                                    <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                                        {product.description}
                                    </p>

                                    <div className="flex items-center gap-1 mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                                        ))}
                                        <span className="text-sm text-gray-700 ml-1">(12)</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold text-gray-900">
                                                €{product.price.toFixed(2)}
                                            </span>
                                            {product.compare_price && product.compare_price > product.price && (
                                                <span className="text-lg text-gray-600 line-through">
                                                    €{product.compare_price.toFixed(2)}
                                                </span>
                                            )}
                                        </div>

                                        <Button
                                            onClick={(e) => addToCart(product, e)}
                                            className="bg-[#4A6741] hover:bg-[#3F5D4C] text-white"
                                            disabled={product.stock === 0}
                                        >
                                            <ShoppingBag className="w-4 h-4 mr-2" />
                                            Añadir
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );

    const ListView = () => (
        <div className="space-y-6">
            <AnimatePresence>
                {products.map((product, index) => (
                    <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                        <Link href={`/product?id=${product.id}`}>
                            <Card className="product-card group hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer">
                                <div className="flex">
                                    <div className="relative w-48 h-32 overflow-hidden">
                                        <Image
                                            src={product.image_url || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop'}
                                            alt={product.name}
                                            width={192}
                                            height={128}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />

                                        {product.compare_price && product.compare_price > product.price && (
                                            <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
                                                -{Math.round(((product.compare_price - product.price) / product.compare_price) * 100)}%
                                            </Badge>
                                        )}
                                    </div>

                                    <CardContent className="p-6 flex-1 flex justify-between">
                                        <div className="flex-1">
                                            <div className="mb-2">
                                                <Badge variant="outline" className="text-[#4A6741] border-[#4A6741]/30 text-xs">
                                                    {product.category_name || 'Sin categoría'}
                                                </Badge>
                                            </div>

                                            <h3 className="font-semibold text-xl text-gray-900 mb-2 group-hover:text-[#4A6741] transition-colors">
                                                {product.name}
                                            </h3>

                                            <p className="text-gray-700 mb-4 line-clamp-2">
                                                {product.description}
                                            </p>

                                            <div className="flex items-center gap-1 mb-4">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                                                ))}
                                                <span className="text-sm text-gray-700 ml-1">(12 reseñas)</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end justify-between ml-6">
                                            <div className="text-right mb-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-3xl font-bold text-gray-900">
                                                        €{product.price.toFixed(2)}
                                                    </span>
                                                    {product.compare_price && product.compare_price > product.price && (
                                                        <span className="text-xl text-gray-600 line-through">
                                                            €{product.compare_price.toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>

                                                {product.stock <= 5 && product.stock > 0 && (
                                                    <Badge className="bg-orange-500 text-white text-xs">
                                                        ¡Solo quedan {product.stock}!
                                                    </Badge>
                                                )}

                                                {product.stock === 0 && (
                                                    <Badge className="bg-gray-500 text-white">
                                                        Agotado
                                                    </Badge>
                                                )}
                                            </div>

                                            <Button
                                                onClick={(e) => addToCart(product, e)}
                                                className="bg-[#4A6741] hover:bg-[#3F5D4C] text-white"
                                                disabled={product.stock === 0}
                                            >
                                                <ShoppingBag className="w-4 h-4 mr-2" />
                                                Añadir al carrito
                                            </Button>
                                        </div>
                                    </CardContent>
                                </div>
                            </Card>
                        </Link>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );

    return viewMode === 'grid' ? <GridView /> : <ListView />;
}