"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth, User } from '@/store';
import { UserService } from '@/lib/firestore-services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Award,
  Eye,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  BarChart3,
  Calendar,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, isLoaded, isAuthenticated } = useAuth();
  const [managers, setManagers] = useState<User[]>([]);
  const [isLoadingManagers, setIsLoadingManagers] = useState(true);

  useEffect(() => {
    if (isLoaded && (!isAuthenticated || !isAdmin)) {
      router.push('/auth');
    }
  }, [isLoaded, isAuthenticated, isAdmin, router]);

  const loadManagers = useCallback(async () => {
    try {
      setIsLoadingManagers(true);
      const managersData = await UserService.getManagers();
      setManagers(managersData);
    } catch (error) {
      console.error('Error loading managers:', error);
    } finally {
      setIsLoadingManagers(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadManagers();
    }
  }, [isAdmin, loadManagers]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A6741]" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600 mt-1">Gestiona tu equipo de ventas y visualiza estadísticas</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Gestores Activos</p>
                    <p className="text-2xl font-bold text-green-600">
                      {isLoadingManagers ? '...' : managers.length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">En el equipo</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Productos</p>
                    <p className="text-2xl font-bold text-blue-600">
                      <Link href="/admin/products" className="hover:underline">
                        Ver todos →
                      </Link>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Gestionar catálogo</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <ShoppingBag className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Configuración</p>
                    <p className="text-2xl font-bold text-purple-600">
                      <Link href="/admin/setup" className="hover:underline">
                        Setup →
                      </Link>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Base de datos</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Estadísticas</p>
                    <p className="text-2xl font-bold text-amber-600">Próximamente</p>
                    <p className="text-xs text-gray-500 mt-1">Ventas y métricas</p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-full">
                    <TrendingUp className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Managers List */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Equipo de Gestores
              </div>
              <Badge variant="secondary">{managers.length} gestores</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingManagers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Cargando gestores...</span>
              </div>
            ) : managers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No hay gestores registrados</p>
                <p className="text-sm text-gray-400 mt-1">
                  Ve a <Link href="/admin/setup" className="text-[#4A6741] hover:underline">Setup</Link> para crear usuarios iniciales
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {managers.map((manager, index) => {
                  return (
                    <motion.div
                      key={manager.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        {/* Avatar */}
                        <div className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-lg">
                          {manager.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{manager.name}</h3>
                            {manager.managerCode && (
                              <Badge className="bg-amber-100 text-amber-800 border-none">
                                {manager.managerCode}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            {manager.zone && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {manager.zone}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {manager.email}
                            </span>
                            {manager.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {manager.phone}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Created date */}
                        <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {manager.createdAt
                            ? new Date(manager.createdAt).toLocaleDateString('es-ES')
                            : 'N/A'
                          }
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Link href="/admin/products">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <ShoppingBag className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Gestión de Productos</h3>
                    <p className="text-sm text-gray-500">Crear, editar y eliminar productos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Reportes</h3>
                  <p className="text-sm text-gray-500">Ver estadísticas detalladas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Metas del Mes</h3>
                  <p className="text-sm text-gray-500">Configurar objetivos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
