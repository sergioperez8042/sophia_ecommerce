"use client";

import { useEffect } from 'react';
import { useAuth } from '@/store';
import {
  Users,
  ShoppingBag,
  Layers,
  Mail,
  MapPin,
  Settings,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, isLoaded, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoaded && (!isAuthenticated || !isAdmin)) {
      router.push('/auth');
    }
  }, [isLoaded, isAuthenticated, isAdmin, router]);

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
    { label: 'Categorías', desc: 'Organizar productos', href: '/admin/categories', icon: Layers },
    { label: 'Newsletter', desc: 'Suscriptores y envíos', href: '/admin/newsletter', icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Panel de Administración</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona tu equipo y catálogo de productos</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Link href="/admin/gestores" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-[#505A4A]/30 transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Gestores</p>
                <p className="text-sm font-medium text-[#505A4A] mt-2 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Gestionar <ArrowRight className="w-3.5 h-3.5" />
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </Link>

          <Link href="/admin/products" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-[#505A4A]/30 transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Productos</p>
                <p className="text-sm font-medium text-[#505A4A] mt-2 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Ver todos <ArrowRight className="w-3.5 h-3.5" />
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </Link>

          <Link href="/admin/setup" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-[#505A4A]/30 transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Config</p>
                <p className="text-sm font-medium text-[#505A4A] mt-2 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Setup <ArrowRight className="w-3.5 h-3.5" />
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </Link>

          <Link href="/admin/estadisticas" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-[#505A4A]/30 transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Estadísticas</p>
                <p className="text-sm font-medium text-[#505A4A] mt-2 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Ver datos <ArrowRight className="w-3.5 h-3.5" />
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-[#505A4A]/30 transition-colors group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{action.label}</p>
                  <p className="text-sm font-medium text-[#505A4A] mt-2 flex items-center gap-1 group-hover:gap-2 transition-all">
                    {action.desc} <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <action.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Managers List - hidden for now */}

      </div>
    </div>
  );
}
