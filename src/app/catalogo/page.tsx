"use client";

import { useState, useMemo, useEffect } from 'react';
import { Star, Search, Grid3X3, List, Sparkles, Leaf, Phone, Mail } from "lucide-react";
import Image from "next/image";
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category_id: string;
    rating: number;
    reviews_count: number;
    featured: boolean;
    active: boolean;
}

interface Category {
    id: string;
    name: string;
    icon: string;
}

export default function CatalogoPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Cargar productos y categorías de Firebase
    useEffect(() => {
        const fetchData = async () => {
            if (!db) {
                console.error('Firebase not initialized');
                setLoading(false);
                return;
            }

            try {
                // Cargar categorías
                const categoriesSnapshot = await getDocs(collection(db, 'categories'));
                const categoriesData = categoriesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Category[];
                setCategories(categoriesData);

                // Cargar productos activos
                const productsQuery = query(
                    collection(db, 'products'),
                    where('active', '==', true)
                );
                const productsSnapshot = await getDocs(productsQuery);
                const productsData = productsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Product[];
                setProducts(productsData);
            } catch (error) {
                console.error('Error loading catalog:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filtrar productos
    const filteredProducts = useMemo(() => {
        let filtered = [...products];

        if (selectedCategory !== "all") {
            filtered = filtered.filter(p => p.category_id === selectedCategory);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.description?.toLowerCase().includes(term)
            );
        }

        return filtered;
    }, [products, selectedCategory, searchTerm]);

    const getCategoryName = (categoryId: string) => {
        return categories.find(c => c.id === categoryId)?.name || "Sin categoría";
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FEFCF7]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A6741] mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando catálogo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FEFCF7]">
            {/* Header del Catálogo */}
            <header className="nav-glass sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#4A6741] to-[#3F5D4C] rounded-full flex items-center justify-center">
                                <Leaf className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Sophia</h1>
                                <p className="text-xs text-[#4A6741]">Cosmética Natural</p>
                            </div>
                        </div>

                        {/* Contacto */}
                        <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
                            <a href="tel:+34600000000" className="flex items-center gap-2 hover:text-[#4A6741] transition-colors">
                                <Phone className="w-4 h-4" />
                                <span>+34 600 000 000</span>
                            </a>
                            <a href="mailto:info@sophia.com" className="flex items-center gap-2 hover:text-[#4A6741] transition-colors">
                                <Mail className="w-4 h-4" />
                                <span>info@sophia.com</span>
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero-gradient py-12 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-[#4A6741]/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                        <Sparkles className="w-4 h-4 text-[#4A6741]" />
                        <span className="text-sm text-[#4A6741]">Cosmética Natural Artesanal</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Nuestro Catálogo
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Descubre nuestra colección de productos naturales elaborados con ingredientes orgánicos de la más alta calidad.
                    </p>
                </div>
            </section>

            {/* Filtros y Búsqueda */}
            <section className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* Búsqueda */}
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4A6741]" />
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#4A6741]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 text-gray-900"
                        />
                    </div>

                    {/* Categorías */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto">
                        <button
                            onClick={() => setSelectedCategory("all")}
                            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${selectedCategory === "all"
                                ? "bg-[#4A6741] text-white"
                                : "bg-white text-gray-600 hover:bg-[#F5F1E8] border border-[#4A6741]/20"
                                }`}
                        >
                            Todos ({products.length})
                        </button>
                        {categories.map(cat => {
                            const count = products.filter(p => p.category_id === cat.id).length;
                            if (count === 0) return null;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${selectedCategory === cat.id
                                        ? "bg-[#4A6741] text-white"
                                        : "bg-white text-gray-600 hover:bg-[#F5F1E8] border border-[#4A6741]/20"
                                        }`}
                                >
                                    {cat.name} ({count})
                                </button>
                            );
                        })}
                    </div>

                    {/* Vista */}
                    <div className="hidden md:flex items-center gap-2 bg-white rounded-lg p-1 border border-[#4A6741]/20">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-[#F5F1E8] text-[#4A6741]" : "text-gray-600"
                                }`}
                        >
                            <Grid3X3 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-[#F5F1E8] text-[#4A6741]" : "text-gray-600"
                                }`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Productos */}
            <section className="max-w-7xl mx-auto px-4 pb-12">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-[#4A6741]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-[#4A6741]" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
                        <p className="text-gray-600">Prueba con otros filtros o términos de búsqueda</p>
                    </div>
                ) : (
                    <div className={
                        viewMode === "grid"
                            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            : "flex flex-col gap-4"
                    }>
                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                categoryName={getCategoryName(product.category_id)}
                                viewMode={viewMode}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer className="bg-[#3F5D4C] text-white py-8 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#4A6741] to-[#3F5D4C] rounded-full flex items-center justify-center border border-white/20">
                            <Leaf className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-semibold">Sophia Cosmética Natural</span>
                    </div>
                    <p className="text-white/70 text-sm mb-4">
                        Productos artesanales con ingredientes 100% naturales
                    </p>
                    <div className="flex items-center justify-center gap-6 text-sm text-white/70">
                        <a href="tel:+34600000000" className="hover:text-white transition-colors">
                            +34 600 000 000
                        </a>
                        <span>•</span>
                        <a href="mailto:info@sophia.com" className="hover:text-white transition-colors">
                            info@sophia.com
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// Componente de tarjeta de producto
function ProductCard({
    product,
    categoryName,
    viewMode
}: {
    product: Product;
    categoryName: string;
    viewMode: "grid" | "list";
}) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    if (viewMode === "list") {
        return (
            <div className="product-card rounded-2xl overflow-hidden shadow-sm flex">
                <div className="relative w-40 h-40 flex-shrink-0">
                    <Image
                        src={product.image || "/product1.png"}
                        alt={product.name}
                        fill
                        className="object-cover"
                    />
                    {product.featured && (
                        <div className="absolute top-2 left-2 bg-[#D4AF37] text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            Destacado
                        </div>
                    )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                        <span className="text-xs text-[#4A6741] font-medium">{categoryName}</span>
                        <h3 className="font-semibold text-gray-900 mt-1">{product.name}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                        <span className="text-xl font-bold text-[#4A6741]">{formatPrice(product.price)}</span>
                        {product.rating > 0 && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                                <span>{product.rating.toFixed(1)}</span>
                                <span className="text-xs">({product.reviews_count})</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="product-card rounded-2xl overflow-hidden shadow-sm group hover:shadow-lg transition-shadow">
            <div className="relative aspect-square">
                <Image
                    src={product.image || "/product1.png"}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.featured && (
                    <div className="absolute top-3 left-3 bg-[#D4AF37] text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Destacado
                    </div>
                )}
            </div>
            <div className="p-4">
                <span className="text-xs text-[#4A6741] font-medium">{categoryName}</span>
                <h3 className="font-semibold text-gray-900 mt-1 line-clamp-1">{product.name}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between mt-3">
                    <span className="text-xl font-bold text-[#4A6741]">{formatPrice(product.price)}</span>
                    {product.rating > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                            <span>{product.rating.toFixed(1)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
