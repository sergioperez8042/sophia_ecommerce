"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/store';
import { GestorService, OrderService } from '@/lib/firestore-services';
import { IGestor, IOrder, ORDER_STATUSES, OrderStatus } from '@/entities/all';
import {
  LogOut,
  MapPin,
  Phone,
  Loader2,
  Package,
  Clock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  Truck,
  XCircle,
  ChevronDown,
  RefreshCw,
  User,
  FileText,
  Settings,
} from 'lucide-react';
import Image from 'next/image';
import { m, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

const STATUS_CONFIG: Record<OrderStatus, { icon: typeof Package; color: string; bg: string }> = {
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  confirmed: { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
  in_transit: { icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50' },
  delivered: { icon: Package, color: 'text-green-600', bg: 'bg-green-50' },
  cancelled: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'confirmed',
  confirmed: 'in_transit',
  in_transit: 'delivered',
};

export default function GestorDashboard() {
  const { user, logout } = useAuth();
  const [gestor, setGestor] = useState<IGestor | null>(null);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Change password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const loadGestorData = useCallback(async () => {
    if (!user?.gestorId) {
      setLoading(false);
      return;
    }
    try {
      const data = await GestorService.getById(user.gestorId);
      setGestor(data);
    } catch {
      // Error loading gestor data
    } finally {
      setLoading(false);
    }
  }, [user?.gestorId]);

  const loadOrders = useCallback(async () => {
    if (!gestor?.id) return;
    setOrdersLoading(true);
    try {
      const data = await OrderService.getByGestorId(gestor.id);
      setOrders(data);
    } catch (err) {
      console.error('Error loading orders:', err);
      toast.error('Error al cargar pedidos. Reintenta.');
    } finally {
      setOrdersLoading(false);
    }
  }, [gestor?.id]);

  useEffect(() => {
    loadGestorData();
  }, [loadGestorData]);

  useEffect(() => {
    if (gestor) loadOrders();
  }, [gestor, loadOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await OrderService.updateStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o))
      );
      toast.success(`Pedido actualizado a "${ORDER_STATUSES[newStatus]}"`);
    } catch {
      toast.error('Error al actualizar el pedido');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Completa ambos campos');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setChangingPassword(true);
    try {
      const currentUser = auth?.currentUser;
      if (!currentUser) throw new Error('No hay sesión activa');
      await updatePassword(currentUser, newPassword);
      toast.success('Contraseña actualizada correctamente');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (err) {
      const error = err as { code?: string };
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Por seguridad, cierra sesión y vuelve a entrar antes de cambiar la contraseña');
      } else {
        toast.error('Error al cambiar la contraseña');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#505A4A] border-t-transparent" />
      </div>
    );
  }

  const displayName = gestor?.name || user?.name || 'Gestor';
  const filteredOrders = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);

  // Stats
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const todayOrders = orders.filter((o) => {
    const today = new Date().toISOString().slice(0, 10);
    return o.createdAt.slice(0, 10) === today;
  }).length;
  const deliveredTotal = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + o.subtotal, 0);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      {/* Header — identical to admin Header style */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#1a1d19]/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left: Logo — same as Header.tsx */}
            <Link href="/gestor" className="flex items-center gap-2">
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-sm ring-1 ring-[#505A4A]/15 flex-shrink-0">
                <Image
                  src="/images/sophia_logo_nuevo.jpeg"
                  alt="Sophia"
                  fill
                  sizes="40px"
                  priority
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-semibold text-[#505A4A] leading-tight">Sophia</span>
                <span className="text-[10px] sm:text-xs text-[#505A4A]/60 leading-tight">Cosmética Botánica</span>
              </div>
            </Link>

            {/* Right: Badge + Logout */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#505A4A]/10 text-[#505A4A] dark:bg-[#505A4A]/20 dark:text-gray-300 uppercase tracking-wide">
                Gestor
              </span>
              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-8">
        {/* Page title — admin style */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            {gestor?.photoUrl ? (
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                <Image src={gestor.photoUrl} alt={displayName} width={40} height={40} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#505A4A] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Hola, {displayName}</h1>
              {gestor && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  {gestor.province} · {gestor.municipalities.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats — admin card style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Pedidos Hoy', value: String(todayOrders), icon: Package },
            { label: 'Pendientes', value: String(pendingCount), icon: Clock },
            { label: 'Total Pedidos', value: String(orders.length), icon: FileText },
            { label: 'Entregados', value: `$${deliveredTotal.toFixed(0)}`, icon: CheckCircle2 },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-2">{stat.value}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Orders Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
          {/* Orders header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-4.5 h-4.5 text-[#505A4A] dark:text-gray-400" />
              Pedidos
              {pendingCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">
                  {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
                </span>
              )}
            </h2>
            <button
              onClick={loadOrders}
              disabled={ordersLoading}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-1.5 px-5 py-3 overflow-x-auto border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setStatusFilter('all')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                statusFilter === 'all'
                  ? 'bg-[#505A4A] text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Todos ({orders.length})
            </button>
            {(Object.keys(ORDER_STATUSES) as OrderStatus[]).map((status) => {
              const count = orders.filter((o) => o.status === status).length;
              if (count === 0 && status === 'cancelled') return null;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    statusFilter === status
                      ? 'bg-[#505A4A] text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {ORDER_STATUSES[status]} ({count})
                </button>
              );
            })}
          </div>

          {/* Orders list */}
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {ordersLoading && orders.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#505A4A] border-t-transparent" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-10 h-10 text-gray-200 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {statusFilter === 'all' ? 'No hay pedidos aún' : `No hay pedidos "${ORDER_STATUSES[statusFilter as OrderStatus]}"`}
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const cfg = STATUS_CONFIG[order.status];
                const StatusIcon = cfg.icon;
                const isExpanded = expandedOrder === order.id;
                const nextStatus = NEXT_STATUS[order.status];

                return (
                  <div key={order.id}>
                    {/* Order row */}
                    <button
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                        <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{order.orderNumber}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                            {ORDER_STATUSES[order.status]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                          {order.customerName && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {order.customerName}
                            </span>
                          )}
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">${order.subtotal.toFixed(2)}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{order.items.length} producto{order.items.length > 1 ? 's' : ''}</p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-300 dark:text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <m.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-4 ml-12 space-y-3">
                            {/* Customer info */}
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-xs text-gray-500 dark:text-gray-400 space-y-1.5">
                              {order.customerPhone && (
                                <p className="flex items-center gap-1.5">
                                  <Phone className="w-3 h-3" />
                                  {order.customerPhone}
                                </p>
                              )}
                              <p className="flex items-center gap-1.5">
                                <MapPin className="w-3 h-3" />
                                {order.municipality}, {order.province}
                              </p>
                              {order.notes && (
                                <p className="text-gray-400 dark:text-gray-500 italic">&ldquo;{order.notes}&rdquo;</p>
                              )}
                            </div>

                            {/* Items */}
                            <div className="space-y-2">
                              {order.items.map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-xs">
                                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                                    {item.image ? (
                                      <Image src={item.image} alt={item.name} width={36} height={36} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Package className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                                      </div>
                                    )}
                                  </div>
                                  <span className="flex-1 text-gray-700 dark:text-gray-300 truncate">{item.name}</span>
                                  <span className="text-gray-400 dark:text-gray-500">x{item.quantity}</span>
                                  <span className="font-medium text-gray-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-1">
                              {nextStatus && (
                                <button
                                  onClick={() => handleStatusChange(order.id, nextStatus)}
                                  className="flex items-center gap-1.5 text-xs font-medium bg-[#505A4A] text-white px-4 py-2 rounded-lg hover:bg-[#414A3C] transition-colors"
                                >
                                  {STATUS_CONFIG[nextStatus].icon === Truck ? (
                                    <Truck className="w-3.5 h-3.5" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  Marcar como {ORDER_STATUSES[nextStatus]}
                                </button>
                              )}
                              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                <button
                                  onClick={() => handleStatusChange(order.id, 'cancelled')}
                                  className="flex items-center gap-1.5 text-xs font-medium text-red-500 dark:text-red-400 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Cancelar
                                </button>
                              )}
                            </div>
                          </div>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Settings Card — same admin card style */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-xl"
          >
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Configuración</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Contraseña y datos de zona</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showPasswordSection ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showPasswordSection && (
              <m.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4">
                  {/* Zone info */}
                  {gestor && gestor.municipalities.length > 0 && (
                    <div className="mb-5">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Zona de cobertura</p>
                      <div className="flex flex-wrap gap-1.5">
                        {gestor.municipalities.map((mun) => (
                          <span key={mun} className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                            {mun}
                          </span>
                        ))}
                      </div>
                      {gestor.whatsapp && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1.5">
                          <Phone className="w-3 h-3" /> +{gestor.whatsapp}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Password change */}
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Cambiar contraseña</p>
                  <div className="space-y-3 max-w-sm">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Nueva contraseña</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min. 6 caracteres"
                          className="w-full px-3 py-2.5 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[#505A4A]/20 focus:border-[#505A4A]/30 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Confirmar contraseña</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite la contraseña"
                        className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[#505A4A]/20 focus:border-[#505A4A]/30 outline-none"
                      />
                    </div>
                    <button
                      onClick={handleChangePassword}
                      disabled={changingPassword}
                      className="flex items-center gap-2 bg-[#505A4A] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#414A3C] transition-colors disabled:opacity-50"
                    >
                      {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                      {changingPassword ? 'Cambiando...' : 'Cambiar contraseña'}
                    </button>
                  </div>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
