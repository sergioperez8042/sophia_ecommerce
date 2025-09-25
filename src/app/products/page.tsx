"use client";

import { useState } from 'react';
import { Search, Grid, List, Star, Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { motion } from "framer-motion";

const products = [
  {
    id: 1,
    name: "Crema Hidratante Natural",
    description: "Hidratación profunda con aloe vera y aceite de jojoba",
    price: 25.99,
    originalPrice: 32.99,
    rating: 4.8,
    reviews: 124,
    image: "/product1.png",
    category: "Cuidado Facial",
    isNew: false,
    isBestseller: true,
    badges: ["Bestseller", "Natural"]
  },
  {
    id: 2,
    name: "Serum Vitamina C",
    description: "Ilumina y protege tu piel con antioxidantes naturales",
    price: 42.99,
    originalPrice: null,
    rating: 4.9,
    reviews: 89,
    image: "/product2.png",
    category: "Cuidado Facial",
    isNew: true,
    isBestseller: false,
    badges: ["Nuevo", "Vitaminas"]
  },
  {
    id: 3,
    name: "Jabón de Lavanda",
    description: "Jabón artesanal con aceites esenciales de lavanda",
    price: 12.99,
    originalPrice: null,
    rating: 4.7,
    reviews: 203,
    image: "/product3.png",
    category: "Cuerpo",
    isNew: false,
    isBestseller: true,
    badges: ["Artesanal", "Relajante"]
  },
  {
    id: 4,
    name: "Aceite Corporal Nutritivo",
    description: "Mezcla de aceites naturales para nutrir la piel",
    price: 35.99,
    originalPrice: 44.99,
    rating: 4.6,
    reviews: 67,
    image: "/product4.png",
    category: "Cuerpo",
    isNew: false,
    isBestseller: false,
    badges: ["Nutritivo", "Natural"]
  },
  {
    id: 5,
    name: "Mascarilla Purificante",
    description: "Arcilla verde y té verde para purificar los poros",
    price: 18.99,
    originalPrice: null,
    rating: 4.8,
    reviews: 156,
    image: "/product5.png",
    category: "Cuidado Facial",
    isNew: true,
    isBestseller: false,
    badges: ["Nuevo", "Purificante"]
  },
  {
    id: 6,
    name: "Bálsamo Labial Natural",
    description: "Protección y nutrición para labios secos",
    price: 8.99,
    originalPrice: null,
    rating: 4.9,
    reviews: 284,
    image: "/product1.png",
    category: "Labios",
    isNew: false,
    isBestseller: true,
    badges: ["Bestseller", "Protección"]
  }
];export default function ProductsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [viewMode, setViewMode] = useState('grid');

    const categories = ['all', 'Cuidado Facial', 'Cuerpo', 'Labios'];

    const filteredProducts = products
        .filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (selectedCategory === 'all' || product.category === selectedCategory)
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'rating':
                    return b.rating - a.rating;
                default:
                    return a.name.localeCompare(b.name);
            }
        });

    // Debug: log de las rutas de imágenes
    console.log('Product images:', filteredProducts.map(p => ({ name: p.name, image: p.image })));

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-white">
            {/* Header */}
            <motion.section
                className="py-16 bg-white/80 backdrop-blur-sm relative overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
            >
                {/* Animated background elements */}
                <motion.div
                    className="absolute top-10 left-20 w-24 h-24 rounded-full bg-[#87A96B]/10 blur-2xl"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="absolute bottom-10 right-20 w-32 h-32 rounded-full bg-[#D4AF37]/10 blur-2xl"
                    animate={{
                        scale: [1.3, 1, 1.3],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                    }}
                />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        className="text-center"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <motion.h1
                            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            Nuestros Productos
                        </motion.h1>
                        <motion.p
                            className="text-xl text-gray-600 max-w-3xl mx-auto"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                        >
                            Descubre nuestra selección completa de cosméticos naturales,
                            elaborados con los mejores ingredientes orgánicos
                        </motion.p>
                    </motion.div>
                </div>
            </motion.section>

            {/* Filters */}
            <motion.section
                className="py-8 bg-white/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        {/* Search */}
                        <motion.div
                            className="relative flex-1 max-w-md"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                type="text"
                                placeholder="Buscar productos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full focus:ring-2 focus:ring-[#87A96B] transition-all duration-200"
                            />
                        </motion.div>

                        {/* Filters */}
                        <motion.div
                            className="flex gap-4 items-center"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 1 }}
                        >
                            <motion.select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#87A96B] transition-all duration-200"
                                whileHover={{ scale: 1.02 }}
                                whileFocus={{ scale: 1.02 }}
                            >
                                <option value="all">Todas las categorías</option>
                                {categories.slice(1).map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </motion.select>

                            <motion.select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#87A96B] transition-all duration-200"
                                whileHover={{ scale: 1.02 }}
                                whileFocus={{ scale: 1.02 }}
                            >
                                <option value="name">Ordenar por nombre</option>
                                <option value="price-low">Precio: menor a mayor</option>
                                <option value="price-high">Precio: mayor a menor</option>
                                <option value="rating">Mejor valorados</option>
                            </motion.select>

                            <div className="flex gap-2">
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Button
                                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setViewMode('grid')}
                                        className={viewMode === 'grid' ? 'bg-[#87A96B] hover:bg-[#6B8A78]' : ''}
                                    >
                                        <Grid className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Button
                                        variant={viewMode === 'list' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setViewMode('list')}
                                        className={viewMode === 'list' ? 'bg-[#87A96B] hover:bg-[#6B8A78]' : ''}
                                    >
                                        <List className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* Products Grid */}
            <motion.section
                className="py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.2 }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className={`grid gap-6 ${viewMode === 'grid'
                                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                                : 'grid-cols-1 lg:grid-cols-2'
                            }`}
                        layout
                    >
                        {filteredProducts.map((product, index) => (
                            <motion.div
                                key={product.id}
                                layout
                                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{
                                    duration: 0.6,
                                    delay: index * 0.1,
                                    type: "spring",
                                    stiffness: 100,
                                    damping: 15
                                }}
                                whileHover={{
                                    y: -10,
                                    scale: 1.02,
                                    transition: { duration: 0.2 }
                                }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Card className="product-card border-0 overflow-hidden group cursor-pointer h-full">
                                    {viewMode === 'grid' ? (
                                        <>
                                            <div className="relative aspect-square overflow-hidden">
                                                <motion.div
                                                    whileHover={{ scale: 1.1 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="w-full h-full"
                                                >
                                                    <Image
                                                        src={product.image}
                                                        alt={product.name}
                                                        width={400}
                                                        height={400}
                                                        className="object-cover w-full h-full"
                                                        priority={index < 3}
                                                    />
                                                </motion.div>

                                                {/* Animated badges */}
                                                {product.originalPrice && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ duration: 0.3, delay: index * 0.1 + 0.5 }}
                                                        className="absolute top-3 left-3"
                                                    >
                                                        <Badge className="bg-red-500 text-white">
                                                            -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                                                        </Badge>
                                                    </motion.div>
                                                )}

                                                {product.isNew && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ duration: 0.3, delay: index * 0.1 + 0.6 }}
                                                        className="absolute top-3 right-3"
                                                    >
                                                        <Badge className="bg-green-500 text-white">
                                                            Nuevo
                                                        </Badge>
                                                    </motion.div>
                                                )}

                                                {product.isBestseller && !product.isNew && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ duration: 0.3, delay: index * 0.1 + 0.6 }}
                                                        className="absolute top-3 right-3"
                                                    >
                                                        <Badge className="bg-[#87A96B] text-white">
                                                            Bestseller
                                                        </Badge>
                                                    </motion.div>
                                                )}

                                                {/* Hover overlay with animated buttons */}
                                                <motion.div
                                                    className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100"
                                                    initial={{ opacity: 0 }}
                                                    whileHover={{ opacity: 1 }}
                                                >
                                                    <div className="flex gap-2">
                                                        <motion.div
                                                            initial={{ scale: 0, rotate: -180 }}
                                                            whileHover={{ scale: 1, rotate: 0 }}
                                                            transition={{ duration: 0.3 }}
                                                        >
                                                            <Button size="sm" className="bg-white/90 text-gray-900 hover:bg-white">
                                                                <motion.div
                                                                    animate={{
                                                                        scale: [1, 1.2, 1],
                                                                        rotate: [0, 360, 0]
                                                                    }}
                                                                    transition={{
                                                                        duration: 2,
                                                                        repeat: Infinity,
                                                                        ease: "easeInOut"
                                                                    }}
                                                                >
                                                                    <Heart className="w-4 h-4" />
                                                                </motion.div>
                                                            </Button>
                                                        </motion.div>
                                                        <motion.div
                                                            initial={{ scale: 0, rotate: 180 }}
                                                            whileHover={{ scale: 1, rotate: 0 }}
                                                            transition={{ duration: 0.3, delay: 0.1 }}
                                                        >
                                                            <Button size="sm" className="bg-[#87A96B] hover:bg-[#6B8A78] text-white">
                                                                <ShoppingBag className="w-4 h-4" />
                                                            </Button>
                                                        </motion.div>
                                                    </div>
                                                </motion.div>
                                            </div>

                                            <CardContent className="p-6">
                                                <motion.div
                                                    className="flex flex-wrap gap-1 mb-3"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.4, delay: index * 0.1 + 0.7 }}
                                                >
                                                    {product.badges.map((badge, badgeIndex) => (
                                                        <motion.div
                                                            key={badgeIndex}
                                                            initial={{ opacity: 0, scale: 0 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ duration: 0.2, delay: index * 0.1 + 0.8 + badgeIndex * 0.1 }}
                                                        >
                                                            <Badge variant="secondary" className="text-xs">
                                                                {badge}
                                                            </Badge>
                                                        </motion.div>
                                                    ))}
                                                </motion.div>

                                                <motion.h3
                                                    className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#87A96B] transition-colors"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.4, delay: index * 0.1 + 0.8 }}
                                                >
                                                    {product.name}
                                                </motion.h3>

                                                <motion.p
                                                    className="text-gray-600 text-sm mb-4 line-clamp-2"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.4, delay: index * 0.1 + 0.9 }}
                                                >
                                                    {product.description}
                                                </motion.p>

                                                <motion.div
                                                    className="flex items-center justify-between mb-4"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.4, delay: index * 0.1 + 1 }}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <motion.span
                                                            className="text-xl font-bold text-[#87A96B]"
                                                            whileHover={{ scale: 1.1 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            €{product.price}
                                                        </motion.span>
                                                        {product.originalPrice && (
                                                            <motion.span
                                                                className="text-sm text-gray-500 line-through"
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                transition={{ duration: 0.3, delay: index * 0.1 + 1.1 }}
                                                            >
                                                                €{product.originalPrice}
                                                            </motion.span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <motion.div
                                                            animate={{ rotate: [0, 360] }}
                                                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                                        >
                                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                        </motion.div>
                                                        <span className="text-sm text-gray-600">
                                                            {product.rating} ({product.reviews})
                                                        </span>
                                                    </div>
                                                </motion.div>

                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.4, delay: index * 0.1 + 1.1 }}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <Button
                                                        className="w-full bg-[#87A96B] hover:bg-[#6B8A78] text-white"
                                                        size="sm"
                                                    >
                                                        <motion.div
                                                            animate={{ x: [0, 5, 0] }}
                                                            transition={{ duration: 1.5, repeat: Infinity }}
                                                        >
                                                            <ShoppingBag className="w-4 h-4 mr-2" />
                                                        </motion.div>
                                                        Agregar al carrito
                                                    </Button>
                                                </motion.div>
                                            </CardContent>
                                        </>
                                    ) : (
                                        /* List view with animations */
                                        <motion.div
                                            className="flex"
                                            initial={{ opacity: 0, x: -50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.6, delay: index * 0.1 }}
                                        >
                                            <div className="relative w-48 h-48 flex-shrink-0 overflow-hidden rounded-lg">
                                                <motion.div
                                                    whileHover={{ scale: 1.05 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="w-full h-full"
                                                >
                                                    <Image
                                                        src={product.image}
                                                        alt={product.name}
                                                        width={192}
                                                        height={192}
                                                        className="object-cover w-full h-full"
                                                        priority={index < 3}
                                                    />
                                                </motion.div>

                                                {product.originalPrice && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ duration: 0.3, delay: index * 0.1 + 0.5 }}
                                                        className="absolute top-3 left-3"
                                                    >
                                                        <Badge className="bg-red-500 text-white">
                                                            -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                                                        </Badge>
                                                    </motion.div>
                                                )}
                                            </div>

                                            <CardContent className="p-6 flex-1 flex flex-col">
                                                <motion.div
                                                    className="flex flex-wrap gap-1 mb-3"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.4, delay: index * 0.1 + 0.3 }}
                                                >
                                                    {product.badges.map((badge, badgeIndex) => (
                                                        <Badge key={badgeIndex} variant="secondary" className="text-xs">
                                                            {badge}
                                                        </Badge>
                                                    ))}
                                                    {product.isNew && (
                                                        <Badge className="bg-green-500 text-white text-xs">Nuevo</Badge>
                                                    )}
                                                    {product.isBestseller && (
                                                        <Badge className="bg-[#87A96B] text-white text-xs">Bestseller</Badge>
                                                    )}
                                                </motion.div>

                                                <motion.h3
                                                    className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-[#87A96B] transition-colors"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.4, delay: index * 0.1 + 0.4 }}
                                                >
                                                    {product.name}
                                                </motion.h3>

                                                <motion.p
                                                    className="text-gray-600 mb-4 flex-1"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.4, delay: index * 0.1 + 0.5 }}
                                                >
                                                    {product.description}
                                                </motion.p>

                                                <motion.div
                                                    className="flex items-center justify-between"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.4, delay: index * 0.1 + 0.6 }}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <motion.span
                                                                className="text-2xl font-bold text-[#87A96B]"
                                                                whileHover={{ scale: 1.1 }}
                                                            >
                                                                €{product.price}
                                                            </motion.span>
                                                            {product.originalPrice && (
                                                                <span className="text-lg text-gray-500 line-through">
                                                                    €{product.originalPrice}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-1">
                                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                            <span className="text-sm text-gray-600">
                                                                {product.rating} ({product.reviews} reseñas)
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <motion.div
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            <Button variant="outline" size="sm">
                                                                <Heart className="w-4 h-4" />
                                                            </Button>
                                                        </motion.div>
                                                        <motion.div
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            <Button className="bg-[#87A96B] hover:bg-[#6B8A78] text-white" size="sm">
                                                                <ShoppingBag className="w-4 h-4 mr-2" />
                                                                Agregar al carrito
                                                            </Button>
                                                        </motion.div>
                                                    </div>
                                                </motion.div>
                                            </CardContent>
                                        </motion.div>
                                    )}
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>

                    {filteredProducts.length === 0 && (
                        <motion.div
                            className="text-center py-12"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6 }}
                        >
                            <motion.div
                                className="text-6xl mb-4"
                                animate={{
                                    rotate: [0, 10, -10, 0],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                🔍
                            </motion.div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                No se encontraron productos
                            </h3>
                            <p className="text-gray-600">
                                Intenta ajustar tus filtros o términos de búsqueda
                            </p>
                        </motion.div>
                    )}
                </div>
            </motion.section>
        </div>
    );
}