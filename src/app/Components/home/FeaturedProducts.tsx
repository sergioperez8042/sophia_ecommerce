import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

interface FeaturedProductsProps {
    products: any[];
    isLoading: boolean;
}

export default function FeaturedProducts({ products, isLoading }: FeaturedProductsProps) {
    const [wishlistItems, setWishlistItems] = useState<string[]>([]);

    // Cargar favoritos del localStorage al montar el componente
    useEffect(() => {
        const savedWishlist = localStorage.getItem('sophia_wishlist');
        if (savedWishlist) {
            const wishlistProducts = JSON.parse(savedWishlist);
            setWishlistItems(wishlistProducts.map((item: any) => item.id));
        }
    }, []);

    const toggleWishlist = (product: any, e: any) => {
        e.preventDefault();
        e.stopPropagation();

        const savedWishlist = localStorage.getItem('sophia_wishlist');
        const currentWishlist = savedWishlist ? JSON.parse(savedWishlist) : [];

        const isInWishlist = wishlistItems.includes(product.id);

        if (isInWishlist) {
            // Remover de favoritos
            const updatedWishlist = currentWishlist.filter((item: any) => item.id !== product.id);
            const updatedWishlistIds = wishlistItems.filter(id => id !== product.id);

            localStorage.setItem('sophia_wishlist', JSON.stringify(updatedWishlist));
            setWishlistItems(updatedWishlistIds);

            // Disparar evento personalizado para notificar cambios
            window.dispatchEvent(new CustomEvent('wishlistChanged'));
        } else {
            // Agregar a favoritos
            const updatedWishlist = [...currentWishlist, product];
            const updatedWishlistIds = [...wishlistItems, product.id];

            localStorage.setItem('sophia_wishlist', JSON.stringify(updatedWishlist));
            setWishlistItems(updatedWishlistIds);

            // Disparar evento personalizado para notificar cambios
            window.dispatchEvent(new CustomEvent('wishlistChanged'));
        }
    };

    const addToCart = (product: any) => {
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
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <Skeleton className="h-8 w-64 mx-auto mb-4" />
                        <Skeleton className="h-6 w-96 mx-auto" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Array(6).fill(0).map((_, i) => (
                            <Card key={i} className="product-card">
                                <Skeleton className="h-64 w-full rounded-t-lg" />
                                <CardContent className="p-6">
                                    <Skeleton className="h-6 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-full mb-4" />
                                    <Skeleton className="h-8 w-24" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Productos destacados
                    </h2>
                    <p className="text-xl text-gray-800 max-w-2xl mx-auto">
                        Descubre nuestra selección de productos más populares,
                        elaborados con los mejores ingredientes naturales
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map((product, index) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                        >
                            <Card className="product-card group hover:shadow-xl transition-all duration-300 overflow-hidden">
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

                                </div>

                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge variant="outline" className="text-[#505A4A] border-[#505A4A]/30 text-xs">
                                            {product.category_name || 'Sin categoría'}
                                        </Badge>

                                        {/* Botón de favoritos al lado del badge */}
                                        <button
                                            onClick={(e) => {
                                                toggleWishlist(product, e);
                                            }}
                                            className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200 group/heart border border-gray-200"
                                            title={wishlistItems.includes(product.id) ? 'Remover de favoritos' : 'Agregar a favoritos'}
                                        >
                                            <Heart className={`w-4 h-4 transition-colors duration-200 ${wishlistItems.includes(product.id)
                                                ? 'text-[#505A4A] fill-[#505A4A]'
                                                : 'text-gray-500 hover:text-[#505A4A] group-hover/heart:scale-110'
                                                }`} />
                                        </button>
                                    </div>                                    <Link href={`/product?id=${product.id}`}>
                                        <h3 className="font-semibold text-lg text-gray-900 mb-2 hover:text-[#505A4A] transition-colors">
                                            {product.name}
                                        </h3>
                                    </Link>

                                    <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                                        {product.description}
                                    </p>

                                    <div className="flex items-center gap-1 mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-[#B8941F] text-[#B8941F]" />
                                        ))}
                                        <span className="text-sm text-gray-600 ml-1">(24)</span>
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
                                            onClick={() => addToCart(product)}
                                            className="bg-[#505A4A] hover:bg-[#414A3C] text-white"
                                        >
                                            <ShoppingBag className="w-4 h-4 mr-2" />
                                            Añadir
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-center mt-12"
                >
                    <Link href="/products">
                        <Button size="lg" variant="outline" className="border-[#505A4A] text-[#505A4A] hover:bg-[#505A4A] hover:text-white">
                            Ver todos los productos
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}