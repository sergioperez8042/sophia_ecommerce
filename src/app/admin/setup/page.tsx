"use client";

import { useState } from 'react';
import { useAuth, useProducts } from '@/store';
import { ProductService, CategoryService, UserService } from '@/lib/firestore-services';
import ProductsData from '@/entities/Product.json';
import CategoriesData from '@/entities/Category.json';
import { IProduct, ICategory } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useEffect } from 'react';

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

  // Redirect if not admin
  useEffect(() => {
    if (isLoaded && (!isAuthenticated || !isAdmin)) {
      router.push('/auth');
    }
  }, [isLoaded, isAuthenticated, isAdmin, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#505A4A]" />
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
        message: `✅ ${CategoriesData.length} categorías creadas correctamente`
      }));
    } catch (error) {
      console.error('Error seeding categories:', error);
      setSeedStatus(prev => ({
        ...prev,
        categories: 'error',
        message: '❌ Error al crear categorías'
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
        message: `✅ ${ProductsData.length} productos creados correctamente`
      }));
    } catch (error) {
      console.error('Error seeding products:', error);
      setSeedStatus(prev => ({
        ...prev,
        products: 'error',
        message: '❌ Error al crear productos'
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
          message: `✅ ${result.success} usuarios creados (${result.errors.length} errores)`,
          userErrors: result.errors,
        }));
      } else {
        setSeedStatus(prev => ({
          ...prev,
          users: 'success',
          message: `✅ ${result.success} usuarios creados correctamente`,
          userErrors: [],
        }));
      }
    } catch (error) {
      console.error('Error seeding users:', error);
      setSeedStatus(prev => ({
        ...prev,
        users: 'error',
        message: '❌ Error al crear usuarios'
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
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-gray-500 hover:text-[#505A4A] transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al panel
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Configuración de Base de Datos
          </h1>
          <p className="text-gray-600 mt-1">
            Inicializa Firebase con los datos de prueba
          </p>
        </div>

        {/* Seed Cards */}
        <div className="space-y-6">
          {/* Users */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Usuarios
                </div>
                {getStatusIcon(seedStatus.users)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Crear {INITIAL_USERS.length} usuarios en Firebase Auth y Firestore
              </p>

              {/* User list preview */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                <div className="space-y-1">
                  {INITIAL_USERS.map((user) => (
                    <div key={user.email} className="flex items-center gap-2">
                      {user.role === 'admin' && <Shield className="w-4 h-4 text-red-500" />}
                      {user.role === 'manager' && <UserCheck className="w-4 h-4 text-blue-500" />}
                      {user.role === 'client' && <Users className="w-4 h-4 text-gray-500" />}
                      <span className="text-gray-700">{user.name}</span>
                      <span className="text-gray-500">({user.email})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* User errors */}
              {seedStatus.userErrors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm">
                  <p className="font-medium text-yellow-800 mb-2">Algunos usuarios no se pudieron crear:</p>
                  <ul className="list-disc list-inside text-yellow-700 space-y-1">
                    {seedStatus.userErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleSeedUsers}
                  disabled={isSeeding || seedStatus.users === 'loading'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {seedStatus.users === 'loading' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Crear Usuarios
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-600" />
                  Categorías
                </div>
                {getStatusIcon(seedStatus.categories)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Crear {CategoriesData.length} categorías en Firestore
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleSeedCategories}
                  disabled={isSeeding || seedStatus.categories === 'loading'}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {seedStatus.categories === 'loading' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Subir Categorías
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Products */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-600" />
                  Productos
                </div>
                {getStatusIcon(seedStatus.products)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Crear {ProductsData.length} productos en Firestore
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleSeedProducts}
                  disabled={isSeeding || seedStatus.products === 'loading'}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {seedStatus.products === 'loading' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Subir Productos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Seed All */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-[#505A4A] to-[#3d5636] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Inicializar Todo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 mb-4">
                Crear usuarios, categorías y productos de una vez
              </p>
              <Button
                onClick={handleSeedAll}
                disabled={isSeeding}
                variant="secondary"
                className="bg-white text-[#505A4A] hover:bg-gray-100"
              >
                {isSeeding ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Inicializar Base de Datos
              </Button>
            </CardContent>
          </Card>

          {/* Status Message */}
          {seedStatus.message && (
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <p className="text-center text-lg">{seedStatus.message}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Next Steps */}
        {seedStatus.products === 'success' && seedStatus.categories === 'success' && seedStatus.users === 'success' && (
          <div className="mt-8 p-6 bg-green-50 rounded-xl border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              ✅ ¡Base de datos inicializada!
            </h3>
            <p className="text-green-700 mb-4">
              Los usuarios, categorías y productos se han creado correctamente.
            </p>
            <div className="flex gap-3">
              <Link href="/admin/products">
                <Button className="bg-green-600 hover:bg-green-700">
                  Ir a Gestión de Productos
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="outline">
                  Ver Tienda
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
