"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth, User } from '@/store';
import { UserService } from '@/lib/firestore-services';
import {
  Users,
  ShoppingBag,
  Layers,
  Mail,
  MapPin,
  Phone,
  ChevronRight,
  Calendar,
  Loader2,
  Database,
  Settings,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#505A4A] border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const quickActions = [
    { label: 'Productos', desc: 'Gestionar catálogo', href: '/admin/products', icon: ShoppingBag },
    { label: 'Categorías', desc: 'Organizar productos', href: '/admin/categories', icon: Layers },
    { label: 'Newsletter', desc: 'Suscriptores y envíos', href: '/admin/newsletter', icon: Mail },
    { label: 'Configuración', desc: 'Inicializar datos', href: '/admin/setup', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Panel de Administración</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona tu equipo y catálogo de productos</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gestores</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {isLoadingManagers ? '—' : managers.length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>

          <Link href="/admin/products" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#505A4A]/30 transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Productos</p>
                <p className="text-sm font-medium text-[#505A4A] mt-2 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Ver todos <ArrowRight className="w-3.5 h-3.5" />
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </Link>

          <Link href="/admin/setup" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#505A4A]/30 transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Config</p>
                <p className="text-sm font-medium text-[#505A4A] mt-2 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Setup <ArrowRight className="w-3.5 h-3.5" />
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Settings className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-xl border border-gray-200 p-5 opacity-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Estadísticas</p>
                <p className="text-sm text-gray-400 mt-2">Próximamente</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Managers List */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">Equipo de Gestores</h2>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {managers.length} gestores
            </span>
          </div>

          <div className="p-6">
            {isLoadingManagers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Cargando...</span>
              </div>
            ) : managers.length === 0 ? (
              <div className="text-center py-10">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No hay gestores registrados</p>
                <Link
                  href="/admin/setup"
                  className="text-sm text-[#505A4A] hover:underline mt-1 inline-block"
                >
                  Ir a Setup para crear usuarios →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {managers.map((manager) => (
                  <div key={manager.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="w-10 h-10 rounded-full bg-[#505A4A] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {manager.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{manager.name}</h3>
                        {manager.managerCode && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {manager.managerCode}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        {manager.zone && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {manager.zone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {manager.email}
                        </span>
                      </div>
                    </div>
                    <div className="hidden md:block text-xs text-gray-400">
                      {manager.createdAt
                        ? new Date(manager.createdAt).toLocaleDateString('es-ES')
                        : '—'
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#505A4A]/30 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-[#505A4A]/5 transition-colors">
                  <action.icon className="w-4 h-4 text-gray-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-gray-900">{action.label}</h3>
                  <p className="text-xs text-gray-500 truncate">{action.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
