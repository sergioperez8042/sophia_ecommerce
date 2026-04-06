"use client";

import { useState, useEffect, useCallback, useRef, use } from 'react';
import { Star, Heart, ShoppingBag, Plus, Minus, Truck, Shield, RotateCcw, ChevronLeft, ChevronRight, Loader2, CheckCircle2, User } from "lucide-react";
import ProductImage from "@/components/ui/product-image";
import { m, AnimatePresence } from "framer-motion";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useCart, useWishlist, useProducts, useCategories } from "@/store";
import { useAuth } from "@/store/AuthContext";
import { ReviewService } from "@/lib/firestore-services";
import { IReview } from "@/entities/all";
import { toast } from "sonner";

const Breadcrumb = dynamic(() => import("@/components/ui/breadcrumb"), {
    ssr: false
});

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [activeTab, setActiveTab] = useState('description');
    const [addedToCart, setAddedToCart] = useState(false);

    // Reviews state
    const [reviews, setReviews] = useState<IReview[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [userReview, setUserReview] = useState<IReview | null>(null);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewHover, setReviewHover] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [isVerifiedPurchase, setIsVerifiedPurchase] = useState(false);
    const tabsRef = useRef<HTMLDivElement>(null);

    const { addItem: addToCartStore } = useCart();
    const { toggleItem, isInWishlist } = useWishlist();
    const { products, isLoading } = useProducts();
    const { categories } = useCategories();
    const { user, isAuthenticated } = useAuth();

    const product = products.find(p => p.id === resolvedParams.id);
    const category = product ? categories.find(c => c.id === product.category_id) : null;

    const isWishlisted = product ? isInWishlist(product.id) : false;

    const loadReviews = useCallback(async () => {
        if (!product) return;
        setLoadingReviews(true);
        try {
            const data = await ReviewService.getByProductId(product.id);
            setReviews(data);
            if (user) {
                const existing = data.find(r => r.userId === user.id);
                setUserReview(existing || null);
            }
        } catch {
            // silently fail
        } finally {
            setLoadingReviews(false);
        }
    }, [product, user]);

    useEffect(() => {
        if (product) loadReviews();
    }, [product, loadReviews]);

    useEffect(() => {
        if (user && product) {
            ReviewService.checkVerifiedPurchase(user.id, product.id).then(setIsVerifiedPurchase);
        }
    }, [user, product]);

    const handleSubmitReview = async () => {
        if (!product || !user || reviewRating === 0) return;
        setSubmittingReview(true);
        try {
            await ReviewService.create({
                productId: product.id,
                userId: user.id,
                userName: user.name || user.email?.split('@')[0] || 'Anónimo',
                rating: reviewRating,
                comment: reviewComment.trim(),
                createdAt: new Date().toISOString(),
                verified: isVerifiedPurchase,
            });
            toast.success('¡Reseña publicada!');
            setReviewRating(0);
            setReviewComment('');
            await loadReviews();
        } catch {
            toast.error('Error al publicar la reseña');
        } finally {
            setSubmittingReview(false);
        }
    };

    const scrollToReviews = () => {
        setActiveTab('reviews');
        setTimeout(() => tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    };

    const productImages = product?.image ? [product.image] : [];
    const currentImage = productImages[selectedImage] || null;

    const discount = product?.price
        ? Math.round(((product.price * 1.2 - product.price) / (product.price * 1.2)) * 100)
        : 0;

    const handleAddToCart = () => {
        if (!product) return;
        for (let i = 0; i < quantity; i++) {
            addToCartStore({
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                originalPrice: product.price * 1.2,
                image: product.image || '',
                category: category?.name,
                inStock: product.active,
            });
        }
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const handleToggleWishlist = () => {
        if (product) toggleItem(product.id);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FEFCF7] dark:bg-[#1a1d19]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#505A4A] border-t-transparent" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-[#FEFCF7] dark:bg-[#1a1d19]">
                <div className="max-w-xl mx-auto px-6 py-16 text-center pt-32">
                    <h1 className="text-2xl font-light text-[#333] dark:text-[#e8e4dc] mb-3">Producto no encontrado</h1>
                    <p className="text-[#999] dark:text-[#8a8273] mb-8">El producto que buscas no existe o fue eliminado.</p>
                    <Link
                        href="/products"
                        className="inline-block border border-[#505A4A] text-[#505A4A] dark:text-[#8a8273] dark:border-[#8a8273] px-8 py-3 text-[13px] font-medium tracking-[0.08em] uppercase hover:bg-[#505A4A] hover:text-white transition-all duration-300"
                    >
                        Ver Productos
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FEFCF7] dark:bg-[#1a1d19] pt-20">
            <div className="max-w-[1200px] mx-auto px-6 lg:px-10 pb-8 sm:pb-12">
                <Breadcrumb
                    items={[
                        { label: 'Productos', href: '/products' },
                        { label: product.name }
                    ]}
                />

                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mt-8 sm:mt-12"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20">
                        {/* Galería */}
                        <div>
                            <div className="relative aspect-square overflow-hidden bg-[#F0EDE6] dark:bg-[#2a2e26] group">
                                <AnimatePresence mode="wait">
                                    <m.div
                                        key={selectedImage}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute inset-0"
                                    >
                                        <ProductImage
                                            src={currentImage}
                                            alt={product.name}
                                            className="object-cover"
                                        />
                                    </m.div>
                                </AnimatePresence>

                                {productImages.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setSelectedImage((prev) => (prev - 1 + productImages.length) % productImages.length)}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white dark:bg-[#1a1d19]/80 dark:hover:bg-[#22261f] text-[#333] dark:text-[#e8e4dc] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                                        >
                                            <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
                                        </button>
                                        <button
                                            onClick={() => setSelectedImage((prev) => (prev + 1) % productImages.length)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white dark:bg-[#1a1d19]/80 dark:hover:bg-[#22261f] text-[#333] dark:text-[#e8e4dc] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                                        >
                                            <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
                                        </button>
                                    </>
                                )}
                            </div>

                            {productImages.length > 1 && (
                                <div className="grid grid-cols-4 gap-2 mt-3">
                                    {productImages.map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index)}
                                            className={`relative aspect-square overflow-hidden bg-[#F0EDE6] dark:bg-[#2a2e26] transition-all duration-200 ${
                                                selectedImage === index
                                                    ? 'ring-2 ring-[#505A4A]'
                                                    : 'opacity-60 hover:opacity-100'
                                            }`}
                                        >
                                            <ProductImage
                                                src={image}
                                                alt={`${product.name} ${index + 1}`}
                                                className="object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Info del producto */}
                        <div className="lg:py-4">
                            <h1 className="text-[28px] sm:text-[34px] font-light text-[#333] dark:text-[#e8e4dc] tracking-[-0.02em] leading-tight mb-2">
                                {product.name}
                            </h1>

                            {category && (
                                <span className="text-[11px] uppercase tracking-[0.15em] text-[#999] dark:text-[#8a8273] block mb-4">
                                    {category.name}
                                </span>
                            )}

                            <p className="text-[15px] text-[#777] dark:text-[#a09889] font-light leading-relaxed mb-6">
                                {product.description}
                            </p>

                            {product.tags && product.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-6">
                                    {product.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-[11px] uppercase tracking-[0.05em] px-2.5 py-1 bg-[#505A4A]/8 text-[#505A4A] dark:bg-[#505A4A]/20 dark:text-[#b8b0a2] rounded-full"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {product.usage && (
                                <div className="mb-6 pb-6 border-b border-[#E8E4DD] dark:border-[#3a3d36]">
                                    <span className="text-[12px] uppercase tracking-[0.12em] text-[#999] dark:text-[#8a8273] block mb-2">
                                        Modo de uso
                                    </span>
                                    <p className="text-[14px] text-[#666] dark:text-[#a09889] font-light leading-relaxed">
                                        {product.usage}
                                    </p>
                                </div>
                            )}

                            {/* Rating */}
                            <button
                                onClick={scrollToReviews}
                                className="flex items-center gap-3 mb-6 group cursor-pointer"
                            >
                                <div className="flex items-center gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={`star-${i}`}
                                            className={`h-4 w-4 ${
                                                i < Math.floor(product.rating)
                                                    ? 'text-[#C9A96E] fill-[#C9A96E]'
                                                    : 'text-gray-200 fill-gray-200 dark:text-gray-700 dark:fill-gray-700'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-[13px] text-[#999] dark:text-[#8a8273] group-hover:text-[#505A4A] dark:group-hover:text-[#C4B590] transition-colors">
                                    {product.reviews_count > 0
                                        ? `${product.rating} · ${product.reviews_count} reseñas`
                                        : 'Sé el primero en opinar'
                                    }
                                </span>
                            </button>

                            {/* Precio */}
                            <div className="flex items-baseline gap-3 mb-8 pb-8 border-b border-[#E8E4DD] dark:border-[#3a3d36]">
                                <span className="text-[28px] font-light text-[#333] dark:text-[#e8e4dc] tracking-tight">
                                    ${product.price.toFixed(2)}
                                </span>
                                <span className="text-[16px] text-[#BBB] dark:text-[#6a6359] line-through">
                                    ${(product.price * 1.2).toFixed(2)}
                                </span>
                                <span className="text-[12px] text-[#505A4A] font-medium tracking-wide uppercase">
                                    -{discount}%
                                </span>
                            </div>

                            {/* Peso */}
                            {product.weight && product.weight > 0 && (
                                <p className="text-[13px] text-[#999] dark:text-[#8a8273] mb-6">
                                    Peso: {product.weight} {product.weight_unit || 'g'}
                                </p>
                            )}

                            {/* Cantidad */}
                            <div className="mb-6">
                                <span className="text-[12px] uppercase tracking-[0.12em] text-[#999] dark:text-[#8a8273] block mb-3">
                                    Cantidad
                                </span>
                                <div className="inline-flex items-center border border-[#D5D0C8] dark:border-[#3a3d36] h-[44px]">
                                    <button
                                        onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                                        className="w-[44px] h-full flex items-center justify-center text-[#999] dark:text-[#8a8273] hover:text-[#333] dark:hover:text-[#e8e4dc] transition-colors"
                                        aria-label="Disminuir cantidad"
                                    >
                                        <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
                                    </button>
                                    <span className="w-[50px] text-center text-[14px] text-[#333] dark:text-[#e8e4dc] tabular-nums select-none border-x border-[#D5D0C8] dark:border-[#3a3d36]">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() => setQuantity(prev => prev + 1)}
                                        className="w-[44px] h-full flex items-center justify-center text-[#999] dark:text-[#8a8273] hover:text-[#333] dark:hover:text-[#e8e4dc] transition-colors"
                                        aria-label="Aumentar cantidad"
                                    >
                                        <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                                    </button>
                                </div>
                            </div>

                            {/* Botones */}
                            <div className="flex gap-3 mb-8">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={!product.active}
                                    className={`flex-1 h-[52px] flex items-center justify-center gap-2 text-[13px] font-medium tracking-[0.1em] uppercase transition-all duration-300 ${
                                        addedToCart
                                            ? 'bg-[#414A3C] text-white'
                                            : product.active
                                                ? 'bg-[#505A4A] text-white hover:bg-[#414A3C]'
                                                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                                    {addedToCart ? 'Agregado' : (product.active ? 'Agregar al carrito' : 'No disponible')}
                                </button>
                                <button
                                    onClick={handleToggleWishlist}
                                    className={`w-[52px] h-[52px] flex items-center justify-center border transition-all duration-300 ${
                                        isWishlisted
                                            ? 'border-[#505A4A] bg-[#505A4A]/5 text-[#505A4A]'
                                            : 'border-[#D5D0C8] dark:border-[#3a3d36] text-[#999] dark:text-[#8a8273] hover:text-[#505A4A] hover:border-[#505A4A]'
                                    }`}
                                >
                                    <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} strokeWidth={1.5} />
                                </button>
                            </div>

                            {/* Trust */}
                            <div className="grid grid-cols-3 gap-4 py-6 border-t border-[#E8E4DD] dark:border-[#3a3d36]">
                                <div className="flex flex-col items-center text-center">
                                    <Truck className="h-5 w-5 text-[#505A4A]/50 mb-2" strokeWidth={1.5} />
                                    <span className="text-[11px] text-[#999] dark:text-[#8a8273] tracking-[0.03em]">Envío Express</span>
                                </div>
                                <div className="flex flex-col items-center text-center">
                                    <Shield className="h-5 w-5 text-[#505A4A]/50 mb-2" strokeWidth={1.5} />
                                    <span className="text-[11px] text-[#999] dark:text-[#8a8273] tracking-[0.03em]">Garantía 30 días</span>
                                </div>
                                <div className="flex flex-col items-center text-center">
                                    <RotateCcw className="h-5 w-5 text-[#505A4A]/50 mb-2" strokeWidth={1.5} />
                                    <span className="text-[11px] text-[#999] dark:text-[#8a8273] tracking-[0.03em]">Devolución gratis</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs de información */}
                    <div ref={tabsRef} className="mt-20 border-t border-[#E8E4DD] dark:border-[#3a3d36] scroll-mt-24">
                        <div className="flex">
                            {[
                                { id: 'description', label: 'Descripción' },
                                { id: 'details', label: 'Detalles' },
                                { id: 'reviews', label: `Reseñas (${reviews.length})` },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-5 px-6 text-[13px] tracking-[0.08em] uppercase transition-all duration-200 relative ${
                                        activeTab === tab.id
                                            ? 'text-[#333] dark:text-[#e8e4dc] font-medium'
                                            : 'text-[#AAA] dark:text-[#7a7267] hover:text-[#666] dark:text-[#b8b0a2] dark:hover:text-[#b8b0a2]'
                                    }`}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <m.div
                                            className="absolute top-0 left-0 right-0 h-[2px] bg-[#505A4A]"
                                            layoutId="activeProductTab"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className={`py-10 ${activeTab === 'reviews' ? 'max-w-4xl' : 'max-w-2xl'}`}>
                            <AnimatePresence mode="wait">
                                <m.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {activeTab === 'description' && (
                                        <p className="text-[15px] text-[#666] dark:text-[#b8b0a2] font-light leading-[1.8]">
                                            {product.description}
                                        </p>
                                    )}

                                    {activeTab === 'details' && (
                                        <div className="space-y-4">
                                            <div className="flex border-b border-[#E8E4DD] dark:border-[#3a3d36] pb-4">
                                                <span className="text-[13px] text-[#999] dark:text-[#8a8273] w-36 uppercase tracking-[0.05em]">Categoría</span>
                                                <span className="text-[14px] text-[#555] dark:text-[#b8b0a2]">{category?.name || 'Sin categoría'}</span>
                                            </div>
                                            <div className="flex border-b border-[#E8E4DD] dark:border-[#3a3d36] pb-4">
                                                <span className="text-[13px] text-[#999] dark:text-[#8a8273] w-36 uppercase tracking-[0.05em]">Estado</span>
                                                <span className="text-[14px] text-[#555] dark:text-[#b8b0a2]">{product.active ? 'Disponible' : 'No disponible'}</span>
                                            </div>
                                            <div className="flex border-b border-[#E8E4DD] dark:border-[#3a3d36] pb-4">
                                                <span className="text-[13px] text-[#999] dark:text-[#8a8273] w-36 uppercase tracking-[0.05em]">Valoración</span>
                                                <span className="text-[14px] text-[#555] dark:text-[#b8b0a2]">{product.rating} / 5 ({product.reviews_count} reseñas)</span>
                                            </div>
                                            {product.featured && (
                                                <div className="flex border-b border-[#E8E4DD] dark:border-[#3a3d36] pb-4">
                                                    <span className="text-[13px] text-[#999] dark:text-[#8a8273] w-36 uppercase tracking-[0.05em]">Destacado</span>
                                                    <span className="text-[14px] text-[#505A4A]">Producto destacado</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'reviews' && (
                                        <div>
                                            {loadingReviews ? (
                                                <div className="flex justify-center py-12">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#505A4A] border-t-transparent" />
                                                </div>
                                            ) : (
                                                <div className="space-y-10">
                                                    {/* Rating summary */}
                                                    {reviews.length > 0 && (
                                                        <div className="flex items-start gap-10 pb-10 border-b border-[#E8E4DD] dark:border-[#3a3d36]">
                                                            <div className="text-center">
                                                                <div className="text-[48px] font-light text-[#333] dark:text-[#e8e4dc] leading-none">
                                                                    {product.rating.toFixed(1)}
                                                                </div>
                                                                <div className="flex items-center gap-0.5 justify-center mt-2">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <Star
                                                                            key={`avg-${i}`}
                                                                            className={`h-4 w-4 ${
                                                                                i < Math.round(product.rating)
                                                                                    ? 'text-[#C9A96E] fill-[#C9A96E]'
                                                                                    : 'text-gray-200 fill-gray-200 dark:text-gray-700 dark:fill-gray-700'
                                                                            }`}
                                                                        />
                                                                    ))}
                                                                </div>
                                                                <div className="text-[12px] text-[#999] dark:text-[#8a8273] mt-1">
                                                                    {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 space-y-1.5">
                                                                {[5, 4, 3, 2, 1].map((stars) => {
                                                                    const count = reviews.filter(r => r.rating === stars).length;
                                                                    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                                                                    return (
                                                                        <div key={stars} className="flex items-center gap-2">
                                                                            <span className="text-[12px] text-[#999] dark:text-[#8a8273] w-3 text-right">{stars}</span>
                                                                            <Star className="h-3 w-3 text-[#C9A96E] fill-[#C9A96E]" />
                                                                            <div className="flex-1 h-[6px] bg-[#E8E4DD] dark:bg-[#3a3d36] rounded-full overflow-hidden">
                                                                                <div
                                                                                    className="h-full bg-[#C9A96E] rounded-full transition-all duration-500"
                                                                                    style={{ width: `${pct}%` }}
                                                                                />
                                                                            </div>
                                                                            <span className="text-[11px] text-[#BBB] dark:text-[#6a6359] w-6 text-right">{count}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Write review form */}
                                                    {isAuthenticated && !userReview ? (
                                                        <div className="pb-10 border-b border-[#E8E4DD] dark:border-[#3a3d36]">
                                                            <h3 className="text-[13px] uppercase tracking-[0.08em] text-[#333] dark:text-[#e8e4dc] font-medium mb-4">
                                                                Escribe tu reseña
                                                            </h3>
                                                            <div className="flex items-center gap-1 mb-4">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <button
                                                                        key={star}
                                                                        onMouseEnter={() => setReviewHover(star)}
                                                                        onMouseLeave={() => setReviewHover(0)}
                                                                        onClick={() => setReviewRating(star)}
                                                                        className="p-0.5 transition-transform hover:scale-110"
                                                                    >
                                                                        <Star
                                                                            className={`h-6 w-6 transition-colors ${
                                                                                star <= (reviewHover || reviewRating)
                                                                                    ? 'text-[#C9A96E] fill-[#C9A96E]'
                                                                                    : 'text-gray-200 dark:text-gray-700'
                                                                            }`}
                                                                        />
                                                                    </button>
                                                                ))}
                                                                {reviewRating > 0 && (
                                                                    <span className="text-[12px] text-[#999] dark:text-[#8a8273] ml-2">
                                                                        {['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'][reviewRating]}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <textarea
                                                                value={reviewComment}
                                                                onChange={(e) => setReviewComment(e.target.value)}
                                                                placeholder="Cuéntanos tu experiencia con este producto..."
                                                                rows={3}
                                                                className="w-full border border-[#D5D0C8] dark:border-[#3a3d36] bg-transparent text-[14px] text-[#333] dark:text-[#e8e4dc] placeholder-[#BBB] dark:placeholder-[#6a6359] px-4 py-3 focus:outline-none focus:border-[#505A4A] transition-colors resize-none"
                                                            />
                                                            <div className="flex items-center justify-between mt-3">
                                                                {isVerifiedPurchase && (
                                                                    <span className="flex items-center gap-1 text-[11px] text-[#505A4A] dark:text-[#8a8273]">
                                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                                        Compra verificada
                                                                    </span>
                                                                )}
                                                                <button
                                                                    onClick={handleSubmitReview}
                                                                    disabled={reviewRating === 0 || submittingReview}
                                                                    className="ml-auto h-[40px] px-6 bg-[#505A4A] text-white text-[12px] font-medium tracking-[0.08em] uppercase hover:bg-[#414A3C] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                                                                >
                                                                    {submittingReview && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                                                    Publicar reseña
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : !isAuthenticated ? (
                                                        <div className="pb-10 border-b border-[#E8E4DD] dark:border-[#3a3d36] text-center py-8">
                                                            <p className="text-[14px] text-[#999] dark:text-[#8a8273] mb-3">
                                                                Inicia sesión para dejar una reseña
                                                            </p>
                                                            <Link
                                                                href="/auth"
                                                                className="inline-block border border-[#505A4A] text-[#505A4A] dark:text-[#8a8273] dark:border-[#8a8273] px-6 py-2.5 text-[12px] font-medium tracking-[0.08em] uppercase hover:bg-[#505A4A] hover:text-white transition-all duration-300"
                                                            >
                                                                Iniciar sesión
                                                            </Link>
                                                        </div>
                                                    ) : null}

                                                    {/* Reviews list */}
                                                    {reviews.length > 0 ? (
                                                        <div className="space-y-6">
                                                            {reviews.map((review) => (
                                                                <div
                                                                    key={review.id}
                                                                    className="pb-6 border-b border-[#E8E4DD] dark:border-[#3a3d36] last:border-0"
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-[#505A4A]/10 dark:bg-[#505A4A]/20 flex items-center justify-center flex-shrink-0">
                                                                            <User className="h-4 w-4 text-[#505A4A] dark:text-[#8a8273]" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                <span className="text-[13px] font-medium text-[#333] dark:text-[#e8e4dc]">
                                                                                    {review.userName}
                                                                                </span>
                                                                                {review.verified && (
                                                                                    <span className="flex items-center gap-0.5 text-[10px] text-[#505A4A] dark:text-[#8a8273] bg-[#505A4A]/8 dark:bg-[#505A4A]/20 px-1.5 py-0.5 rounded-full">
                                                                                        <CheckCircle2 className="h-2.5 w-2.5" />
                                                                                        Verificada
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                                <div className="flex items-center gap-0.5">
                                                                                    {[...Array(5)].map((_, i) => (
                                                                                        <Star
                                                                                            key={`r-${review.id}-${i}`}
                                                                                            className={`h-3 w-3 ${
                                                                                                i < review.rating
                                                                                                    ? 'text-[#C9A96E] fill-[#C9A96E]'
                                                                                                    : 'text-gray-200 fill-gray-200 dark:text-gray-700 dark:fill-gray-700'
                                                                                            }`}
                                                                                        />
                                                                                    ))}
                                                                                </div>
                                                                                <span className="text-[11px] text-[#BBB] dark:text-[#6a6359]">
                                                                                    {new Date(review.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                                </span>
                                                                            </div>
                                                                            {review.comment && (
                                                                                <p className="text-[14px] text-[#666] dark:text-[#b8b0a2] font-light leading-relaxed mt-2">
                                                                                    {review.comment}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8">
                                                            <Star className="h-8 w-8 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                                                            <p className="text-[14px] text-[#999] dark:text-[#8a8273]">
                                                                Aún no hay reseñas para este producto
                                                            </p>
                                                            <p className="text-[12px] text-[#BBB] dark:text-[#6a6359] mt-1">
                                                                Sé el primero en compartir tu opinión
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </m.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </m.div>
            </div>
        </div>
    );
}
