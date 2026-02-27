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
  Award,
  Percent,
  Edit
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#505A4A]" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const getProfileColors = () => {
    if (isAdmin) return { gradient: 'from-[#505A4A] to-[#2E4529]' };
    if (isManager) return { gradient: 'from-amber-600 to-amber-800' };
    return { gradient: 'from-[#505A4A] to-[#414A3C]' };
  };

  const colors = getProfileColors();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header del Perfil */}
        <div className="mb-8">
          <div className={`bg-gradient-to-r ${colors.gradient} rounded-2xl p-8 text-white relative overflow-hidden shadow-xl`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />

            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
              {/* Avatar */}
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white/30 shadow-lg">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>

              {/* Info Principal */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2 text-white">{user.name}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 opacity-90">
                  <Badge className="bg-white/20 text-white border-none backdrop-blur-sm">
                    {isAdmin ? 'Administrador' : isManager ? 'Gestor' : 'Cliente'}
                  </Badge>
                  {isManager && user.managerCode && (
                    <span className="flex items-center gap-1 text-sm text-white">
                      <Award className="w-4 h-4" />
                      {user.managerCode}
                    </span>
                  )}
                  {isManager && user.zone && (
                    <span className="flex items-center gap-1 text-sm text-white">
                      <MapPin className="w-4 h-4" />
                      {user.zone}
                    </span>
                  )}
                </div>

                {isManagerPricing && (
                  <div className="mt-4 inline-flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2 backdrop-blur-sm">
                    <Percent className="w-5 h-5" />
                    <span className="font-medium">30% de descuento en todos los productos</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <Card className="mb-8 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <User className="w-5 h-5 text-[#505A4A]" />
              Información de Contacto
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-[#505A4A] hover:text-[#414A3C] hover:bg-green-50">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                <div className="p-2 bg-white rounded-full text-[#505A4A] shadow-sm">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="font-semibold text-gray-900">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                <div className="p-2 bg-white rounded-full text-[#505A4A] shadow-sm">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Teléfono</p>
                  <p className="font-semibold text-gray-900">{user.phone || 'No especificado'}</p>
                </div>
              </div>
              {isManager && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                  <div className="p-2 bg-white rounded-full text-[#505A4A] shadow-sm">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Zona</p>
                    <p className="font-semibold text-gray-900">{user.zone || 'No especificada'}</p>
                  </div>
                </div>
              )}
              {isClient && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                  <div className="p-2 bg-white rounded-full text-[#505A4A] shadow-sm">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Dirección</p>
                    <p className="font-semibold text-gray-900">{user.address || 'No especificada'}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CTA por rol */}
        {isAdmin && (
          <Card className="bg-gradient-to-r from-[#505A4A] to-[#414A3C] text-white">
            <CardContent className="pt-6 text-center">
              <h3 className="text-2xl font-bold mb-2">Panel de Administración</h3>
              <p className="opacity-90 mb-4">Gestiona tu equipo y visualiza las estadísticas de ventas</p>
              <Link href="/admin">
                <Button className="bg-white text-[#505A4A] hover:bg-gray-100 font-bold">
                  Ir al Panel Admin
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {(isManager || isClient) && (
          <Card className="bg-gradient-to-r from-[#505A4A] to-[#414A3C] text-white">
            <CardContent className="pt-6 text-center">
              <h3 className="text-2xl font-bold mb-2">
                {isManager ? 'Tu Catálogo' : '¿Lista para más belleza natural?'}
              </h3>
              <p className="opacity-90 mb-4">
                {isManager
                  ? 'Accede al catálogo con tu descuento de gestor'
                  : 'Descubre nuestros productos de temporada'
                }
              </p>
              <Link href="/">
                <Button className="bg-white text-[#505A4A] hover:bg-gray-100">
                  Ver Productos
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
