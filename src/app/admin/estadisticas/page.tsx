"use client";

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/store';
import { GestorService, OrderService } from '@/lib/firestore-services';
import { IGestor, IOrder, ORDER_STATUSES, OrderStatus } from '@/entities/all';
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ChevronDown,
  MapPin,
  Phone,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { m, AnimatePresence } from 'framer-motion';

interface GestorStats {
  gestor: IGestor;
  orders: IOrder[];
  totalSales: number;
  monthSales: number;
  collected: number;
  pending: number;
  orderCount: number;
  deliveredCount: number;
  pendingCount: number;
  inTransitCount: number;
  cancelledCount: number;
  productsSold: number;
}

export default function EstadisticasPage() {
  const router = useRouter();
  const { isAdmin, isLoaded, isAuthenticated } = useAuth();
  const [gestores, setGestores] = useState<IGestor[]>([]);
  const [allOrders, setAllOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGestor, setExpandedGestor] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'sales' | 'orders' | 'pending' | 'name'>('sales');

  useEffect(() => {
    if (isLoaded && (!isAuthenticated || !isAdmin)) {
      router.push('/auth');
    }
  }, [isLoaded, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    const loadData = async () => {
      try {
        const [gestoresData, ordersData] = await Promise.all([
          GestorService.getAll(),
          OrderService.getAll(),
        ]);
        setGestores(gestoresData);
        setAllOrders(ordersData);
      } catch (err) {
        console.error('Error loading stats:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isAdmin]);

  const thisMonth = new Date().toISOString().slice(0, 7);

  // Build stats per gestor
  const gestorStats: GestorStats[] = useMemo(() => {
    return gestores.map((gestor) => {
      const orders = allOrders.filter((o) => o.gestorId === gestor.id);
      const active = orders.filter((o) => o.status !== 'cancelled');
      const monthOrders = active.filter((o) => o.createdAt.slice(0, 7) === thisMonth);

      return {
        gestor,
        orders,
        totalSales: active.reduce((s, o) => s + o.subtotal, 0),
        monthSales: monthOrders.reduce((s, o) => s + o.subtotal, 0),
        collected: orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.subtotal, 0),
        pending: orders.filter((o) => ['pending', 'confirmed', 'in_transit'].includes(o.status)).reduce((s, o) => s + o.subtotal, 0),
        orderCount: active.length,
        deliveredCount: orders.filter((o) => o.status === 'delivered').length,
        pendingCount: orders.filter((o) => o.status === 'pending').length,
        inTransitCount: orders.filter((o) => o.status === 'in_transit').length,
        cancelledCount: orders.filter((o) => o.status === 'cancelled').length,
        productsSold: active.reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0),
      };
    });
  }, [gestores, allOrders, thisMonth]);

  // Sort
  const sortedStats = useMemo(() => {
    const sorted = [...gestorStats];
    switch (sortBy) {
      case 'sales': return sorted.sort((a, b) => b.monthSales - a.monthSales);
      case 'orders': return sorted.sort((a, b) => b.orderCount - a.orderCount);
      case 'pending': return sorted.sort((a, b) => b.pending - a.pending);
      case 'name': return sorted.sort((a, b) => a.gestor.name.localeCompare(b.gestor.name));
    }
  }, [gestorStats, sortBy]);

  // Global totals
  const globalStats = useMemo(() => {
    const active = allOrders.filter((o) => o.status !== 'cancelled');
    const month = active.filter((o) => o.createdAt.slice(0, 7) === thisMonth);
    return {
      totalOrders: active.length,
      totalSales: active.reduce((s, o) => s + o.subtotal, 0),
      monthSales: month.reduce((s, o) => s + o.subtotal, 0),
      monthOrders: month.length,
      collected: allOrders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.subtotal, 0),
      pendingAmount: allOrders.filter((o) => ['pending', 'confirmed', 'in_transit'].includes(o.status)).reduce((s, o) => s + o.subtotal, 0),
      delivered: allOrders.filter((o) => o.status === 'delivered').length,
      pending: allOrders.filter((o) => o.status === 'pending').length,
      inTransit: allOrders.filter((o) => o.status === 'in_transit').length,
      cancelled: allOrders.filter((o) => o.status === 'cancelled').length,
      activeGestores: gestores.filter((g) => g.active).length,
      totalGestores: gestores.length,
      productsSold: active.reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0),
    };
  }, [allOrders, gestores, thisMonth]);

  // Orders without gestor
  const unassignedOrders = useMemo(() => {
    return allOrders.filter((o) => !o.gestorId || o.gestorId === '');
  }, [allOrders]);

  const fmt = (n: number) => `$${n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  if (!isLoaded || loading) {
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
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-[#505A4A] dark:hover:text-gray-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Admin
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Estadísticas de Gestores</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Rendimiento y números de cada gestor
          </p>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ventas del Mes</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-2">{fmt(globalStats.monthSales)}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{globalStats.monthOrders} pedidos</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#505A4A]/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#505A4A]" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Por Cobrar</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-2">{fmt(globalStats.pendingAmount)}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{globalStats.pending + globalStats.inTransit} en proceso</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#505A4A]/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#505A4A]" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cobrado Total</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-2">{fmt(globalStats.collected)}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{globalStats.delivered} entregados</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#505A4A]/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#505A4A]" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Gestores</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-2">{globalStats.activeGestores}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{globalStats.totalGestores} registrados</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#505A4A]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#505A4A]" />
              </div>
            </div>
          </div>
        </div>

        {/* Summary bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
              <span>
                <span className="font-semibold text-gray-900 dark:text-white text-sm">{globalStats.totalOrders}</span> pedidos totales
              </span>
              <span>
                <span className="font-semibold text-gray-900 dark:text-white text-sm">{globalStats.productsSold}</span> productos vendidos
              </span>
              <span>
                Venta total: <span className="font-semibold text-gray-900 dark:text-white text-sm">{fmt(globalStats.totalSales)}</span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {globalStats.pending} pendientes</span>
              <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> {globalStats.inTransit} en camino</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {globalStats.delivered} entregados</span>
              {globalStats.cancelled > 0 && (
                <span className="flex items-center gap-1"><XCircle className="w-3 h-3" /> {globalStats.cancelled} cancelados</span>
              )}
            </div>
          </div>
        </div>

        {/* Gestores ranking */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-[#505A4A] dark:text-gray-400" />
              Rendimiento por Gestor
            </h2>
            <div className="flex items-center gap-1">
              {([
                { key: 'sales', label: 'Ventas' },
                { key: 'orders', label: 'Pedidos' },
                { key: 'pending', label: 'Deuda' },
                { key: 'name', label: 'Nombre' },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSortBy(opt.key)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    sortBy === opt.key
                      ? 'bg-[#505A4A] text-white'
                      : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {sortedStats.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-gray-200 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">No hay gestores registrados</p>
              </div>
            ) : (
              sortedStats.map((stat, index) => {
                const isExpanded = expandedGestor === stat.gestor.id;
                const topSeller = index === 0 && stat.monthSales > 0;

                return (
                  <div key={stat.gestor.id}>
                    <button
                      onClick={() => setExpandedGestor(isExpanded ? null : stat.gestor.id)}
                      className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      {/* Rank + Avatar */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-xs font-bold w-5 text-center ${topSeller ? 'text-[#505A4A]' : 'text-gray-300 dark:text-gray-600'}`}>
                          {index + 1}
                        </span>
                        {stat.gestor.photoUrl ? (
                          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                            <Image src={stat.gestor.photoUrl} alt={stat.gestor.name} width={36} height={36} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#505A4A]/10 flex items-center justify-center text-[#505A4A] text-xs font-semibold flex-shrink-0">
                            {stat.gestor.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Name + zone */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{stat.gestor.name}</span>
                          {!stat.gestor.active && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 font-medium">
                              Inactivo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                          {stat.gestor.province} · {stat.orderCount} pedidos · {stat.productsSold} productos
                        </p>
                      </div>

                      {/* Key numbers */}
                      <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">Mes</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{fmt(stat.monthSales)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">Cobrado</p>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{fmt(stat.collected)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">Por cobrar</p>
                          <p className={`text-sm font-semibold ${stat.pending > 0 ? 'text-[#505A4A]' : 'text-gray-400 dark:text-gray-500'}`}>
                            {fmt(stat.pending)}
                          </p>
                        </div>
                      </div>

                      <ChevronDown className={`w-4 h-4 text-gray-300 dark:text-gray-600 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
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
                          <div className="px-5 pb-5 ml-[68px]">
                            {/* Contact info */}
                            <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 mb-4">
                              {stat.gestor.whatsapp && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  +{stat.gestor.whatsapp}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {stat.gestor.municipalities.join(', ')}
                              </span>
                            </div>

                            {/* Financial grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Venta Total</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{fmt(stat.totalSales)}</p>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Venta del Mes</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{fmt(stat.monthSales)}</p>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Cobrado</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{fmt(stat.collected)}</p>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Por Cobrar</p>
                                <p className={`text-lg font-bold mt-1 ${stat.pending > 0 ? 'text-[#505A4A]' : 'text-gray-400 dark:text-gray-500'}`}>
                                  {fmt(stat.pending)}
                                </p>
                              </div>
                            </div>

                            {/* Order status breakdown */}
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[#505A4A]" />
                                {stat.pendingCount} pendientes
                              </span>
                              <span className="flex items-center gap-1">
                                <Truck className="w-3 h-3 text-[#505A4A]" />
                                {stat.inTransitCount} en camino
                              </span>
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-[#505A4A]" />
                                {stat.deliveredCount} entregados
                              </span>
                              {stat.cancelledCount > 0 && (
                                <span className="flex items-center gap-1">
                                  <XCircle className="w-3 h-3 text-red-400" />
                                  {stat.cancelledCount} cancelados
                                </span>
                              )}
                            </div>

                            {/* Recent orders preview */}
                            {stat.orders.length > 0 && (
                              <div className="mt-4">
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Últimos pedidos</p>
                                <div className="space-y-1.5">
                                  {stat.orders.slice(0, 5).map((order) => (
                                    <div key={order.id} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{order.orderNumber}</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                          order.status === 'cancelled' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-[#505A4A]/10 text-[#505A4A]'
                                        }`}>
                                          {ORDER_STATUSES[order.status]}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-gray-400 dark:text-gray-500">
                                          {new Date(order.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                        </span>
                                        <span className="font-semibold text-gray-900 dark:text-white">${order.subtotal.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
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

        {/* Unassigned orders */}
        {unassignedOrders.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="w-4.5 h-4.5 text-gray-400" />
                Pedidos sin Gestor
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium">
                  {unassignedOrders.length}
                </span>
              </h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {unassignedOrders.slice(0, 10).map((order) => (
                <div key={order.id} className="flex items-center justify-between px-5 py-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{order.orderNumber}</span>
                    <span className="text-gray-400 dark:text-gray-500">{order.customerName || 'Sin nombre'}</span>
                    <span className="text-gray-300 dark:text-gray-600">
                      {order.municipality}, {order.province}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">${order.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
