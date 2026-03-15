"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/store';
import { OrderService, ReviewService, ProductService } from '@/lib/firestore-services';
import { IOrder, IReview, IProduct, ORDER_STATUSES, OrderStatus } from '@/entities/all';
import { useTheme } from '@/store/ThemeContext';
import {
  ArrowLeft,
  Package,
  Star,
  User,
  LogOut,
  Loader2,
  ShoppingBag,
  MessageSquare,
  MapPin,
  Phone,
  Mail,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { m, AnimatePresence } from 'framer-motion';
import BrandLogo from '@/components/BrandLogo';

type Tab = 'orders' | 'reviews' | 'profile';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  in_transit: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function MiCuentaPage() {
  const router = useRouter();
  const { user, isLoaded, isAuthenticated, isClient, logout, updateUser } = useAuth();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile editing
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isLoaded, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadData();
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
      });
    }
  }, [isAuthenticated, user?.id]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [ordersData, reviewsData, productsData] = await Promise.all([
        OrderService.getByCustomerEmail(user.email),
        ReviewService.getByUserId(user.id),
        ProductService.getAll(),
      ]);
      setOrders(ordersData);
      setReviews(reviewsData);
      setProducts(productsData);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateUser({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        address: profileForm.address.trim(),
        city: profileForm.city.trim(),
      });
      toast.success('Perfil actualizado');
      setEditing(false);
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/catalog');
  };

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Producto';
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'orders', label: 'Pedidos', icon: <Package className="w-4 h-4" />, count: orders.length },
    { id: 'reviews', label: 'Reseñas', icon: <MessageSquare className="w-4 h-4" />, count: reviews.length },
    { id: 'profile', label: 'Perfil', icon: <User className="w-4 h-4" /> },
  ];

  if (!isLoaded) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#1a1d19]' : 'bg-[#FEFCF7]'}`}>
        <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`} />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  const initials = user.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const totalSpent = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.subtotal, 0);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#1a1d19]' : 'bg-[#FEFCF7]'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-300 ${isDark ? 'bg-[#1a1d19]/95 border-[#C4B590]/15' : 'bg-white/80 border-[#505A4A]/10'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/catalog" className={`p-2 rounded-xl transition-colors ${isDark ? 'text-[#C4B590] hover:bg-[#C4B590]/15' : 'text-[#505A4A] hover:bg-[#505A4A]/10'}`}>
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className={`text-lg font-semibold ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}>Mi cuenta</h1>
            </div>
            <button
              onClick={handleLogout}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${isDark ? 'text-[#C4B590]/70 hover:text-[#C4B590] hover:bg-[#C4B590]/10' : 'text-[#505A4A]/60 hover:text-[#505A4A] hover:bg-[#505A4A]/10'}`}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* User Card */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-6 mb-6 ${isDark ? 'bg-[#232820] border border-[#C4B590]/15' : 'bg-white border border-[#505A4A]/10'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold ${isDark ? 'bg-[#C4B590]/20 text-[#C4B590]' : 'bg-[#505A4A]/10 text-[#505A4A]'}`}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className={`text-lg font-semibold truncate ${isDark ? 'text-white' : 'text-[#333]'}`}>{user.name}</h2>
              <p className={`text-sm truncate ${isDark ? 'text-[#C4B590]/60' : 'text-[#505A4A]/60'}`}>{user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-5">
            <div className="text-center">
              <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-[#333]'}`}>{orders.length}</p>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-[#C4B590]/50' : 'text-[#505A4A]/50'}`}>Pedidos</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-[#333]'}`}>{reviews.length}</p>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-[#C4B590]/50' : 'text-[#505A4A]/50'}`}>Reseñas</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-[#333]'}`}>{totalSpent.toFixed(0)}€</p>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-[#C4B590]/50' : 'text-[#505A4A]/50'}`}>Total</p>
            </div>
          </div>
        </m.div>

        {/* Tabs */}
        <div className={`flex gap-1 p-1 rounded-xl mb-6 ${isDark ? 'bg-[#232820]' : 'bg-[#505A4A]/5'}`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? isDark
                    ? 'bg-[#C4B590]/20 text-[#C4B590]'
                    : 'bg-white text-[#505A4A] shadow-sm'
                  : isDark
                    ? 'text-[#C4B590]/40 hover:text-[#C4B590]/60'
                    : 'text-[#505A4A]/40 hover:text-[#505A4A]/60'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id
                    ? isDark ? 'bg-[#C4B590]/30' : 'bg-[#505A4A]/10'
                    : isDark ? 'bg-[#C4B590]/10' : 'bg-[#505A4A]/5'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`} />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <m.div
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {orders.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingBag className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-[#C4B590]/30' : 'text-[#505A4A]/20'}`} />
                    <p className={`text-sm ${isDark ? 'text-[#C4B590]/50' : 'text-[#505A4A]/50'}`}>Aún no tienes pedidos</p>
                    <Link
                      href="/catalog"
                      className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-[#C4B590]/20 text-[#C4B590] hover:bg-[#C4B590]/30' : 'bg-[#505A4A] text-white hover:bg-[#414A3C]'}`}
                    >
                      Explorar catálogo
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <m.div
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`rounded-xl p-4 ${isDark ? 'bg-[#232820] border border-[#C4B590]/10' : 'bg-white border border-[#505A4A]/10'}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-[#333]'}`}>
                              {order.orderNumber}
                            </p>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#C4B590]/50' : 'text-[#505A4A]/50'}`}>
                              {new Date(order.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                            {ORDER_STATUSES[order.status]}
                          </span>
                        </div>
                        <div className={`space-y-2 ${isDark ? 'divide-[#C4B590]/10' : 'divide-[#505A4A]/5'} divide-y`}>
                          {order.items.map((item, i) => (
                            <div key={i} className={`flex items-center justify-between ${i > 0 ? 'pt-2' : ''}`}>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm truncate ${isDark ? 'text-[#e8e4dc]' : 'text-[#333]'}`}>{item.name}</p>
                                <p className={`text-xs ${isDark ? 'text-[#C4B590]/40' : 'text-[#505A4A]/40'}`}>x{item.quantity}</p>
                              </div>
                              <p className={`text-sm font-medium ml-4 ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}>
                                {(item.price * item.quantity).toFixed(2)}€
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className={`flex justify-between items-center mt-3 pt-3 border-t ${isDark ? 'border-[#C4B590]/10' : 'border-[#505A4A]/5'}`}>
                          <p className={`text-xs ${isDark ? 'text-[#C4B590]/40' : 'text-[#505A4A]/40'}`}>
                            {order.items.reduce((s, i) => s + i.quantity, 0)} artículos
                          </p>
                          <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#333]'}`}>
                            Total: {order.subtotal.toFixed(2)}€
                          </p>
                        </div>
                      </m.div>
                    ))}
                  </div>
                )}
              </m.div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <m.div
                key="reviews"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {reviews.length === 0 ? (
                  <div className="text-center py-16">
                    <MessageSquare className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-[#C4B590]/30' : 'text-[#505A4A]/20'}`} />
                    <p className={`text-sm ${isDark ? 'text-[#C4B590]/50' : 'text-[#505A4A]/50'}`}>No has escrito reseñas aún</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((review) => (
                      <m.div
                        key={review.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`rounded-xl p-4 ${isDark ? 'bg-[#232820] border border-[#C4B590]/10' : 'bg-white border border-[#505A4A]/10'}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Link
                            href={`/catalog/${review.productId}`}
                            className={`text-sm font-medium hover:underline ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}
                          >
                            {getProductName(review.productId)}
                          </Link>
                          <span className={`text-xs ${isDark ? 'text-[#C4B590]/40' : 'text-[#505A4A]/40'}`}>
                            {new Date(review.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < review.rating
                                  ? 'text-[#C9A96E] fill-[#C9A96E]'
                                  : isDark
                                    ? 'text-[#3a3d36] fill-[#3a3d36]'
                                    : 'text-gray-200 fill-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        {review.comment && (
                          <p className={`text-sm leading-relaxed ${isDark ? 'text-[#e8e4dc]/80' : 'text-[#333]/80'}`}>
                            {review.comment}
                          </p>
                        )}
                      </m.div>
                    ))}
                  </div>
                )}
              </m.div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <m.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className={`rounded-xl p-5 ${isDark ? 'bg-[#232820] border border-[#C4B590]/10' : 'bg-white border border-[#505A4A]/10'}`}>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className={`text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-[#C4B590]/60' : 'text-[#505A4A]/60'}`}>
                      Datos personales
                    </h3>
                    {!editing ? (
                      <button
                        onClick={() => setEditing(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isDark ? 'text-[#C4B590] hover:bg-[#C4B590]/15' : 'text-[#505A4A] hover:bg-[#505A4A]/10'}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Editar
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditing(false); setProfileForm({ name: user.name || '', phone: user.phone || '', address: user.address || '', city: user.city || '' }); }}
                          className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-[#C4B590]/50 hover:text-[#C4B590] hover:bg-[#C4B590]/10' : 'text-[#505A4A]/50 hover:text-[#505A4A] hover:bg-[#505A4A]/10'}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-[#C4B590] bg-[#C4B590]/20 hover:bg-[#C4B590]/30' : 'text-white bg-[#505A4A] hover:bg-[#414A3C]'}`}
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Name */}
                    <div className="flex items-start gap-3">
                      <User className={`w-4 h-4 mt-1 flex-shrink-0 ${isDark ? 'text-[#C4B590]/40' : 'text-[#505A4A]/40'}`} />
                      <div className="flex-1">
                        <p className={`text-xs mb-1 ${isDark ? 'text-[#C4B590]/40' : 'text-[#505A4A]/40'}`}>Nombre</p>
                        {editing ? (
                          <input
                            type="text"
                            value={profileForm.name}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                            className={`w-full px-3 py-2 rounded-lg text-sm border focus:outline-none ${isDark ? 'bg-[#1a1d19] border-[#C4B590]/20 text-white focus:border-[#C4B590]/40' : 'bg-[#FEFCF7] border-[#505A4A]/15 text-[#333] focus:border-[#505A4A]/30'}`}
                          />
                        ) : (
                          <p className={`text-sm ${isDark ? 'text-white' : 'text-[#333]'}`}>{user.name}</p>
                        )}
                      </div>
                    </div>

                    {/* Email (read-only) */}
                    <div className="flex items-start gap-3">
                      <Mail className={`w-4 h-4 mt-1 flex-shrink-0 ${isDark ? 'text-[#C4B590]/40' : 'text-[#505A4A]/40'}`} />
                      <div className="flex-1">
                        <p className={`text-xs mb-1 ${isDark ? 'text-[#C4B590]/40' : 'text-[#505A4A]/40'}`}>Email</p>
                        <p className={`text-sm ${isDark ? 'text-white/60' : 'text-[#333]/60'}`}>{user.email}</p>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-3">
                      <Phone className={`w-4 h-4 mt-1 flex-shrink-0 ${isDark ? 'text-[#C4B590]/40' : 'text-[#505A4A]/40'}`} />
                      <div className="flex-1">
                        <p className={`text-xs mb-1 ${isDark ? 'text-[#C4B590]/40' : 'text-[#505A4A]/40'}`}>Teléfono</p>
                        {editing ? (
                          <input
                            type="tel"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Ej: 612 345 678"
                            className={`w-full px-3 py-2 rounded-lg text-sm border focus:outline-none ${isDark ? 'bg-[#1a1d19] border-[#C4B590]/20 text-white placeholder-[#C4B590]/20 focus:border-[#C4B590]/40' : 'bg-[#FEFCF7] border-[#505A4A]/15 text-[#333] placeholder-[#505A4A]/20 focus:border-[#505A4A]/30'}`}
                          />
                        ) : (
                          <p className={`text-sm ${isDark ? 'text-white' : 'text-[#333]'}`}>{user.phone || '—'}</p>
                        )}
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-3">
                      <MapPin className={`w-4 h-4 mt-1 flex-shrink-0 ${isDark ? 'text-[#C4B590]/40' : 'text-[#505A4A]/40'}`} />
                      <div className="flex-1">
                        <p className={`text-xs mb-1 ${isDark ? 'text-[#C4B590]/40' : 'text-[#505A4A]/40'}`}>Dirección</p>
                        {editing ? (
                          <input
                            type="text"
                            value={profileForm.address}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Tu dirección de envío"
                            className={`w-full px-3 py-2 rounded-lg text-sm border focus:outline-none ${isDark ? 'bg-[#1a1d19] border-[#C4B590]/20 text-white placeholder-[#C4B590]/20 focus:border-[#C4B590]/40' : 'bg-[#FEFCF7] border-[#505A4A]/15 text-[#333] placeholder-[#505A4A]/20 focus:border-[#505A4A]/30'}`}
                          />
                        ) : (
                          <p className={`text-sm ${isDark ? 'text-white' : 'text-[#333]'}`}>{user.address || '—'}</p>
                        )}
                      </div>
                    </div>

                    {/* City */}
                    <div className="flex items-start gap-3">
                      <MapPin className={`w-4 h-4 mt-1 flex-shrink-0 ${isDark ? 'text-[#C4B590]/40' : 'text-[#505A4A]/40'}`} />
                      <div className="flex-1">
                        <p className={`text-xs mb-1 ${isDark ? 'text-[#C4B590]/40' : 'text-[#505A4A]/40'}`}>Ciudad</p>
                        {editing ? (
                          <input
                            type="text"
                            value={profileForm.city}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, city: e.target.value }))}
                            placeholder="Tu ciudad"
                            className={`w-full px-3 py-2 rounded-lg text-sm border focus:outline-none ${isDark ? 'bg-[#1a1d19] border-[#C4B590]/20 text-white placeholder-[#C4B590]/20 focus:border-[#C4B590]/40' : 'bg-[#FEFCF7] border-[#505A4A]/15 text-[#333] placeholder-[#505A4A]/20 focus:border-[#505A4A]/30'}`}
                          />
                        ) : (
                          <p className={`text-sm ${isDark ? 'text-white' : 'text-[#333]'}`}>{user.city || '—'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Member since */}
                  <div className={`mt-6 pt-4 border-t ${isDark ? 'border-[#C4B590]/10' : 'border-[#505A4A]/5'}`}>
                    <p className={`text-xs ${isDark ? 'text-[#C4B590]/30' : 'text-[#505A4A]/30'}`}>
                      Miembro desde {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
