"use client";

import { useState } from 'react';
import { User, ChevronDown, LogOut, UserCircle, Settings, LayoutDashboard, ShoppingBag, LogIn } from 'lucide-react';
import { useAuth } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function UserMenu() {
  const { user, isAuthenticated, isAdmin, isManager, logout, isLoaded } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 animate-pulse">
        <div className="w-8 h-8 rounded-full bg-gray-200" />
        <div className="w-16 h-4 bg-gray-200 rounded hidden sm:block" />
      </div>
    );
  }

  // Not authenticated - show login button
  if (!isAuthenticated) {
    return (
      <Link href="/auth">
        <motion.button
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#505A4A] text-white hover:bg-[#414A3C] transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogIn className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:block">Iniciar Sesión</span>
        </motion.button>
      </Link>
    );
  }

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const getRoleBadge = () => {
    if (isAdmin) return { label: 'Admin', color: 'bg-[#505A4A]/20 text-[#505A4A]' };
    if (isManager) return { label: 'Gestor', color: 'bg-amber-100 text-amber-800' };
    return { label: 'Cliente', color: 'bg-blue-100 text-blue-800' };
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${isAdmin ? 'bg-[#505A4A]' : isManager ? 'bg-amber-600' : 'bg-blue-600'
          }`}>
          {user?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>

        <div className="hidden sm:block text-left">
          <p className="text-sm font-semibold text-gray-900 truncate max-w-[100px]">
            {user?.name.split(' ')[0]}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
            >
              {/* User Info Header */}
              <div className={`px-4 py-4 ${isAdmin ? 'bg-gradient-to-r from-[#505A4A] to-[#414A3C]' :
                isManager ? 'bg-gradient-to-r from-amber-600 to-amber-700' :
                  'bg-gradient-to-r from-blue-600 to-blue-700'
                }`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                    {user?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 text-white">
                    <p className="font-semibold">{user?.name}</p>
                    <p className="text-sm opacity-80">{user?.email}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <Badge className={`${roleBadge.color} border-none`}>
                    {roleBadge.label}
                    {isManager && user?.managerCode && ` • ${user.managerCode}`}
                  </Badge>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                {/* Profile */}
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <UserCircle className="w-5 h-5" />
                  <span className="font-medium">Mi Perfil</span>
                </Link>

                {/* Admin Dashboard */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="font-medium">Panel de Admin</span>
                  </Link>
                )}

                {/* My Orders */}
                <Link
                  href="/orders"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span className="font-medium">Mis Pedidos</span>
                </Link>

                {/* Settings */}
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Configuración</span>
                </Link>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 p-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Cerrar Sesión</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
