"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/store';
import { ReviewService, ProductService } from '@/lib/firestore-services';
import { IReview, IProduct } from '@/entities/all';
import {
  Star,
  Trash2,
  ArrowLeft,
  Search,
  MessageSquare,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AdminReviewsPage() {
  const router = useRouter();
  const { isAdmin, isLoaded, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && (!isAuthenticated || !isAdmin)) {
      router.push('/auth');
    }
  }, [isLoaded, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reviewsData, productsData] = await Promise.all([
        ReviewService.getAll(),
        ProductService.getAll(),
      ]);
      setReviews(reviewsData);
      setProducts(productsData);
    } catch {
      toast.error('Error al cargar reseñas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (review: IReview) => {
    if (!confirm(`¿Eliminar la reseña de ${review.userName}?`)) return;
    setDeleting(review.id);
    try {
      await ReviewService.delete(review.id, review.productId);
      toast.success('Reseña eliminada');
      await loadData();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeleting(null);
    }
  };

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Producto eliminado';
  };

  const filteredReviews = reviews.filter(r => {
    const matchesSearch = !search ||
      r.userName.toLowerCase().includes(search.toLowerCase()) ||
      r.comment.toLowerCase().includes(search.toLowerCase()) ||
      getProductName(r.productId).toLowerCase().includes(search.toLowerCase());
    const matchesProduct = !filterProduct || r.productId === filterProduct;
    return matchesSearch && matchesProduct;
  });

  // Products that have reviews (for filter dropdown)
  const reviewedProductIds = [...new Set(reviews.map(r => r.productId))];
  const reviewedProducts = products.filter(p => reviewedProductIds.includes(p.id));

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#505A4A] border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Reseñas</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'} en total
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{reviews.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Promedio</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Star className="h-5 w-5 text-[#C9A96E] fill-[#C9A96E]" />
              <span className="text-2xl font-semibold text-gray-900 dark:text-white">
                {reviews.length > 0
                  ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
                  : '—'}
              </span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Verificadas</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
              {reviews.filter(r => r.verified).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Productos</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
              {reviewedProductIds.length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por usuario, comentario o producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#505A4A]"
              />
            </div>
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent text-gray-900 dark:text-white focus:outline-none focus:border-[#505A4A]"
            >
              <option value="">Todos los productos</option>
              {reviewedProducts.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#505A4A] border-t-transparent" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {reviews.length === 0 ? 'No hay reseñas aún' : 'No se encontraron reseñas'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {review.userName}
                      </span>
                      {review.verified && (
                        <span className="flex items-center gap-0.5 text-[10px] text-[#505A4A] dark:text-green-400 bg-[#505A4A]/10 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Verificada
                        </span>
                      )}
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <Link
                      href={`/products/${review.productId}`}
                      className="text-xs text-[#505A4A] dark:text-[#C4B590] hover:underline"
                    >
                      {getProductName(review.productId)}
                    </Link>
                    <div className="flex items-center gap-0.5 mt-1.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < review.rating
                              ? 'text-[#C9A96E] fill-[#C9A96E]'
                              : 'text-gray-200 fill-gray-200 dark:text-gray-700 dark:fill-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(review)}
                    disabled={deleting === review.id}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                  >
                    {deleting === review.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
