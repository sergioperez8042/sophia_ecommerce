"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Sun, Moon, Star, Package, Plus, ShoppingBag, Check, CheckCircle2, User, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ProductImage from "@/components/ui/product-image";
import { m, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/store/ThemeContext';
import { useCart, CartProduct } from '@/store/CartContext';
import { useAuth } from '@/store/AuthContext';
import { ReviewService } from '@/lib/firestore-services';
import { IReview } from '@/entities/all';
import CartDrawer from '@/components/CartDrawer';
import { toast } from 'sonner';

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
    tags: string[];
    ingredients: string[];
    usage?: string;
    weight?: number;
    weight_unit?: string;
    out_of_stock?: boolean;
}

interface CatalogProductDetailProps {
    product: Product;
    categoryName: string;
}

export default function CatalogProductDetail({ product, categoryName }: CatalogProductDetailProps) {
    const { isDark, toggleTheme } = useTheme();
    const { addItem, totalItems } = useCart();
    const { user, isAuthenticated } = useAuth();
    const [selectedImage] = useState(0);
    const [addedToCart, setAddedToCart] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Reviews state
    const [reviews, setReviews] = useState<IReview[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [userReview, setUserReview] = useState<IReview | null>(null);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewHover, setReviewHover] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [isVerifiedPurchase, setIsVerifiedPurchase] = useState(false);
    const [showReviews, setShowReviews] = useState(false);
    const reviewsRef = useRef<HTMLDivElement>(null);

    const images = product.image ? [product.image] : [];

    const loadReviews = useCallback(async () => {
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
    }, [product.id, user]);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    useEffect(() => {
        if (user) {
            ReviewService.checkVerifiedPurchase(user.id, product.id).then(setIsVerifiedPurchase);
        }
    }, [user, product.id]);

    const handleSubmitReview = async () => {
        if (!user || reviewRating === 0) return;
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
        } catch (err) {
            console.error('Review submission error:', err);
            toast.error('Error al publicar la reseña');
        } finally {
            setSubmittingReview(false);
        }
    };

    const scrollToReviews = () => {
        setShowReviews(true);
        setTimeout(() => reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    };

    // Dynamic rating from loaded reviews (falls back to product prop)
    const dynamicRating = reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : product.rating;
    const dynamicReviewCount = reviews.length > 0 ? reviews.length : product.reviews_count;

    const formatPrice = (price: number) => `$${price.toFixed(2)}`;

    const handleAddToCart = () => {
        const cartProduct: CartProduct = {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
        };
        addItem(cartProduct);
        setAddedToCart(true);
        setTimeout(() => {
            setAddedToCart(false);
            setIsCartOpen(true);
        }, 800);
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#1a1d19]' : 'bg-[#FEFCF7]'}`}>
            {/* Header */}
            <m.header
                className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-300 ${isDark ? 'bg-[#1a1d19]/95 border-[#C4B590]/15' : 'bg-white/80 border-[#505A4A]/10'}`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16 sm:h-20">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/"
                                className={`flex items-center justify-center h-9 w-9 rounded-lg transition-colors ${isDark ? 'hover:bg-[#C4B590]/15' : 'hover:bg-gray-100'}`}
                                aria-label="Volver al catálogo"
                            >
                                <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`} />
                            </Link>
                            <Link href="/" className="flex items-center gap-3">
                                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden shadow-sm ring-1 ring-[#505A4A]/15">
                                    <Image
                                        src="/images/sophia_logo_nuevo.jpeg"
                                        alt="Sophia Cosmetica Botanica"
                                        fill
                                        sizes="48px"
                                        className="object-cover"
                                        priority
                                    />
                                </div>
                                <span className={`text-base sm:text-lg font-semibold tracking-tight leading-tight ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}>Sophia</span>
                            </Link>
                        </div>

                        <div className="flex items-center gap-2">
                            <m.button
                                onClick={toggleTheme}
                                className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-[#C4B590]/15 text-[#C4B590] hover:bg-[#C4B590]/25' : 'bg-[#505A4A]/10 text-[#505A4A] hover:bg-[#505A4A]/20'}`}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
                            >
                                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </m.button>

                            {/* Cart button */}
                            <m.button
                                onClick={() => setIsCartOpen(true)}
                                className={`relative p-2 rounded-xl transition-colors ${isDark ? 'bg-[#C4B590]/15 text-[#C4B590] hover:bg-[#C4B590]/25' : 'bg-[#505A4A]/10 text-[#505A4A] hover:bg-[#505A4A]/20'}`}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                aria-label="Carrito"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                {totalItems > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#C4B590] text-[#1a1d19] text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {totalItems}
                                    </span>
                                )}
                            </m.button>
                        </div>
                    </div>
                </div>
            </m.header>

            {/* Product Detail */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12"
                >
                    {/* Image */}
                    <div className="relative aspect-square rounded-2xl overflow-hidden">
                        {images.length > 0 ? (
                            <ProductImage
                                src={images[selectedImage]}
                                alt={product.name}
                                className={`object-cover ${product.out_of_stock ? 'opacity-70 grayscale-[20%]' : ''}`}
                            />
                        ) : (
                            <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-[#22261f]' : 'bg-[#F0EDE6]'}`}>
                                <span className={`text-sm ${isDark ? 'text-[#7a7568]' : 'text-[#999]'}`}>Sin imagen</span>
                            </div>
                        )}
                        {product.out_of_stock && (
                            <div className="absolute top-3 left-3 bg-red-500/90 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                Agotado
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col">
                        {categoryName && (
                            <span className={`text-xs uppercase tracking-[0.15em] mb-2 ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}>
                                {categoryName}
                            </span>
                        )}

                        <h1 className={`text-2xl sm:text-3xl font-semibold mb-3 ${isDark ? 'text-[#e8e4dc]' : 'text-gray-900'}`}>
                            {product.name}
                        </h1>

                        {/* Rating */}
                        <button
                            onClick={scrollToReviews}
                            className="flex items-center gap-3 mb-4 group cursor-pointer"
                        >
                            <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={`star-${i}`}
                                        className={`h-4 w-4 ${
                                            i < Math.floor(dynamicRating)
                                                ? 'text-[#C9A96E] fill-[#C9A96E]'
                                                : isDark ? 'text-gray-700 fill-gray-700' : 'text-gray-200 fill-gray-200'
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className={`text-[13px] transition-colors ${isDark ? 'text-[#8a8273] group-hover:text-[#C4B590]' : 'text-[#999] group-hover:text-[#505A4A]'}`}>
                                {dynamicReviewCount > 0
                                    ? `${dynamicRating} · ${dynamicReviewCount} reseña${dynamicReviewCount > 1 ? 's' : ''}`
                                    : 'Sé el primero en opinar'
                                }
                            </span>
                        </button>

                        <p className={`text-sm sm:text-base leading-relaxed mb-5 ${isDark ? 'text-[#8a8278]' : 'text-gray-600'}`}>
                            {product.description}
                        </p>

                        {/* Tags */}
                        {product.tags && product.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-5">
                                {product.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className={`text-[12px] px-3 py-1.5 rounded-lg ${
                                            isDark ? 'bg-[#2a2d26] text-[#a09889]' : 'bg-[#F5F1E8] text-[#666]'
                                        }`}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Modo de uso */}
                        {product.usage && (
                            <div className="mb-4">
                                <span className={`text-[12px] uppercase tracking-[0.12em] block mb-2 ${isDark ? 'text-[#8a8273]' : 'text-[#999]'}`}>
                                    Modo de uso
                                </span>
                                <p className={`text-[14px] leading-relaxed ${isDark ? 'text-[#a09889]' : 'text-[#666]'}`}>
                                    {product.usage}
                                </p>
                            </div>
                        )}

                        {/* Ingredientes */}
                        {product.ingredients && product.ingredients.length > 0 && (
                            <div className="mb-5">
                                <span className={`text-[12px] uppercase tracking-[0.12em] block mb-3 ${isDark ? 'text-[#8a8273]' : 'text-[#999]'}`}>
                                    Ingredientes
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {product.ingredients.map((ingredient) => (
                                        <span
                                            key={ingredient}
                                            className={`text-[12px] px-3 py-1.5 rounded-lg ${
                                                isDark ? 'bg-[#2a2d26] text-[#a09889]' : 'bg-[#F5F1E8] text-[#666]'
                                            }`}
                                        >
                                            {ingredient}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Precio + Peso */}
                        <div className="flex items-baseline gap-4 mb-6">
                            <span className={`text-3xl font-bold ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}>
                                {formatPrice(product.price)}
                            </span>
                            {product.weight != null && product.weight > 0 && (
                                <span className={`text-sm flex items-center gap-1.5 ${isDark ? 'text-[#8a8273]' : 'text-[#999]'}`}>
                                    <Package className="w-3.5 h-3.5" />
                                    {product.weight} {product.weight_unit || 'g'}
                                </span>
                            )}
                        </div>

                        {/* Add to Cart CTA */}
                        {product.out_of_stock ? (
                            <div className="w-full bg-gray-300 text-gray-500 py-4 rounded-xl text-base font-medium flex items-center justify-center gap-3 cursor-not-allowed mb-6">
                                Producto agotado
                            </div>
                        ) : (
                            <m.button
                                onClick={handleAddToCart}
                                className={`w-full py-4 rounded-xl text-base font-medium flex items-center justify-center gap-3 transition-all shadow-md mb-6 ${
                                    addedToCart
                                        ? 'bg-[#C4B590] text-[#1a1d19]'
                                        : 'bg-[#505A4A] text-white hover:bg-[#414A3C]'
                                }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {addedToCart ? (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Agregado al carrito
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5" />
                                        Agregar al carrito
                                    </>
                                )}
                            </m.button>
                        )}

                        {/* Back link */}
                        <Link
                            href="/catalog"
                            className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${isDark ? 'text-[#C4B590] hover:text-[#e8e4dc]' : 'text-[#505A4A] hover:text-gray-900'}`}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver al catálogo
                        </Link>
                    </div>
                </m.div>
            </div>

            {/* Reviews Section */}
            <div ref={reviewsRef} className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 scroll-mt-24">
                <button
                    onClick={() => setShowReviews(!showReviews)}
                    className={`w-full flex items-center justify-between py-4 border-t transition-colors ${isDark ? 'border-[#3a3d36] text-[#e8e4dc]' : 'border-[#E8E4DD] text-gray-900'}`}
                >
                    <span className="text-sm font-medium uppercase tracking-[0.08em]">
                        Reseñas ({reviews.length})
                    </span>
                    <span className={`text-xs ${isDark ? 'text-[#8a8273]' : 'text-[#999]'}`}>
                        {showReviews ? '▲' : '▼'}
                    </span>
                </button>

                <AnimatePresence>
                    {showReviews && (
                        <m.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            {loadingReviews ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#505A4A] border-t-transparent" />
                                </div>
                            ) : (
                                <div className="space-y-8 pb-8">
                                    {/* Rating summary */}
                                    {reviews.length > 0 && (
                                        <div className={`flex items-start gap-8 pb-8 border-b ${isDark ? 'border-[#3a3d36]' : 'border-[#E8E4DD]'}`}>
                                            <div className="text-center">
                                                <div className={`text-[42px] font-light leading-none ${isDark ? 'text-[#e8e4dc]' : 'text-gray-900'}`}>
                                                    {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                                                </div>
                                                <div className="flex items-center gap-0.5 justify-center mt-2">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={`avg-${i}`}
                                                            className={`h-4 w-4 ${
                                                                i < Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)
                                                                    ? 'text-[#C9A96E] fill-[#C9A96E]'
                                                                    : isDark ? 'text-gray-700 fill-gray-700' : 'text-gray-200 fill-gray-200'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                                <div className={`text-[12px] mt-1 ${isDark ? 'text-[#8a8273]' : 'text-[#999]'}`}>
                                                    {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-1.5">
                                                {[5, 4, 3, 2, 1].map((stars) => {
                                                    const count = reviews.filter(r => r.rating === stars).length;
                                                    const pct = (count / reviews.length) * 100;
                                                    return (
                                                        <div key={stars} className="flex items-center gap-2">
                                                            <span className={`text-[12px] w-3 text-right ${isDark ? 'text-[#8a8273]' : 'text-[#999]'}`}>{stars}</span>
                                                            <Star className="h-3 w-3 text-[#C9A96E] fill-[#C9A96E]" />
                                                            <div className={`flex-1 h-[6px] rounded-full overflow-hidden ${isDark ? 'bg-[#3a3d36]' : 'bg-[#E8E4DD]'}`}>
                                                                <div className="h-full bg-[#C9A96E] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                                            </div>
                                                            <span className={`text-[11px] w-6 text-right ${isDark ? 'text-[#6a6359]' : 'text-[#BBB]'}`}>{count}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Write review form */}
                                    {isAuthenticated && !userReview ? (
                                        <div className={`pb-8 border-b ${isDark ? 'border-[#3a3d36]' : 'border-[#E8E4DD]'}`}>
                                            <h3 className={`text-[13px] uppercase tracking-[0.08em] font-medium mb-4 ${isDark ? 'text-[#e8e4dc]' : 'text-gray-900'}`}>
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
                                                                    : isDark ? 'text-gray-700' : 'text-gray-200'
                                                            }`}
                                                        />
                                                    </button>
                                                ))}
                                                {reviewRating > 0 && (
                                                    <span className={`text-[12px] ml-2 ${isDark ? 'text-[#8a8273]' : 'text-[#999]'}`}>
                                                        {['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'][reviewRating]}
                                                    </span>
                                                )}
                                            </div>
                                            <textarea
                                                value={reviewComment}
                                                onChange={(e) => setReviewComment(e.target.value)}
                                                placeholder="Cuéntanos tu experiencia con este producto..."
                                                rows={3}
                                                className={`w-full border rounded-xl px-4 py-3 text-[14px] bg-transparent focus:outline-none transition-colors resize-none ${
                                                    isDark
                                                        ? 'border-[#3a3d36] text-[#e8e4dc] placeholder-[#6a6359] focus:border-[#C4B590]'
                                                        : 'border-[#D5D0C8] text-gray-900 placeholder-[#BBB] focus:border-[#505A4A]'
                                                }`}
                                            />
                                            <div className="flex items-center justify-between mt-3">
                                                {isVerifiedPurchase && (
                                                    <span className={`flex items-center gap-1 text-[11px] ${isDark ? 'text-[#8a8273]' : 'text-[#505A4A]'}`}>
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Compra verificada
                                                    </span>
                                                )}
                                                <button
                                                    onClick={handleSubmitReview}
                                                    disabled={reviewRating === 0 || submittingReview}
                                                    className="ml-auto px-6 py-2.5 bg-[#505A4A] text-white text-[12px] font-medium tracking-[0.08em] uppercase rounded-xl hover:bg-[#414A3C] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                                >
                                                    {submittingReview && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                                    Publicar reseña
                                                </button>
                                            </div>
                                        </div>
                                    ) : !isAuthenticated ? (
                                        <div className={`pb-8 border-b text-center py-6 ${isDark ? 'border-[#3a3d36]' : 'border-[#E8E4DD]'}`}>
                                            <p className={`text-[14px] mb-3 ${isDark ? 'text-[#8a8273]' : 'text-[#999]'}`}>
                                                Inicia sesión para dejar una reseña
                                            </p>
                                            <Link
                                                href="/auth"
                                                className={`inline-block px-6 py-2.5 text-[12px] font-medium tracking-[0.08em] uppercase rounded-xl border transition-all ${
                                                    isDark
                                                        ? 'border-[#C4B590] text-[#C4B590] hover:bg-[#C4B590] hover:text-[#1a1d19]'
                                                        : 'border-[#505A4A] text-[#505A4A] hover:bg-[#505A4A] hover:text-white'
                                                }`}
                                            >
                                                Iniciar sesión
                                            </Link>
                                        </div>
                                    ) : null}

                                    {/* Reviews list */}
                                    {reviews.length > 0 ? (
                                        <div className="space-y-5">
                                            {reviews.map((review) => (
                                                <div
                                                    key={review.id}
                                                    className={`pb-5 border-b last:border-0 ${isDark ? 'border-[#3a3d36]' : 'border-[#E8E4DD]'}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-[#505A4A]/20' : 'bg-[#505A4A]/10'}`}>
                                                            <User className={`h-4 w-4 ${isDark ? 'text-[#8a8273]' : 'text-[#505A4A]'}`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className={`text-[13px] font-medium ${isDark ? 'text-[#e8e4dc]' : 'text-gray-900'}`}>
                                                                    {review.userName}
                                                                </span>
                                                                {review.verified && (
                                                                    <span className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${isDark ? 'text-[#8a8273] bg-[#505A4A]/20' : 'text-[#505A4A] bg-[#505A4A]/8'}`}>
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
                                                                                    : isDark ? 'text-gray-700 fill-gray-700' : 'text-gray-200 fill-gray-200'
                                                                            }`}
                                                                        />
                                                                    ))}
                                                                </div>
                                                                <span className={`text-[11px] ${isDark ? 'text-[#6a6359]' : 'text-[#BBB]'}`}>
                                                                    {new Date(review.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                </span>
                                                            </div>
                                                            {review.comment && (
                                                                <p className={`text-[14px] font-light leading-relaxed mt-2 ${isDark ? 'text-[#a09889]' : 'text-[#666]'}`}>
                                                                    {review.comment}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <Star className={`h-8 w-8 mx-auto mb-3 ${isDark ? 'text-gray-700' : 'text-gray-200'}`} />
                                            <p className={`text-[14px] ${isDark ? 'text-[#8a8273]' : 'text-[#999]'}`}>
                                                Aún no hay reseñas para este producto
                                            </p>
                                            <p className={`text-[12px] mt-1 ${isDark ? 'text-[#6a6359]' : 'text-[#BBB]'}`}>
                                                Sé el primero en compartir tu opinión
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </m.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Cart Drawer */}
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
}
