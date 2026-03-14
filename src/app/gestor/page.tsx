"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/store';
import { GestorService } from '@/lib/firestore-services';
import { IGestor } from '@/entities/all';
import {
  LogOut,
  MapPin,
  Phone,
  Loader2,
  Package,
  Users,
  TrendingUp,
  Clock,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import Image from 'next/image';
import { m } from 'framer-motion';
import { toast } from 'sonner';
import { updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import BrandLogo from '@/components/BrandLogo';

export default function GestorDashboard() {
  const { user, logout } = useAuth();
  const [gestor, setGestor] = useState<IGestor | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadGestorData();
  }, [loadGestorData]);

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

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <Loader2 className="w-6 h-6 animate-spin text-[#505A4A]" />
      </div>
    );
  }

  const displayName = gestor?.name || user?.name || 'Gestor';

  // Stats cards (placeholder data)
  const stats = [
    { label: 'Pedidos Hoy', value: '0', icon: Package, color: 'text-blue-600 bg-blue-50' },
    { label: 'Clientes', value: '0', icon: Users, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Ventas del Mes', value: '$0', icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
    { label: 'Pendientes', value: '0', icon: Clock, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <BrandLogo size="sm" showText linkTo="/gestor" />
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#505A4A]/8 text-[#505A4A]">
              Gestor
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Card */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6"
        >
          <div className="flex items-center gap-4">
            {gestor?.photoUrl ? (
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#505A4A]/10">
                <Image
                  src={gestor.photoUrl}
                  alt={displayName}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#505A4A] flex items-center justify-center text-white text-xl font-semibold flex-shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                Hola, {displayName}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Bienvenido a tu panel de gestor
              </p>
            </div>
          </div>
        </m.div>

        {/* Zone Info */}
        {gestor && (
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 mb-6"
          >
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Tu zona de cobertura</h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#505A4A]" />
                {gestor.province}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-[#505A4A]" />
                +{gestor.whatsapp}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {gestor.municipalities.map((m) => (
                <span
                  key={m}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#F5F1E8] text-[#505A4A] font-medium"
                >
                  {m}
                </span>
              ))}
            </div>
          </m.div>
        )}

        {/* Stats Grid */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon className="w-4.5 h-4.5" />
              </div>
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </m.div>

        {/* Placeholder - Coming Soon */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-200 p-8 text-center mb-6"
        >
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">Pedidos</h3>
          <p className="text-sm text-gray-500">
            Aqui podras ver y gestionar los pedidos de tu zona. Proximamente.
          </p>
        </m.div>

        {/* Change Password Section */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-white rounded-2xl border border-gray-200 p-6"
        >
          <button
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-900 w-full"
          >
            <KeyRound className="w-4 h-4 text-[#505A4A]" />
            Cambiar contraseña
          </button>

          {showPasswordSection && (
            <div className="mt-4 space-y-3 max-w-sm">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 caracteres"
                    className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm bg-white text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900"
                />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="flex items-center gap-2 bg-[#505A4A] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#414A3C] transition-colors disabled:opacity-50"
              >
                {changingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                {changingPassword ? 'Cambiando...' : 'Cambiar contraseña'}
              </button>
            </div>
          )}
        </m.div>
      </main>
    </div>
  );
}
