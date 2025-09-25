import React from "react";
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
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
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

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="absolute top-4 right-4 bg-white/80 hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100"
                                    >
                                        <Heart className="w-4 h-4 text-gray-600" />
                                    </Button>
                                </div>

                                <CardContent className="p-6">
                                    <div className="mb-2">
                                        <Badge variant="outline" className="text-[#87A96B] border-[#87A96B]/30 text-xs">
                                            {product.category_name || 'Sin categoría'}
                                        </Badge>
                                    </div>

                                    <Link href={`/product?id=${product.id}`}>
                                        <h3 className="font-semibold text-lg text-gray-900 mb-2 hover:text-[#87A96B] transition-colors">
                                            {product.name}
                                        </h3>
                                    </Link>

                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                        {product.description}
                                    </p>

                                    <div className="flex items-center gap-1 mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                                        ))}
                                        <span className="text-sm text-gray-500 ml-1">(24)</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold text-gray-900">
                                                €{product.price.toFixed(2)}
                                            </span>
                                            {product.compare_price && product.compare_price > product.price && (
                                                <span className="text-lg text-gray-500 line-through">
                                                    €{product.compare_price.toFixed(2)}
                                                </span>
                                            )}
                                        </div>

                                        <Button
                                            onClick={() => addToCart(product)}
                                            className="bg-[#87A96B] hover:bg-[#6B8A78] text-white"
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
                        <Button size="lg" variant="outline" className="border-[#87A96B] text-[#87A96B] hover:bg-[#87A96B] hover:text-white">
                            Ver todos los productos
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}