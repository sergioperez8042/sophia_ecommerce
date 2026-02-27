"use client";

import { useState, useMemo } from 'react';
import { Star, Heart, ShoppingBag, Filter, Grid3X3, List, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import Breadcrumb from "@/components/ui/breadcrumb";
import { useCart, useWishlist, useProducts } from "@/store";
import CategoriesData from '@/entities/Category.json';
import { ICategory } from '@/entities/all';

const categoriesData = CategoriesData as ICategory[];

export default function ProductsPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const { addItem: addToCartStore } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const { products: allProducts, isLoading } = useProducts();

  // Map products to display format
  const displayProducts = useMemo(() => {
    return allProducts.filter(p => p.active).map(product => {
      const category = categoriesData.find(c => c.id === product.category_id);
      const priceRange = product.price < 20 ? "0-20" : product.price < 50 ? "20-50" : "50+";
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice: product.price * 1.2, // 20% markup as original
        rating: product.rating,
        reviews: product.reviews_count,
        image: product.image || "/product1.png",
        category: category?.name || "Sin categoría",
        category_id: product.category_id,
        inStock: product.active,
        isNew: new Date(product.created_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        isBestseller: product.featured,
        priceRange
      };
    });
  }, [allProducts]);

  // Dynamic categories from products
  const categories = useMemo(() => {
    const catCounts: Record<string, number> = {};
    displayProducts.forEach(p => {
      catCounts[p.category] = (catCounts[p.category] || 0) + 1;
    });
    return Object.entries(catCounts).map(([name, count]) => ({ name, count }));
  }, [displayProducts]);

  const priceRanges = [
    { name: "0 - 20 €", value: "0-20" },
    { name: "20 - 50 €", value: "20-50" },
    { name: "50+ €", value: "50+" }
  ];

  const filteredProducts = useMemo(() => {
    let filtered = [...displayProducts];

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product => selectedCategories.includes(product.category));
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
  }, [displayProducts, selectedCategories, selectedPriceRanges, inStockOnly, sortBy]);

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedPriceRanges([]);
    setInStockOnly(false);
  };

  const activeFiltersCount = selectedCategories.length + selectedPriceRanges.length + (inStockOnly ? 1 : 0);

  const addToCart = async (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setAddingToCart(product.id);

    addToCartStore({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      category: product.category,
      brand: product.brand,
      inStock: product.inStock,
    });

    // Visual feedback for 1 second
    setTimeout(() => {
      setAddingToCart(null);
    }, 1000);
  };

  const toggleWishlist = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    toggleItem(product.id);
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
                    <SlidersHorizontal className="h-5 w-5 mr-2 text-[#505A4A]" />
                    Filtros
                  </h2>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-[#505A4A] hover:text-[#414A3C] font-medium transition-colors"
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
                        className={`w-full flex items-center justify-between text-left p-2 rounded-lg transition-colors hover:bg-[#505A4A]/10 ${selectedCategories.includes(category.name)
                          ? 'bg-[#505A4A]/10 text-[#505A4A] font-medium'
                          : 'text-gray-700 hover:text-[#505A4A]'
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
                        className={`w-full flex items-center justify-between text-left p-2 rounded-lg transition-colors hover:bg-[#505A4A]/10 ${selectedPriceRanges.includes(range.value)
                          ? 'bg-[#505A4A]/10 text-[#505A4A] font-medium'
                          : 'text-gray-700 hover:text-[#505A4A]'
                          }`}
                      >
                        <span className="text-sm flex-1">
                          {range.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtro de Disponibilidad */}
                <div className="py-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Disponibilidad</h3>
                  <button
                    onClick={() => setInStockOnly(!inStockOnly)}
                    className={`w-full flex items-center text-left p-2 rounded-lg transition-colors hover:bg-[#505A4A]/10 ${inStockOnly
                      ? 'bg-[#505A4A]/10 text-[#505A4A] font-medium'
                      : 'text-gray-700 hover:text-[#505A4A]'
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
                      className="lg:hidden border-[#505A4A] text-[#505A4A] hover:bg-[#505A4A] hover:text-white"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                    </Button>
                  </div>

                  <div className="flex items-center justify-center sm:justify-end gap-3">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-48 border-[#505A4A] text-gray-900 bg-white hover:border-[#414A3C] focus:border-[#505A4A] focus:ring-[#505A4A]/20">
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

                    <div className="flex border border-gray-300 rounded-lg overflow-hidden h-10">
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="icon"
                        onClick={() => setViewMode("grid")}
                        className={`rounded-none h-full w-10 ${viewMode === "grid" ? "bg-[#505A4A] text-white hover:bg-[#414A3C]" : "hover:bg-gray-100"}`}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <div className="w-[1px] bg-gray-300 h-full"></div>
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="icon"
                        onClick={() => setViewMode("list")}
                        className={`rounded-none h-full w-10 ${viewMode === "list" ? "bg-[#505A4A] text-white hover:bg-[#414A3C]" : "hover:bg-gray-100"}`}
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
                      <Badge key={category} variant="secondary" className="bg-[#505A4A]/10 text-[#505A4A] flex items-center gap-1">
                        {category}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-500"
                          onClick={() => setSelectedCategories(prev => prev.filter(c => c !== category))}
                        />
                      </Badge>
                    ))}

                    {selectedPriceRanges.map(range => (
                      <Badge key={range} variant="secondary" className="bg-[#505A4A]/10 text-[#505A4A] flex items-center gap-1">
                        {priceRanges.find(r => r.value === range)?.name}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-500"
                          onClick={() => setSelectedPriceRanges(prev => prev.filter(r => r !== range))}
                        />
                      </Badge>
                    ))}
                    {inStockOnly && (
                      <Badge variant="secondary" className="bg-[#505A4A]/10 text-[#505A4A] flex items-center gap-1">
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
                        <Link href={`/products/${product.id}`} prefetch={false}>
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
                          <Badge variant="secondary" className="text-xs px-2.5 py-0.5 font-medium bg-[#505A4A]/10 text-[#505A4A] hover:bg-[#505A4A]/20">
                            {product.category}
                          </Badge>

                          {/* Botón de favoritos al lado del badge */}
                          <button
                            onClick={(e) => toggleWishlist(product, e)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200 group/heart border border-gray-200"
                            title={isInWishlist(product.id) ? 'Remover de favoritos' : 'Agregar a favoritos'}
                          >
                            <Heart
                              className={`h-5 w-5 transition-all duration-200 ${isInWishlist(product.id)
                                ? 'text-red-500 fill-red-500'
                                : 'text-gray-400 hover:text-red-500 group-hover/heart:scale-110'
                                }`}
                            />
                          </button>
                        </div>                        <Link href={`/products/${product.id}`} prefetch={false}>
                          <h3 className="text-lg font-bold text-[#505A4A] mb-2 hover:text-[#414A3C] transition-colors cursor-pointer line-clamp-2">
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
                            <span className="text-xl font-bold text-[#505A4A]">€{product.price.toFixed(2)}</span>
                            {product.originalPrice > product.price && (
                              <span className="text-sm text-gray-500 line-through">€{product.originalPrice.toFixed(2)}</span>
                            )}
                          </div>
                        </div>

                        <Button
                          className={`w-full font-semibold transition-all duration-200 ${addingToCart === product.id
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-[#505A4A] hover:bg-[#414A3C]'
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
                    className="bg-[#505A4A] hover:bg-[#414A3C] text-white"
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
