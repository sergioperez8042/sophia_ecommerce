"use client";

import { useState } from 'react';
import { User, ChevronDown, LogOut, UserCheck, UserCircle } from 'lucide-react';
import { useManager, AVAILABLE_MANAGERS, Manager } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function ManagerSelector() {
  const { manager, setManager, clearManager, isManagerLoggedIn, isLoaded } = useManager();
  const [isOpen, setIsOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 animate-pulse">
        <div className="w-8 h-8 rounded-full bg-gray-200" />
        <div className="w-20 h-4 bg-gray-200 rounded" />
      </div>
    );
  }

  const handleSelectManager = (selectedManager: Manager) => {
    setManager(selectedManager);
    setIsOpen(false);
  };

  const handleLogout = () => {
    clearManager();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${isManagerLoggedIn
            ? 'bg-[#4A6741]/10 hover:bg-[#4A6741]/20 text-[#4A6741]'
            : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
          }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isManagerLoggedIn ? 'bg-[#4A6741] text-white' : 'bg-amber-500 text-white'
          }`}>
          {isManagerLoggedIn ? (
            <UserCheck className="w-4 h-4" />
          ) : (
            <User className="w-4 h-4" />
          )}
        </div>
        <div className="hidden sm:block text-left">
          {isManagerLoggedIn ? (
            <>
              <p className="text-xs font-medium text-gray-500">Gestor</p>
              <p className="text-sm font-semibold truncate max-w-[100px]">{manager?.name}</p>
            </>
          ) : (
            <p className="text-sm font-semibold">Seleccionar Gestor</p>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
              {/* Header */}
              <div className="bg-gradient-to-r from-[#4A6741] to-[#3F5D4C] px-4 py-3">
                <h3 className="text-white font-semibold text-sm">
                  {isManagerLoggedIn ? 'Gestor Activo' : 'Selecciona un Gestor'}
                </h3>
                {isManagerLoggedIn && (
                  <p className="text-white/90 text-xs mt-0.5">
                    Código: {manager?.code}
                  </p>
                )}
              </div>

              {/* Manager Info (if logged in) */}
              {isManagerLoggedIn && manager && (
                <div className="px-4 py-3 bg-green-50 border-b border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#4A6741] flex items-center justify-center text-white font-bold">
                      {manager.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{manager.name}</p>
                      <p className="text-xs text-gray-600">{manager.zone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Manager List */}
              <div className="max-h-64 overflow-y-auto">
                <p className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  {isManagerLoggedIn ? 'Cambiar gestor' : 'Gestores disponibles'}
                </p>
                {AVAILABLE_MANAGERS.map((m) => (
                  <motion.button
                    key={m.id}
                    onClick={() => handleSelectManager(m)}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${manager?.id === m.id ? 'bg-green-50' : ''
                      }`}
                    whileHover={{ x: 4 }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${manager?.id === m.id
                        ? 'bg-[#4A6741] text-white'
                        : 'bg-gray-200 text-gray-600'
                      }`}>
                      {m.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-medium ${manager?.id === m.id ? 'text-[#4A6741]' : 'text-gray-900'}`}>
                        {m.name}
                      </p>
                      <p className="text-xs text-gray-500">{m.zone} • {m.code}</p>
                    </div>
                    {manager?.id === m.id && (
                      <div className="w-2 h-2 rounded-full bg-[#4A6741]" />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Logout Button */}
              {isManagerLoggedIn && (
                <div className="border-t border-gray-100 p-2 space-y-1">
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-[#4A6741] hover:bg-[#4A6741]/10 rounded-lg transition-colors"
                  >
                    <UserCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Ver mi perfil</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Cerrar sesión de gestor</span>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
