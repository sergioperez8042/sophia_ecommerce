import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import ProductImage from "@/components/ui/product-image";

interface CategoryShowcaseProps {
    categories: any[];
    isLoading: boolean;
}

export default function CategoryShowcase({ categories, isLoading }: CategoryShowcaseProps) {
    if (isLoading) {
        return (
            <section className="py-16 bg-gradient-to-b from-[#F5F1E8] to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <Skeleton className="h-8 w-48 mx-auto mb-4" />
                        <Skeleton className="h-6 w-80 mx-auto" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array(4).fill(0).map((_, i) => (
                            <Card key={i} className="product-card">
                                <Skeleton className="h-48 w-full rounded-t-lg" />
                                <CardContent className="p-4">
                                    <Skeleton className="h-6 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-16 bg-gradient-to-b from-[#F5F1E8] to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Explora por categorías
                    </h2>
                    <p className="text-xl text-gray-800">
                        Encuentra productos específicos para cada necesidad de tu piel
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((category, index) => (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                        >
                            <Link href={`/products?category=${category.slug}`}>
                                <Card className="product-card group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden">
                                    <div className="relative overflow-hidden">
                                        <div className="relative w-full h-48 bg-[#F5F1E8]">
                                            <ProductImage
                                                src={category.image_url || category.image}
                                                alt={category.name}
                                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                        </div>
                                        {(category.image_url || category.image) && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent group-hover:from-black/50 transition-all duration-300"></div>
                                        )}
                                        <ArrowRight className={`absolute top-4 right-4 w-5 h-5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 ${(category.image_url || category.image) ? 'text-white' : 'text-[#505A4A]'}`} />
                                    </div>

                                    <CardContent className="p-6">
                                        <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-[#505A4A] transition-colors">
                                            {category.name}
                                        </h3>
                                        <p className="text-gray-700 text-sm">
                                            {category.description || 'Descubre nuestra selección de productos naturales'}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}