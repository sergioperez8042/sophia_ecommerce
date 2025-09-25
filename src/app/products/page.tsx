"use client";

import { useState, useMemo, useEffect } from 'react';
import { Star, Heart, ShoppingBag, Filter, Grid3X3, List, SlidersHorizontal, X, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Breadcrumb from "@/components/ui/breadcrumb";

// Datos simulados de productos
const allProducts = [
  {
    id: "1",
    name: "Crema Hidratante Natural",
    description: "Hidratación profunda con aloe vera y aceite de jojoba",
    price: 25.99,
    originalPrice: 32.99,
    rating: 4.8,
    reviews: 124,
    image: "/product1.png",
    category: "Cuidado Facial",
    brand: "Sophia Natural",
    inStock: true,
    isNew: false,
    isBestseller: true,
    priceRange: "20-50"
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
    inStock: true,
    isNew: true,
    isBestseller: false,
    priceRange: "20-50"
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
    inStock: true,
    isNew: false,
    isBestseller: true,
    priceRange: "0-20"
  },
  {
    id: "4",
    name: "Aceite Corporal Nutritivo",
    description: "Nutrición intensa para piel seca con aceites esenciales",
    price: 28.50,
    originalPrice: 35.00,
    rating: 4.6,
    reviews: 78,
    image: "/product4.png",
    category: "Cuidado Corporal",
    brand: "Sophia Natural",
    inStock: true,
    isNew: false,
    isBestseller: false,
    priceRange: "20-50"
  },
  {
    id: "5",
    name: "Limpiador Facial Suave",
    description: "Limpieza suave para todo tipo de piel",
    price: 15.99,
    originalPrice: 19.99,
    rating: 4.5,
    reviews: 203,
    image: "/product5.png",
    category: "Limpieza",
    brand: "Sophia Natural",
    inStock: false,
    isNew: false,
    isBestseller: false,
    priceRange: "0-20"
  },
  {
    id: "6",
    name: "Contorno de Ojos Anti-edad",
    description: "Reduce arrugas y ojeras con péptidos naturales",
    price: 42.99,
    originalPrice: 55.99,
    rating: 4.8,
    reviews: 67,
    image: "/product1.png",
    category: "Tratamiento",
    brand: "Sophia Premium",
    inStock: true,
    isNew: true,
    isBestseller: false,
    priceRange: "20-50"
  }
];

const categories = [
  { name: "Cuidado Facial", count: 1 },
  { name: "Tratamiento", count: 2 },
  { name: "Mascarillas", count: 1 },
  { name: "Cuidado Corporal", count: 1 },
  { name: "Limpieza", count: 1 }
];

const brands = [
  { name: "Sophia Natural", count: 5 },
  { name: "Sophia Premium", count: 1 }
];

const priceRanges = [
  { name: "0 - 20 €", value: "0-20", count: 2 },
  { name: "20 - 50 €", value: "20-50", count: 4 }
];

export default function ProductsPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);

  const filteredProducts = useMemo(() => {
    let filtered = allProducts;

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product => selectedCategories.includes(product.category));
    }

    if (selectedBrands.length > 0) {
      filtered = filtered.filter(product => selectedBrands.includes(product.brand));
    }

    if (selectedPriceRanges.length > 0) {
      filtered = filtered.filter(product => selectedPriceRanges.includes(product.priceRange));
    }

    if (inStockOnly) {
      filtered = filtered.filter(product => product.inStock);
    }

    // Ordenamiento
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "reviews":
        filtered.sort((a, b) => b.reviews - a.reviews);
        break;
      case "newest":
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      default:
        filtered.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0));
    }

    return filtered;
  }, [selectedCategories, selectedBrands, selectedPriceRanges, inStockOnly, sortBy]);

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedPriceRanges([]);
    setInStockOnly(false);
  };

  const activeFiltersCount = selectedCategories.length + selectedBrands.length + selectedPriceRanges.length + (inStockOnly ? 1 : 0);

  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const addToCart = async (product: any, e: any) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Adding to cart:', product);
    
    setAddingToCart(product.id);

    try {
      const savedCart = localStorage.getItem('sophia_cart');
      const currentCart = savedCart ? JSON.parse(savedCart) : [];

      const existingItem = currentCart.find((item: any) => item.id === product.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        currentCart.push({ ...product, quantity: 1 });
      }

      localStorage.setItem('sophia_cart', JSON.stringify(currentCart));
      console.log('Cart updated:', currentCart);
      
      window.dispatchEvent(new Event('cartUpdate'));
      
      // Dar feedback visual por 1 segundo
      setTimeout(() => {
        setAddingToCart(null);
      }, 1000);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      setAddingToCart(null);
    }
  };

  // Cargar favoritos del localStorage al montar el componente
  useEffect(() => {
    const savedWishlist = localStorage.getItem('sophia_wishlist');
    if (savedWishlist) {
      try {
        const wishlistProducts = JSON.parse(savedWishlist);
        // Filtrar solo objetos válidos con id
        const validProducts = wishlistProducts.filter((item: any) => 
          item && typeof item === 'object' && item.id
        );
        
        // Si había datos corruptos, limpiar el localStorage
        if (validProducts.length !== wishlistProducts.length) {
          localStorage.setItem('sophia_wishlist', JSON.stringify(validProducts));
        }
        
        setWishlistItems(validProducts.map((item: any) => item.id));
        console.log('Loaded wishlist items:', validProducts.map((item: any) => item.id));
      } catch (error) {
        console.error('Error loading wishlist:', error);
        localStorage.removeItem('sophia_wishlist');
        setWishlistItems([]);
      }
    }
  }, []);

  const toggleWishlist = (product: any, e: any) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Toggling wishlist for product:', product);

    const savedWishlist = localStorage.getItem('sophia_wishlist');
    let currentWishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
    
    // Limpiar datos corruptos - solo mantener objetos válidos
    currentWishlist = currentWishlist.filter((item: any) => 
      item && typeof item === 'object' && item.id
    );

    console.log('Cleaned current wishlist:', currentWishlist);
    console.log('Current wishlistItems state:', wishlistItems);

    const isInWishlist = wishlistItems.includes(product.id);

    console.log('Is product in wishlist?', isInWishlist);

    if (isInWishlist) {
      // Remover de favoritos
      const updatedWishlist = currentWishlist.filter((item: any) => item.id !== product.id);
      const updatedWishlistIds = wishlistItems.filter(id => id !== product.id);

      console.log('Removing from wishlist. Updated wishlist:', updatedWishlist);

      localStorage.setItem('sophia_wishlist', JSON.stringify(updatedWishlist));
      setWishlistItems(updatedWishlistIds);

      // Disparar evento personalizado para notificar cambios
      window.dispatchEvent(new CustomEvent('wishlistChanged'));
    } else {
      // Agregar a favoritos
      const updatedWishlist = [...currentWishlist, product];
      const updatedWishlistIds = [...wishlistItems, product.id];

      console.log('Adding to wishlist. Updated wishlist:', updatedWishlist);

      localStorage.setItem('sophia_wishlist', JSON.stringify(updatedWishlist));
      setWishlistItems(updatedWishlistIds);

      // Disparar evento personalizado para notificar cambios
      window.dispatchEvent(new CustomEvent('wishlistChanged'));
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: 'Productos' }
            ]}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar de filtros - Desktop */}
          <div className="hidden mt-5 lg:block w-64 flex-shrink-0">
            <Card className="sticky top-6 shadow-lg border-0 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold mt-4 text-gray-900 flex items-center">
                    <SlidersHorizontal className="h-5 w-5 mr-2 text-[#4A6741]" />
                    Filtros
                  </h2>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-[#4A6741] hover:text-[#3F5D4C] font-medium transition-colors"
                    >
                      Limpiar ({activeFiltersCount})
                    </button>
                  )}
                </div>

                {/* Filtro de Categorías */}
                <div className="border-b border-gray-200 py-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Categoría</h3>
                  <div className="space-y-2">
                    {categories.map(category => (
                      <button
                        key={category.name}
                        onClick={() => {
                          if (selectedCategories.includes(category.name)) {
                            setSelectedCategories(selectedCategories.filter(c => c !== category.name));
                          } else {
                            setSelectedCategories([...selectedCategories, category.name]);
                          }
                        }}
                        className={`w-full flex items-center justify-between text-left p-2 rounded-lg transition-colors hover:bg-[#4A6741]/10 ${selectedCategories.includes(category.name)
                          ? 'bg-[#4A6741]/10 text-[#4A6741] font-medium'
                          : 'text-gray-700 hover:text-[#4A6741]'
                          }`}
                      >
                        <span className="text-sm flex-1">
                          {category.name}
                        </span>
                        <span className="text-xs text-gray-500">({category.count})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtro de Marcas */}
                <div className="border-b border-gray-200 py-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Marca</h3>
                  <div className="space-y-2">
                    {brands.map(brand => (
                      <button
                        key={brand.name}
                        onClick={() => {
                          if (selectedBrands.includes(brand.name)) {
                            setSelectedBrands(selectedBrands.filter(b => b !== brand.name));
                          } else {
                            setSelectedBrands([...selectedBrands, brand.name]);
                          }
                        }}
                        className={`w-full flex items-center justify-between text-left p-2 rounded-lg transition-colors hover:bg-[#4A6741]/10 ${selectedBrands.includes(brand.name)
                          ? 'bg-[#4A6741]/10 text-[#4A6741] font-medium'
                          : 'text-gray-700 hover:text-[#4A6741]'
                          }`}
                      >
                        <span className="text-sm flex-1">
                          {brand.name}
                        </span>
                        <span className="text-xs text-gray-500">({brand.count})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtro de Precio */}
                <div className="border-b border-gray-200 py-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Precio</h3>
                  <div className="space-y-2">
                    {priceRanges.map(range => (
                      <button
                        key={range.value}
                        onClick={() => {
                          if (selectedPriceRanges.includes(range.value)) {
                            setSelectedPriceRanges(selectedPriceRanges.filter(r => r !== range.value));
                          } else {
                            setSelectedPriceRanges([...selectedPriceRanges, range.value]);
                          }
                        }}
                        className={`w-full flex items-center justify-between text-left p-2 rounded-lg transition-colors hover:bg-[#4A6741]/10 ${selectedPriceRanges.includes(range.value)
                          ? 'bg-[#4A6741]/10 text-[#4A6741] font-medium'
                          : 'text-gray-700 hover:text-[#4A6741]'
                          }`}
                      >
                        <span className="text-sm flex-1">
                          {range.name}
                        </span>
                        <span className="text-xs text-gray-500">({range.count})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtro de Disponibilidad */}
                <div className="py-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Disponibilidad</h3>
                  <button
                    onClick={() => setInStockOnly(!inStockOnly)}
                    className={`w-full flex items-center text-left p-2 rounded-lg transition-colors hover:bg-[#4A6741]/10 ${inStockOnly
                      ? 'bg-[#4A6741]/10 text-[#4A6741] font-medium'
                      : 'text-gray-700 hover:text-[#4A6741]'
                      }`}
                  >
                    <span className="text-sm">
                      Solo en stock
                    </span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contenido principal */}
          <div className="flex-1">
            {/* Header con controles */}
            <Card className="mb-8 mt-5 shadow-sm border-0 bg-white">
              <CardContent className="py-5 px-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-center sm:justify-between gap-4">
                  <div className="flex items-center mt-5 justify-center sm:justify-start gap-4">
                    <h1 className="text-xl font-bold text-gray-900">
                      Resultados
                    </h1>
                    <span className="text-sm text-gray-600">
                      {filteredProducts.length} productos
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMobileFilters(true)}
                      className="lg:hidden border-[#4A6741] text-[#4A6741] hover:bg-[#4A6741] hover:text-white"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                    </Button>
                  </div>

                  <div className="flex items-center justify-center sm:justify-end gap-3">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-48 border-[#4A6741] text-gray-900 bg-white hover:border-[#3F5D4C] focus:border-[#4A6741] focus:ring-[#4A6741]/20">
                        <SelectValue placeholder="Ordenar por" className="text-gray-600" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border mt-4 border-gray-200 shadow-lg">
                        <SelectItem value="featured" className="text-gray-900 hover:bg-gray-100 cursor-pointer">Destacados</SelectItem>
                        <SelectItem value="price-low" className="text-gray-900 hover:bg-gray-100 cursor-pointer">Precio: menor a mayor</SelectItem>
                        <SelectItem value="price-high" className="text-gray-900 hover:bg-gray-100 cursor-pointer">Precio: mayor a menor</SelectItem>
                        <SelectItem value="rating" className="text-gray-900 hover:bg-gray-100 cursor-pointer">Mejor valorados</SelectItem>
                        <SelectItem value="reviews" className="text-gray-900 hover:bg-gray-100 cursor-pointer">Más reseñas</SelectItem>
                        <SelectItem value="newest" className="text-gray-900 hover:bg-gray-100 cursor-pointer">Más nuevos</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className={`rounded-none ${viewMode === "grid" ? "bg-[#4A6741] text-white" : ""}`}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                        className={`rounded-none ${viewMode === "list" ? "bg-[#4A6741] text-white" : ""}`}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Filtros activos */}
                {activeFiltersCount > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                    {selectedCategories.map(category => (
                      <Badge key={category} variant="secondary" className="bg-[#4A6741]/10 text-[#4A6741] flex items-center gap-1">
                        {category}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-500"
                          onClick={() => setSelectedCategories(prev => prev.filter(c => c !== category))}
                        />
                      </Badge>
                    ))}
                    {selectedBrands.map(brand => (
                      <Badge key={brand} variant="secondary" className="bg-[#4A6741]/10 text-[#4A6741] flex items-center gap-1">
                        {brand}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-500"
                          onClick={() => setSelectedBrands(prev => prev.filter(b => b !== brand))}
                        />
                      </Badge>
                    ))}
                    {selectedPriceRanges.map(range => (
                      <Badge key={range} variant="secondary" className="bg-[#4A6741]/10 text-[#4A6741] flex items-center gap-1">
                        {priceRanges.find(r => r.value === range)?.name}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-500"
                          onClick={() => setSelectedPriceRanges(prev => prev.filter(r => r !== range))}
                        />
                      </Badge>
                    ))}
                    {inStockOnly && (
                      <Badge variant="secondary" className="bg-[#4A6741]/10 text-[#4A6741] flex items-center gap-1">
                        En stock
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-500"
                          onClick={() => setInStockOnly(false)}
                        />
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Grid de productos */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group"
                >
                  <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white group">
                    <CardContent className="p-0 relative">
                      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                        <Link href={`/products/${product.id}`}>
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </Link>

                        <div className="absolute top-3 left-3 flex flex-col gap-1">
                          {product.isNew && (
                            <Badge variant="secondary" className="bg-emerald-600 text-white font-semibold shadow-md">
                              Nuevo
                            </Badge>
                          )}
                          {product.isBestseller && (
                            <Badge variant="secondary" className="bg-amber-600 text-white font-semibold shadow-md">
                              Más vendido
                            </Badge>
                          )}
                          {!product.inStock && (
                            <Badge variant="secondary" className="bg-red-600 text-white font-semibold shadow-md">
                              Agotado
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary" className="text-xs bg-[#4A6741]/10 text-[#4A6741]">
                            {product.category}
                          </Badge>
                          
                          {/* Botón de favoritos al lado del badge */}
                          <button
                            onClick={(e) => {
                              console.log('Heart button clicked!', product.name);
                              toggleWishlist(product, e);
                            }}
                            className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200 group/heart border border-gray-200"
                            title={wishlistItems.includes(product.id) ? 'Remover de favoritos' : 'Agregar a favoritos'}
                          >
                            <Heart
                              className={`h-5 w-5 transition-all duration-200 ${wishlistItems.includes(product.id)
                                  ? 'text-red-500 fill-red-500'
                                  : 'text-gray-400 hover:text-red-500 group-hover/heart:scale-110'
                                }`}
                            />
                          </button>
                        </div>                        <Link href={`/products/${product.id}`}>
                          <h3 className="text-lg font-bold text-[#4A6741] mb-2 hover:text-[#3F5D4C] transition-colors cursor-pointer line-clamp-2">
                            {product.name}
                          </h3>
                        </Link>

                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {product.description}
                        </p>

                        <div className="flex items-center gap-1 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${i < Math.floor(product.rating)
                                ? 'text-yellow-500 fill-yellow-400'
                                : 'text-gray-300 fill-gray-200'
                                }`}
                            />
                          ))}
                          <span className="text-xs font-medium text-gray-700 ml-1">
                            {product.rating} ({product.reviews})
                          </span>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-[#4A6741]">€{product.price}</span>
                            {product.originalPrice > product.price && (
                              <span className="text-sm text-gray-500 line-through">€{product.originalPrice}</span>
                            )}
                          </div>
                        </div>

                        <Button
                          className={`w-full font-semibold transition-all duration-200 ${
                            addingToCart === product.id 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-[#4A6741] hover:bg-[#3F5D4C]'
                          } text-white`}
                          disabled={!product.inStock || addingToCart === product.id}
                          onClick={(e) => addToCart(product, e)}
                        >
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          {addingToCart === product.id 
                            ? '¡Agregado!' 
                            : (product.inStock ? 'Agregar al carrito' : 'No disponible')
                          }
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Mensaje si no hay productos */}
            {filteredProducts.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Filter className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No se encontraron productos</h3>
                  <p className="text-gray-600 mb-4">Intenta ajustar tus filtros para ver más resultados.</p>
                  <Button
                    onClick={clearAllFilters}
                    className="bg-[#4A6741] hover:bg-[#3F5D4C] text-white"
                  >
                    Limpiar filtros
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
