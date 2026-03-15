"use client";

import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, ShoppingBag, Heart, MessageCircle, LogOut, User, Package, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { m, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/store/ThemeContext';
import { useCart } from '@/store/CartContext';
import { useWishlist } from '@/store/WishlistContext';
import { useAuth } from '@/store/AuthContext';
import CartDrawer from '@/components/CartDrawer';

const WHATSAPP_NUMBER = "34642633982";

interface CatalogHeaderProps {
    showBackButton?: boolean;
}

export default function CatalogHeader({ showBackButton = false }: CatalogHeaderProps) {
    const { isDark, toggleTheme } = useTheme();
    const { totalItems } = useCart();
    const { totalItems: wishlistCount } = useWishlist();
    const { user, isAuthenticated, logout } = useAuth();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
    const avatarMenuRef = useRef<HTMLDivElement>(null);

    const userInitials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

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
                className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-300 ${isDark ? 'bg-[#1a1d19]/95 border-[#C4B590]/15' : 'bg-white/80 border-[#505A4A]/10'}`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16 sm:h-20">
                        <div className="flex items-center gap-3">
                            {showBackButton && (
                                <Link
                                    href="/"
                                    className={`flex items-center justify-center h-9 w-9 rounded-lg transition-colors ${isDark ? 'hover:bg-[#C4B590]/15' : 'hover:bg-gray-100'}`}
                                    aria-label="Volver al catálogo"
                                >
                                    <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`} />
                                </Link>
                            )}
                            <Link href="/" className="flex items-center gap-3">
                                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shadow-sm ring-1 ring-[#505A4A]/15">
                                    <Image
                                        src="/images/sophia_logo_nuevo.jpeg"
                                        alt="Sophia Cosmetica Botanica"
                                        fill
                                        sizes="56px"
                                        className="object-cover"
                                        priority
                                    />
                                </div>
                                <span className={`text-base sm:text-lg font-semibold tracking-tight leading-tight ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}>Sophia</span>
                            </Link>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleTheme}
                                className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-[#C4B590]/15 text-[#C4B590] hover:bg-[#C4B590]/25' : 'bg-[#505A4A]/10 text-[#505A4A] hover:bg-[#505A4A]/20'}`}
                                aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
                            >
                                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>

                            <Link href="/wishlist">
                                <div
                                    className={`relative p-2 rounded-xl transition-colors ${isDark ? 'bg-[#C4B590]/15 text-[#C4B590] hover:bg-[#C4B590]/25' : 'bg-[#505A4A]/10 text-[#505A4A] hover:bg-[#505A4A]/20'}`}
                                >
                                    <Heart className="w-4 h-4" />
                                    {wishlistCount > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#C4B590] text-[#1a1d19] text-[10px] font-bold rounded-full flex items-center justify-center">
                                            {wishlistCount > 9 ? '9+' : wishlistCount}
                                        </span>
                                    )}
                                </div>
                            </Link>

                            <button
                                onClick={() => setIsCartOpen(true)}
                                className={`relative p-2 rounded-xl transition-colors ${isDark ? 'bg-[#C4B590]/15 text-[#C4B590] hover:bg-[#C4B590]/25' : 'bg-[#505A4A]/10 text-[#505A4A] hover:bg-[#505A4A]/20'}`}
                                aria-label="Carrito"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                {totalItems > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#C4B590] text-[#1a1d19] text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {totalItems}
                                    </span>
                                )}
                            </button>

                            {isAuthenticated && user ? (
                                <div ref={avatarMenuRef} className="relative">
                                    <button
                                        onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${isDark ? 'bg-[#C4B590]/20 text-[#C4B590] hover:bg-[#C4B590]/30' : 'bg-[#505A4A] text-white hover:bg-[#414A3C]'}`}
                                    >
                                        {userInitials}
                                    </button>

                                    <AnimatePresence>
                                        {isAvatarMenuOpen && (
                                            <m.div
                                                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                                transition={{ duration: 0.15 }}
                                                className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg border overflow-hidden z-50 ${isDark ? 'bg-[#232820] border-[#C4B590]/15' : 'bg-white border-[#505A4A]/10'}`}
                                            >
                                                <div className={`px-4 py-3 border-b ${isDark ? 'border-[#C4B590]/10' : 'border-[#505A4A]/5'}`}>
                                                    <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-[#333]'}`}>{user.name}</p>
                                                    <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-[#C4B590]/50' : 'text-[#505A4A]/50'}`}>{user.email}</p>
                                                </div>
                                                <div className="py-1">
                                                    <Link
                                                        href="/account"
                                                        onClick={() => setIsAvatarMenuOpen(false)}
                                                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? 'text-[#e8e4dc] hover:bg-[#C4B590]/10' : 'text-[#333] hover:bg-[#505A4A]/5'}`}
                                                    >
                                                        <Package className="w-4 h-4" />
                                                        Mis pedidos
                                                    </Link>
                                                    <Link
                                                        href="/account"
                                                        onClick={() => setIsAvatarMenuOpen(false)}
                                                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? 'text-[#e8e4dc] hover:bg-[#C4B590]/10' : 'text-[#333] hover:bg-[#505A4A]/5'}`}
                                                    >
                                                        <User className="w-4 h-4" />
                                                        Mi perfil
                                                    </Link>
                                                </div>
                                                <div className={`border-t py-1 ${isDark ? 'border-[#C4B590]/10' : 'border-[#505A4A]/5'}`}>
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
                                    className="hidden sm:flex items-center gap-2 bg-[#505A4A] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#414A3C] transition-colors shadow-sm"
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
        </>
    );
}
