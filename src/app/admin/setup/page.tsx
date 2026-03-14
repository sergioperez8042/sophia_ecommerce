"use client";

import { useState, useEffect } from 'react';
import { useAuth, useCatalogConfig } from '@/store';
import {
  ArrowLeft,
  Database,
  Info,
  LayoutGrid,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/admin-components';

export default function AdminSetupPage() {
  const router = useRouter();
  const { isAdmin, isLoaded, isAuthenticated } = useAuth();
  const { groupByCategory, setGroupByCategory, isLoading: configLoading } = useCatalogConfig();
  const [savingConfig, setSavingConfig] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pt-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-[#505A4A] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al panel
        </Link>

        <PageHeader
          title="Configuración"
          description="Gestión del sistema y base de datos"
        />

        <div className="space-y-4 mt-8">
          {/* Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Estado del Sistema</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Firebase conectado y operativo</p>
              </div>
            </div>
            <div className="p-5 text-sm text-gray-600 dark:text-gray-400 space-y-3">
              <p>Los productos y categorías se gestionan desde sus respectivas secciones en el panel de administración.</p>
              <p>Los usuarios se registran a través del sistema de autenticación.</p>
            </div>
          </div>

          {/* Catalog Config */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#505A4A]/10 flex items-center justify-center">
                <LayoutGrid className="w-4 h-4 text-[#505A4A]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Catálogo</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Configuración de visualización</p>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Agrupar por categoría</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Muestra los productos organizados por secciones de categoría en el catálogo</p>
                </div>
                <button
                  type="button"
                  disabled={configLoading || savingConfig}
                  onClick={async () => {
                    setSavingConfig(true);
                    await setGroupByCategory(!groupByCategory);
                    setSavingConfig(false);
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${groupByCategory ? 'bg-[#505A4A]' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${groupByCategory ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-[#505A4A] rounded-xl shadow-sm">
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <Database className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Accesos Rápidos</h3>
                  <p className="text-xs text-white/70">Gestiona tu catálogo directamente</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  href="/admin/products"
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 dark:hover:bg-gray-100 text-[#505A4A] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Gestionar Productos
                </Link>
                <Link
                  href="/admin/categories"
                  className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Gestionar Categorías
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
