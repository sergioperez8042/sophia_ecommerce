"use client";

import React, { useEffect } from 'react';
import { useAuth, usePricing } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  TrendingUp,
  Calendar,
  Award,
  Package,
  DollarSign,
  Users,
  Clock,
  Percent,
  Heart,
  Edit
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Datos simulados de estadísticas del gestor
const mockManagerStats = {
  totalSales: 45850.00,
  ordersThisMonth: 28,
  ordersToday: 3,
  activeClients: 42,
  averageOrderValue: 1637.50,
  conversionRate: 78,
  topProducts: [
    { name: 'Crema Hidratante Natural', quantity: 12, revenue: 239.88 },
    { name: 'Serum Vitamina C', quantity: 8, revenue: 255.92 },
    { name: 'Mascarilla Purificante', quantity: 15, revenue: 254.85 },
  ],
  recentOrders: [
    { id: 'SOP-ABC123', client: 'María López', date: '2024-12-22', total: 89.99, status: 'completed' },
    { id: 'SOP-DEF456', client: 'Ana García', date: '2024-12-21', total: 156.00, status: 'pending' },
    { id: 'SOP-GHI789', client: 'Carmen Ruiz', date: '2024-12-20', total: 234.50, status: 'completed' },
    { id: 'SOP-JKL012', client: 'Laura Sánchez', date: '2024-12-19', total: 78.99, status: 'shipped' },
  ],
  performance: {
    rank: 2,
    totalManagers: 5,
    monthlyTarget: 50000,
    currentProgress: 45850,
  }
};

// Datos simulados para clientes
const mockClientStats = {
  totalOrders: 5,
  totalSpent: 245.50,
  recentOrders: [
    { id: 'SOP-CLI001', date: '2024-12-20', total: 89.99, status: 'completed' },
    { id: 'SOP-CLI002', date: '2024-12-15', total: 45.50, status: 'completed' },
    { id: 'SOP-CLI003', date: '2024-12-10', total: 110.01, status: 'shipped' },
  ],
  savedProducts: 8,
};

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  completed: 'Completado',
  pending: 'Pendiente',
  shipped: 'Enviado',
  cancelled: 'Cancelado',
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoaded, isAdmin, isManager, isClient } = useAuth();
  const { isManagerPricing } = usePricing();

  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isLoaded, isAuthenticated, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A6741]" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Determinar el color del perfil según el rol
  const getProfileColors = () => {
    if (isAdmin) return { gradient: 'from-purple-600 to-purple-800', accent: 'purple' };
    if (isManager) return { gradient: 'from-amber-600 to-amber-800', accent: 'amber' };
    return { gradient: 'from-[#4A6741] to-[#3F5D4C]', accent: 'green' };
  };

  const colors = getProfileColors();
  const progressPercentage = isManager ? (mockManagerStats.performance.currentProgress / mockManagerStats.performance.monthlyTarget) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header del Perfil */}
        <div className="mb-8">
          <div className={`bg-gradient-to-r ${colors.gradient} rounded-2xl p-8 text-white relative overflow-hidden`}>
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
              {/* Avatar */}
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white/30">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>

              {/* Info Principal */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 opacity-90">
                  <Badge className="bg-white/20 text-white border-none">
                    {isAdmin ? 'Administrador' : isManager ? 'Gestor' : 'Cliente'}
                  </Badge>
                  {isManager && user.managerCode && (
                    <span className="flex items-center gap-1 text-sm">
                      <Award className="w-4 h-4" />
                      {user.managerCode}
                    </span>
                  )}
                  {isManager && user.zone && (
                    <span className="flex items-center gap-1 text-sm">
                      <MapPin className="w-4 h-4" />
                      {user.zone}
                    </span>
                  )}
                </div>

                {/* Descuento de gestor */}
                {isManagerPricing && (
                  <div className="mt-4 inline-flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                    <Percent className="w-5 h-5" />
                    <span className="font-medium">30% de descuento en todos los productos</span>
                  </div>
                )}
              </div>

              {/* Ranking para gestores */}
              {isManager && (
                <div className="text-center bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <Award className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm opacity-80">Ranking</p>
                  <p className="text-2xl font-bold">#{mockManagerStats.performance.rank}</p>
                  <p className="text-xs opacity-70">de {mockManagerStats.performance.totalManagers} gestores</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Información de Contacto
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-gray-500">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-[#4A6741]" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-[#4A6741]" />
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium">{user.phone || 'No especificado'}</p>
                </div>
              </div>
              {isManager && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-[#4A6741]" />
                  <div>
                    <p className="text-sm text-gray-500">Zona</p>
                    <p className="font-medium">{user.zone || 'No especificada'}</p>
                  </div>
                </div>
              )}
              {isClient && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-[#4A6741]" />
                  <div>
                    <p className="text-sm text-gray-500">Dirección</p>
                    <p className="font-medium">{user.address || 'No especificada'}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contenido específico por rol */}
        {isManager && (
          <>
            {/* Estadísticas Principales - Gestor */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Ventas del Mes</p>
                      <p className="text-2xl font-bold text-amber-600">
                        €{mockManagerStats.totalSales.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-100 rounded-full">
                      <DollarSign className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Pedidos del Mes</p>
                      <p className="text-2xl font-bold text-blue-600">{mockManagerStats.ordersThisMonth}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <ShoppingBag className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Clientes Activos</p>
                      <p className="text-2xl font-bold text-green-600">{mockManagerStats.activeClients}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Ticket Promedio</p>
                      <p className="text-2xl font-bold text-purple-600">
                        €{mockManagerStats.averageOrderValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Meta Mensual */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Progreso de Meta Mensual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Progreso actual</span>
                    <span className="font-medium">
                      €{mockManagerStats.performance.currentProgress.toLocaleString('es-ES')} / €{mockManagerStats.performance.monthlyTarget.toLocaleString('es-ES')}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-amber-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-center text-sm text-gray-600">
                    {progressPercentage >= 100
                      ? '🎉 ¡Meta alcanzada!'
                      : `Faltan €${(mockManagerStats.performance.monthlyTarget - mockManagerStats.performance.currentProgress).toLocaleString('es-ES')} para alcanzar la meta`
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Productos Top */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Productos Más Vendidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockManagerStats.topProducts.map((product, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center font-bold text-amber-600">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.quantity} unidades</p>
                        </div>
                        <p className="font-semibold text-amber-600">
                          €{product.revenue.toLocaleString('es-ES')}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pedidos Recientes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Pedidos Recientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockManagerStats.recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{order.id}</p>
                          <p className="text-sm text-gray-500">{order.client}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">€{order.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
                          <Badge className={statusColors[order.status]}>
                            {statusLabels[order.status]}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumen del Día */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Resumen del Día
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
                    <p className="text-4xl font-bold text-amber-600">{mockManagerStats.ordersToday}</p>
                    <p className="text-gray-600">Pedidos hoy</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                    <p className="text-4xl font-bold text-green-600">{mockManagerStats.conversionRate}%</p>
                    <p className="text-gray-600">Tasa de conversión</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <p className="text-4xl font-bold text-blue-600">4.8</p>
                    <p className="text-gray-600">Valoración clientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Contenido para clientes */}
        {isClient && (
          <>
            {/* Estadísticas del Cliente */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Gastado</p>
                      <p className="text-2xl font-bold text-[#4A6741]">
                        €{mockClientStats.totalSpent.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <DollarSign className="w-6 h-6 text-[#4A6741]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Pedidos</p>
                      <p className="text-2xl font-bold text-blue-600">{mockClientStats.totalOrders}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <ShoppingBag className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Favoritos</p>
                      <p className="text-2xl font-bold text-red-500">{mockClientStats.savedProducts}</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <Heart className="w-6 h-6 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Promedio</p>
                      <p className="text-2xl font-bold text-purple-600">
                        €{(mockClientStats.totalSpent / mockClientStats.totalOrders).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pedidos Recientes del Cliente */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Mis Pedidos Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockClientStats.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{order.id}</p>
                        <p className="text-sm text-gray-500">{order.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">€{order.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
                        <Badge className={statusColors[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CTA para seguir comprando */}
            <Card className="bg-gradient-to-r from-[#4A6741] to-[#3F5D4C] text-white">
              <CardContent className="pt-6 text-center">
                <h3 className="text-2xl font-bold mb-2">¿Lista para más belleza natural?</h3>
                <p className="opacity-90 mb-4">Descubre nuestros nuevos productos de temporada</p>
                <Link href="/products">
                  <Button className="bg-white text-[#4A6741] hover:bg-gray-100">
                    Ver Productos
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </>
        )}

        {/* Contenido para admin */}
        {isAdmin && (
          <Card className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
            <CardContent className="pt-6 text-center">
              <h3 className="text-2xl font-bold mb-2">Panel de Administración</h3>
              <p className="opacity-90 mb-4">Gestiona tu equipo y visualiza las estadísticas de ventas</p>
              <Link href="/admin">
                <Button className="bg-white text-purple-700 hover:bg-gray-100">
                  Ir al Panel Admin
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
