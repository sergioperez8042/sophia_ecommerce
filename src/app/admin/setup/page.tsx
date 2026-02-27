"use client";

import { useState, useEffect } from 'react';
import { useAuth, useProducts } from '@/store';
import { ProductService, CategoryService, UserService } from '@/lib/firestore-services';
import ProductsData from '@/entities/Product.json';
import CategoriesData from '@/entities/Category.json';
import { IProduct, ICategory } from '@/entities/all';
import {
  Database,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  Package,
  Layers,
  ArrowLeft,
  RefreshCw,
  Users,
  Shield,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminGuard, PageHeader } from '@/components/ui/admin-components';

// Initial users data for seeding
const INITIAL_USERS = [
  {
    email: 'admin@sophia.com',
    password: 'admin123',
    name: 'Sergio Pérez',
    phone: '+34 600 000 001',
    role: 'admin' as const,
  },
  {
    email: 'maria@sophia.com',
    password: 'maria123',
    name: 'María García',
    phone: '+34 600 111 222',
    role: 'manager' as const,
    managerCode: 'MGR-001',
    zone: 'Madrid Centro',
  },
  {
    email: 'carlos@sophia.com',
    password: 'carlos123',
    name: 'Carlos López',
    phone: '+34 600 333 444',
    role: 'manager' as const,
    managerCode: 'MGR-002',
    zone: 'Barcelona',
  },
  {
    email: 'ana@sophia.com',
    password: 'ana123',
    name: 'Ana Martínez',
    phone: '+34 600 555 666',
    role: 'manager' as const,
    managerCode: 'MGR-003',
    zone: 'Valencia',
  },
  {
    email: 'laura@gmail.com',
    password: 'laura123',
    name: 'Laura Fernández',
    phone: '+34 600 999 000',
    role: 'client' as const,
    address: 'Calle Mayor 123',
    city: 'Madrid',
  },
];

export default function AdminSetupPage() {
  const router = useRouter();
  const { isAdmin, isLoaded, isAuthenticated } = useAuth();
  const { refreshProducts } = useProducts();

  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<{
    products: 'idle' | 'loading' | 'success' | 'error';
    categories: 'idle' | 'loading' | 'success' | 'error';
    users: 'idle' | 'loading' | 'success' | 'error';
    message: string;
    userErrors: string[];
  }>({
    products: 'idle',
    categories: 'idle',
    users: 'idle',
    message: '',
    userErrors: [],
  });

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

  const handleSeedCategories = async () => {
    setSeedStatus(prev => ({ ...prev, categories: 'loading', message: 'Subiendo categorías...' }));
    try {
      await CategoryService.seedFromJSON(CategoriesData as ICategory[]);
      setSeedStatus(prev => ({
        ...prev,
        categories: 'success',
        message: `${CategoriesData.length} categorías creadas correctamente`
      }));
    } catch {
      setSeedStatus(prev => ({
        ...prev,
        categories: 'error',
        message: 'Error al crear categorías'
      }));
    }
  };

  const handleSeedProducts = async () => {
    setSeedStatus(prev => ({ ...prev, products: 'loading', message: 'Subiendo productos...' }));
    try {
      await ProductService.seedFromJSON(ProductsData as IProduct[]);
      await refreshProducts();
      setSeedStatus(prev => ({
        ...prev,
        products: 'success',
        message: `${ProductsData.length} productos creados correctamente`
      }));
    } catch {
      setSeedStatus(prev => ({
        ...prev,
        products: 'error',
        message: 'Error al crear productos'
      }));
    }
  };

  const handleSeedUsers = async () => {
    setSeedStatus(prev => ({ ...prev, users: 'loading', message: 'Creando usuarios...', userErrors: [] }));
    try {
      const result = await UserService.seedUsers(INITIAL_USERS);
      if (result.errors.length > 0) {
        setSeedStatus(prev => ({
          ...prev,
          users: result.success > 0 ? 'success' : 'error',
          message: `${result.success} usuarios creados (${result.errors.length} errores)`,
          userErrors: result.errors,
        }));
      } else {
        setSeedStatus(prev => ({
          ...prev,
          users: 'success',
          message: `${result.success} usuarios creados correctamente`,
          userErrors: [],
        }));
      }
    } catch {
      setSeedStatus(prev => ({
        ...prev,
        users: 'error',
        message: 'Error al crear usuarios'
      }));
    }
  };

  const handleSeedAll = async () => {
    setIsSeeding(true);
    await handleSeedUsers();
    await handleSeedCategories();
    await handleSeedProducts();
    setIsSeeding(false);
  };

  const getStatusIcon = (status: 'idle' | 'loading' | 'success' | 'error') => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin text-[#505A4A]" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-200" />;
    }
  };

  const getStatusBadge = (status: 'idle' | 'loading' | 'success' | 'error') => {
    switch (status) {
      case 'loading':
        return <span className="text-xs text-[#505A4A] bg-[#505A4A]/10 px-2 py-0.5 rounded-full">Cargando...</span>;
      case 'success':
        return <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Completado</span>;
      case 'error':
        return <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Error</span>;
      default:
        return <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Pendiente</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pt-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#505A4A] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al panel
        </Link>

        <PageHeader
          title="Configuración"
          description="Inicializa Firebase con los datos de prueba"
        />

        {/* Seed Cards */}
        <div className="space-y-4 mt-8">
          {/* Users Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Usuarios</h3>
                  <p className="text-xs text-gray-500">{INITIAL_USERS.length} usuarios de prueba</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(seedStatus.users)}
                {getStatusIcon(seedStatus.users)}
              </div>
            </div>
            <div className="p-5">
              {/* User list preview */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="space-y-2">
                  {INITIAL_USERS.map((user) => (
                    <div key={user.email} className="flex items-center gap-2 text-xs sm:text-sm">
                      {user.role === 'admin' && <Shield className="w-3.5 h-3.5 text-gray-900 flex-shrink-0" />}
                      {user.role === 'manager' && <UserCheck className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />}
                      {user.role === 'client' && <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                      <span className="text-gray-800 font-medium truncate">{user.name}</span>
                      <span className="text-gray-400 truncate hidden sm:inline">({user.email})</span>
                      <span className="text-xs text-gray-400 bg-gray-200/60 px-1.5 py-0.5 rounded ml-auto flex-shrink-0">{user.role}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* User errors */}
              {seedStatus.userErrors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm">
                  <p className="font-medium text-amber-800 mb-1.5 text-xs">Algunos usuarios no se pudieron crear:</p>
                  <ul className="list-disc list-inside text-amber-700 space-y-0.5 text-xs">
                    {seedStatus.userErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={handleSeedUsers}
                disabled={isSeeding || seedStatus.users === 'loading'}
                className="inline-flex items-center gap-2 bg-[#505A4A] hover:bg-[#414A3C] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {seedStatus.users === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Crear Usuarios
              </button>
            </div>
          </div>

          {/* Categories Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Categorías</h3>
                  <p className="text-xs text-gray-500">{CategoriesData.length} categorías en Firestore</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(seedStatus.categories)}
                {getStatusIcon(seedStatus.categories)}
              </div>
            </div>
            <div className="p-5">
              <button
                onClick={handleSeedCategories}
                disabled={isSeeding || seedStatus.categories === 'loading'}
                className="inline-flex items-center gap-2 bg-[#505A4A] hover:bg-[#414A3C] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {seedStatus.categories === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Subir Categorías
              </button>
            </div>
          </div>

          {/* Products Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Package className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Productos</h3>
                  <p className="text-xs text-gray-500">{ProductsData.length} productos en Firestore</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(seedStatus.products)}
                {getStatusIcon(seedStatus.products)}
              </div>
            </div>
            <div className="p-5">
              <button
                onClick={handleSeedProducts}
                disabled={isSeeding || seedStatus.products === 'loading'}
                className="inline-flex items-center gap-2 bg-[#505A4A] hover:bg-[#414A3C] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {seedStatus.products === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Subir Productos
              </button>
            </div>
          </div>

          {/* Seed All */}
          <div className="bg-[#505A4A] rounded-xl shadow-sm">
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <Database className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Inicializar Todo</h3>
                  <p className="text-xs text-white/70">Usuarios, categorías y productos de una vez</p>
                </div>
              </div>
              <button
                onClick={handleSeedAll}
                disabled={isSeeding}
                className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-[#505A4A] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {isSeeding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Inicializar Base de Datos
              </button>
            </div>
          </div>

          {/* Status Message */}
          {seedStatus.message && (
            <div className={`rounded-xl border p-4 text-center text-sm font-medium ${
              seedStatus.message.includes('Error')
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}>
              {seedStatus.message}
            </div>
          )}
        </div>

        {/* Next Steps */}
        {seedStatus.products === 'success' && seedStatus.categories === 'success' && seedStatus.users === 'success' && (
          <div className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-900">
                Base de datos inicializada
              </h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Los usuarios, categorías y productos se han creado correctamente.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                href="/admin/products"
                className="inline-flex items-center justify-center gap-2 bg-[#505A4A] hover:bg-[#414A3C] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Ir a Productos
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Ver Tienda
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
