"use client";

import { useState } from 'react';
import { Heart, Star, ShoppingBag, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Breadcrumb from "@/components/ui/breadcrumb";

// Datos simulados de productos favoritos
const initialWishlistItems = [
  {
    id: "1",
    name: "Crema Hidratante Natural",
    description: "Hidratación profunda con aloe vera y aceite de jojoba para una piel suave y radiante",
    price: 25.99,
    originalPrice: 32.99,
    rating: 4.8,
    reviews: 124,
    image: "/product1.png",
    category: "Cuidado Facial",
    brand: "Sophia Natural",
    inStock: true
  },
  {
    id: "2",
    name: "Serum Vitamina C",
    description: "Serum antioxidante para iluminar y rejuvenecer tu piel",
    price: 35.99,
    originalPrice: 45.99,
    rating: 4.9,
    reviews: 89,
    image: "/product2.png",
    category: "Tratamiento",
    brand: "Sophia Natural",
    inStock: true
  },
  {
    id: "3",
    name: "Mascarilla Purificante",
    description: "Limpieza profunda con arcilla y extractos naturales",
    price: 18.99,
    originalPrice: 24.99,
    rating: 4.7,
    reviews: 156,
    image: "/product3.png",
    category: "Mascarillas",
    brand: "Sophia Natural",
    inStock: true
  }
];

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState(initialWishlistItems);

  const removeFromWishlist = (id: string) => {
    setWishlistItems(wishlistItems.filter(item => item.id !== id));
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
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Breadcrumb 
              items={[
                { label: 'Lista de Favoritos' }
              ]}
            />
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="max-w-md mx-auto">
              <Heart className="h-24 w-24 text-[#4A6741]/40 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Tu lista de favoritos está vacía</h2>
              <p className="text-gray-700 mb-8 text-lg font-medium">Explora nuestros productos y guarda tus favoritos aquí para encontrarlos fácilmente.</p>
              <Link href="/products">
                <Button className="bg-[#4A6741] hover:bg-[#3F5D4C] text-white font-bold px-8 py-3 text-lg shadow-lg">
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb 
            items={[
              { label: 'Lista de Favoritos' }
            ]}
          />
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
                  <Badge variant="secondary" className="bg-[#4A6741]/10 text-[#4A6741] font-bold text-lg px-4 py-2">
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
                  <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/95 backdrop-blur-sm">
                    <CardContent className="p-0 relative">
                      {/* Botón eliminar */}
                      <motion.button
                        onClick={() => removeFromWishlist(product.id)}
                        className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-white text-gray-600 hover:text-red-500 rounded-full p-2 shadow-md transition-all duration-200"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="h-4 w-4" />
                      </motion.button>

                      {/* Imagen del producto */}
                      <motion.div 
                        className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Link href={`/products/${product.id}`}>
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </Link>
                        
                        {/* Badge de categoría */}
                        <div className="absolute top-3 left-3">
                          <Badge variant="secondary" className="bg-[#4A6741]/90 text-white font-semibold">
                            {product.category}
                          </Badge>
                        </div>
                      </motion.div>

                      {/* Información del producto */}
                      <div className="p-6">
                        <Link href={`/products/${product.id}`}>
                          <motion.h3 
                            className="text-xl font-bold text-[#4A6741] mb-2 hover:text-[#3F5D4C] transition-colors cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                          >
                            {product.name}
                          </motion.h3>
                        </Link>
                        
                        <p className="text-gray-700 font-medium mb-4 line-clamp-2">
                          {product.description}
                        </p>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(product.rating)
                                    ? 'text-yellow-500 fill-yellow-400'
                                    : 'text-gray-300 fill-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-bold text-gray-900">{product.rating}</span>
                          <span className="text-sm text-gray-600 font-medium">({product.reviews} reseñas)</span>
                        </div>

                        {/* Precio */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-[#4A6741]">${product.price}</span>
                            {product.originalPrice > product.price && (
                              <span className="text-lg text-gray-500 line-through">${product.originalPrice}</span>
                            )}
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={`${product.inStock 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                            } font-semibold`}
                          >
                            {product.inStock ? 'En stock' : 'Agotado'}
                          </Badge>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex gap-2">
                          <Link href={`/products/${product.id}`} className="flex-1">
                            <Button 
                              className="w-full bg-[#4A6741] hover:bg-[#3F5D4C] text-white font-bold shadow-md"
                              disabled={!product.inStock}
                            >
                              <ShoppingBag className="h-4 w-4 mr-2" />
                              {product.inStock ? 'Ver Producto' : 'No Disponible'}
                            </Button>
                          </Link>
                          
                          <motion.button
                            onClick={() => removeFromWishlist(product.id)}
                            className="p-3 border-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 rounded-md transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title="Quitar de favoritos"
                          >
                            <Heart className="h-4 w-4 fill-current" />
                          </motion.button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Botones de acción */}
          <motion.div 
            variants={itemVariants}
            className="mt-12 text-center"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button 
                  variant="outline" 
                  className="border-[#4A6741] text-[#4A6741] hover:bg-[#4A6741] hover:text-white font-bold px-8 py-3 text-lg"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Seguir Explorando
                </Button>
              </Link>
              
              <Link href="/cart">
                <Button className="bg-[#4A6741] hover:bg-[#3F5D4C] text-white font-bold px-8 py-3 text-lg shadow-lg">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Ver Carrito
                </Button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}