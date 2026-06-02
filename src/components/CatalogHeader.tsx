"use client";

import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, ShoppingBag, Heart, MessageCircle, LogOut, User, Package, ArrowLeft, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { m, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/store/ThemeContext';
import { useCart } from '@/store/CartContext';
import { useWishlist } from '@/store/WishlistContext';
import { useAuth } from '@/store/AuthContext';
import { useLocation } from '@/store/LocationContext';
import CartDrawer from '@/components/CartDrawer';
import LocationPopup from '@/components/LocationPopup';

const WHATSAPP_NUMBER = "34642633982";

interface CatalogHeaderProps {
    showBackButton?: boolean;
}

export default function CatalogHeader({ showBackButton = false }: CatalogHeaderProps) {
    const { isDark, toggleTheme } = useTheme();
    const { totalItems } = useCart();
    const { totalItems: wishlistCount } = useWishlist();
    const { user, isAuthenticated, logout } = useAuth();
    const { location, hasFullLocation } = useLocation();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
    const [isLocationOpen, setIsLocationOpen] = useState(false);
    const avatarMenuRef = useRef<HTMLDivElement>(null);

    const userInitials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    // Auto-abrir el popup la PRIMERA vez (cuando no hay location completa).
    // Tras 500 ms para no interrumpir el render inicial. Una vez el cliente
    // confirma su zona, hasFullLocation pasa a true y este efecto no vuelve
    // a abrir nada — el cliente abre manualmente vía el botón si quiere
    // cambiarla.
    useEffect(() => {
        if (hasFullLocation) return;
        const timer = setTimeout(() => setIsLocationOpen(true), 500);
        return () => clearTimeout(timer);
    }, [hasFullLocation]);

    // Texto compacto del botón. Prefiere el consejo > municipio porque
    // es la unidad de cobertura más fina; si solo hay municipio (Matanzas
    // y otras sin consejos), mostramos eso.
    const locationLabel = location
        ? location.consejoPopular || location.municipality
        : 'Selecciona zona';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
                setIsAvatarMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <>
            <header
                className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-300 ${isDark ? 'bg-[#15241B]/95 border-[#C9A96E]/15' : 'bg-white/80 border-[#2E4A3A]/10'}`}
            >
                <div className="max-w-7xl mx-auto px-3 sm:px-6">
                    <div className="flex items-center justify-between gap-2 h-14 sm:h-20">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            {showBackButton && (
                                <Link
                                    href="/"
                                    className={`flex items-center justify-center h-10 w-10 rounded-lg transition-colors flex-shrink-0 ${isDark ? 'hover:bg-[#C9A96E]/15' : 'hover:bg-gray-100'}`}
                                    aria-label="Volver al catálogo"
                                >
                                    <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-[#C9A96E]' : 'text-[#2E4A3A]'}`} />
                                </Link>
                            )}
                            <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-xl overflow-hidden shadow-sm ring-1 ring-[#2E4A3A]/15 flex-shrink-0">
                                    <Image
                                        src="/images/sophia_logo_v3.jpeg"
                                        alt="Sophia"
                                        fill
                                        sizes="(min-width: 640px) 56px, 40px"
                                        className="object-cover"
                                        priority
                                    />
                                </div>
                                <span className={`hidden min-[420px]:inline text-sm sm:text-lg font-semibold tracking-tight leading-tight truncate ${isDark ? 'text-[#C9A96E]' : 'text-[#2E4A3A]'}`}>Sophia</span>
                            </Link>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            {/* Selector de ubicación: muestra la zona actual y al
                                hacer click abre el popup en modo controlado. En
                                mobile solo el ícono (40px touch target), en
                                desktop ícono + texto truncado. */}
                            <button
                                onClick={() => setIsLocationOpen(true)}
                                className={`flex items-center justify-center sm:justify-start gap-1.5 h-10 w-10 sm:w-auto sm:px-3 sm:py-2 sm:h-auto sm:min-h-[40px] rounded-xl transition-colors sm:max-w-[200px] ${isDark ? 'bg-[#274034] text-[#C9A96E] ring-1 ring-inset ring-[#36473B] hover:bg-[#2E4A3A]' : 'bg-[#2E4A3A]/10 text-[#2E4A3A] hover:bg-[#2E4A3A]/20'}`}
                                aria-label={`Cambiar ubicación (actual: ${locationLabel})`}
                                title={locationLabel}
                            >
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span className="hidden sm:inline text-xs font-medium truncate">
                                    {locationLabel}
                                </span>
                            </button>

                            <button
                                onClick={toggleTheme}
                                className={`flex items-center justify-center h-10 w-10 rounded-xl transition-colors ${isDark ? 'bg-[#274034] text-[#C9A96E] ring-1 ring-inset ring-[#36473B] hover:bg-[#2E4A3A]' : 'bg-[#2E4A3A]/10 text-[#2E4A3A] hover:bg-[#2E4A3A]/20'}`}
                                aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
                            >
                                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>

                            <Link href="/wishlist">
                                <div
                                    className={`relative flex items-center justify-center h-10 w-10 rounded-xl transition-colors ${isDark ? 'bg-[#274034] text-[#C9A96E] ring-1 ring-inset ring-[#36473B] hover:bg-[#2E4A3A]' : 'bg-[#2E4A3A]/10 text-[#2E4A3A] hover:bg-[#2E4A3A]/20'}`}
                                >
                                    <Heart className="w-4 h-4" />
                                    {wishlistCount > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#C9A96E] text-[#15241B] text-[10px] font-bold rounded-full flex items-center justify-center">
                                            {wishlistCount > 9 ? '9+' : wishlistCount}
                                        </span>
                                    )}
                                </div>
                            </Link>

                            <button
                                onClick={() => setIsCartOpen(true)}
                                className={`relative flex items-center justify-center h-10 w-10 rounded-xl transition-colors ${isDark ? 'bg-[#274034] text-[#C9A96E] ring-1 ring-inset ring-[#36473B] hover:bg-[#2E4A3A]' : 'bg-[#2E4A3A]/10 text-[#2E4A3A] hover:bg-[#2E4A3A]/20'}`}
                                aria-label="Carrito"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                {totalItems > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#C9A96E] text-[#15241B] text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {totalItems}
                                    </span>
                                )}
                            </button>

                            {isAuthenticated && user ? (
                                <div ref={avatarMenuRef} className="relative">
                                    <button
                                        onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold overflow-hidden transition-colors ${isDark ? 'bg-[#C9A96E]/20 text-[#C9A96E] hover:bg-[#C9A96E]/30' : 'bg-[#2E4A3A] text-white hover:bg-[#26402F]'}`}
                                        aria-label="Menú de usuario"
                                    >
                                        {/* Si el usuario subió foto en Mi Cuenta, la mostramos;
                                            si no, fallback a las iniciales (la `bg-...` del botón
                                            es el placeholder y `overflow-hidden` recorta la foto
                                            al círculo). */}
                                        {user.avatar ? (
                                            <Image
                                                src={user.avatar}
                                                alt={user.name}
                                                width={40}
                                                height={40}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            userInitials
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {isAvatarMenuOpen && (
                                            <m.div
                                                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                                transition={{ duration: 0.15 }}
                                                className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg border overflow-hidden z-50 ${isDark ? 'bg-[#1C2E23] border-[#C9A96E]/15' : 'bg-white border-[#2E4A3A]/10'}`}
                                            >
                                                <div className={`px-4 py-3 border-b ${isDark ? 'border-[#C9A96E]/10' : 'border-[#2E4A3A]/5'}`}>
                                                    <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-[#333]'}`}>{user.name}</p>
                                                    <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-[#C9A96E]/50' : 'text-[#2E4A3A]/50'}`}>{user.email}</p>
                                                </div>
                                                <div className="py-1">
                                                    <Link
                                                        href="/account"
                                                        onClick={() => setIsAvatarMenuOpen(false)}
                                                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? 'text-[#e8e4dc] hover:bg-[#C9A96E]/10' : 'text-[#333] hover:bg-[#2E4A3A]/5'}`}
                                                    >
                                                        <Package className="w-4 h-4" />
                                                        Mis pedidos
                                                    </Link>
                                                    <Link
                                                        href="/account"
                                                        onClick={() => setIsAvatarMenuOpen(false)}
                                                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? 'text-[#e8e4dc] hover:bg-[#C9A96E]/10' : 'text-[#333] hover:bg-[#2E4A3A]/5'}`}
                                                    >
                                                        <User className="w-4 h-4" />
                                                        Mi perfil
                                                    </Link>
                                                </div>
                                                <div className={`border-t py-1 ${isDark ? 'border-[#C9A96E]/10' : 'border-[#2E4A3A]/5'}`}>
                                                    <button
                                                        onClick={async () => { setIsAvatarMenuOpen(false); await logout(); }}
                                                        className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors ${isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'}`}
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        Cerrar sesión
                                                    </button>
                                                </div>
                                            </m.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <a
                                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola! Me gustaria hacer un pedido`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hidden sm:flex items-center gap-2 bg-[#2E4A3A] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#26402F] transition-colors shadow-sm"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Pedir por WhatsApp
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

            {/* LocationPopup montado a nivel header: vive en cada página del
                catálogo. Sale automáticamente la primera vez (efecto arriba)
                y también cuando el cliente hace click en el botón con la
                pin de ubicación. */}
            <LocationPopup open={isLocationOpen} onOpenChange={setIsLocationOpen} />
        </>
    );
}
