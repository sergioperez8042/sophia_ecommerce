import React, { useState, useEffect } from "react";
import { Product, Category } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EmailInput from "@/components/ui/email-input";
import { Leaf, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import ValueProposition from "../Components/home/ValueProposition";
import FeaturedProducts from "../Components/home/FeaturedProducts";
import CategoryShowcase from "../Components/home/CategoryShowcase";


export default function HomePage() {
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [allProducts, cats] = await Promise.all([
                Product.filter({ featured: true, active: true }, '-created_date'),
                Category.list('sort_order')
            ]);

            // Tomar solo los primeros 6 productos
            const products = allProducts.slice(0, 6);
            // Tomar solo las primeras 4 categorías  
            const categories = cats.slice(0, 4);

            setFeaturedProducts(products);
            setCategories(categories);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen">
            {/* Hero Section */}
            <section className="hero-gradient py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="flex items-center gap-2 mb-6">
                                <Badge className="bg-[#4A6741]/10 text-[#4A6741] border-[#4A6741]/20">
                                    <Leaf className="w-3 h-3 mr-1" />
                                    100% Natural
                                </Badge>
                            </div>

                            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
                                Belleza natural
                                <span className="block text-[#4A6741]">para tu piel</span>
                            </h1>

                            <p className="text-xl text-gray-800 leading-relaxed mb-8 max-w-xl">
                                Descubre nuestra colección de cosméticos artesanales,
                                elaborados con ingredientes orgánicos seleccionados para
                                nutrir y cuidar tu piel de forma natural.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/products">
                                    <Button size="lg" className="bg-[#4A6741] hover:bg-[#3F5D4C] text-white px-8 py-3 text-lg">
                                        Explorar productos
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </Link>
                                <Link href="/about">
                                    <Button variant="outline" size="lg" className="border-[#4A6741] text-[#4A6741] hover:bg-[#4A6741] hover:text-white px-8 py-3 text-lg">
                                        Nuestra historia
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                                <Image
                                    src="https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600&h=600&fit=crop"
                                    alt="Productos naturales Sophia"
                                    width={600}
                                    height={500}
                                    className="w-full h-[500px] object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                            </div>

                            {/* Floating elements */}
                            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-[#87A96B]/20 blur-xl"></div>
                            <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-[#B8941F]/10 blur-2xl"></div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Value Proposition */}
            <ValueProposition />

            {/* Featured Products */}
            <FeaturedProducts products={featuredProducts} isLoading={isLoading} />

            {/* Category Showcase */}
            <CategoryShowcase categories={categories} isLoading={isLoading} />

            {/* Newsletter Section */}
            <section className="py-16 bg-gradient-to-r from-[#4A6741] to-[#3F5D4C]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <Sparkles className="w-12 h-12 text-white mx-auto mb-6" />
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Suscríbete a nuestro newsletter
                        </h2>
                        <p className="text-xl text-white/95 mb-8">
                            Recibe consejos de belleza natural y ofertas exclusivas
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                            <EmailInput
                                placeholder="Tu email"
                                className="flex-1 px-6 py-3 rounded-lg border-2 border-white/60 bg-white/95 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-white focus:border-white focus:bg-white transition-all duration-200 shadow-sm"
                            />
                            <Button className="bg-white text-[#4A6741] hover:bg-gray-100 px-8 py-3 font-semibold">
                                Suscribirme
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}