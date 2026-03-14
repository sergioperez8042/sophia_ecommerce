"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Leaf, Heart, ShoppingBag, Menu, X, Home, Package, Grid3X3, Users, Phone, LogOut, ExternalLink, LayoutDashboard, Newspaper, UserCog } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart, useWishlist, useAuth } from "@/store";

const navItems = [
    { name: "Inicio", href: "/", icon: Home },
    { name: "Productos", href: "/products", icon: Package },
    { name: "Categorías", href: "/categories", icon: Grid3X3 },
    { name: "Nosotros", href: "/about", icon: Users },
    { name: "Contacto", href: "/contact", icon: Phone }
];

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    const { totalItems: cartCount } = useCart();
    const { totalItems: wishlistCount } = useWishlist();
    const { logout, isAuthenticated, user } = useAuth();

    // Close menu on route change
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMenuOpen]);

    return (
        <>
            {/* Top Bar */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#1a1d19]/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14 sm:h-16">
                        {/* Left: Hamburger + Logo */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
                                aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
                                aria-expanded={isMenuOpen}
                            >
                                {isMenuOpen ? (
                                    <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                ) : (
                                    <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                )}
                            </button>

                            <Link href="/" className="hidden md:flex items-center gap-2">
                                <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-sm ring-1 ring-[#505A4A]/15 flex-shrink-0">
                                    <Image
                                        src="/images/sophia_logo_nuevo.jpeg"
                                        alt="Sophia"
                                        fill
                                        sizes="40px"
                                        priority
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm sm:text-base font-semibold text-[#505A4A] leading-tight">Sophia</span>
                                    <span className="text-[10px] sm:text-xs text-[#505A4A]/60 leading-tight">Cosmética Botánica</span>
                                </div>
                            </Link>

                        </div>

                        {/* Center: Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`text-sm font-medium transition-colors relative group ${
                                            isActive ? 'text-[#505A4A]' : 'text-gray-600 dark:text-gray-400 dark:text-gray-500 hover:text-[#505A4A]'
                                        }`}
                                    >
                                        {item.name}
                                        <span className={`absolute inset-x-0 -bottom-1 h-0.5 bg-[#505A4A] transition-transform duration-200 ${
                                            isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                                        }`} />
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1 sm:gap-1.5">
                            {/* View catalog */}
                            <Link
                                href="/"
                                className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium text-[#505A4A] hover:bg-[#505A4A]/5 transition-colors"
                                target="_blank"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Ver Catálogo
                            </Link>

                            {/* Logout */}
                            {isAuthenticated && (
                                <button
                                    onClick={logout}
                                    className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-colors"
                                    aria-label="Cerrar sesión"
                                    title="Cerrar sesión"
                                >
                                    <LogOut className="w-4.5 h-4.5" />
                                </button>
                            )}

                            <Link
                                href="/cart"
                                className="relative flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <ShoppingBag className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 bg-[#505A4A] text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                                        {cartCount > 9 ? '9+' : cartCount}
                                    </span>
                                )}
                            </Link>

                            <Link
                                href="/wishlist"
                                className="relative flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <Heart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                {wishlistCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                                        {wishlistCount > 9 ? '9+' : wishlistCount}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Overlay - OUTSIDE header to avoid backdrop-blur stacking context */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[60] md:hidden" style={{ top: '56px' }}>
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/30"
                        onClick={() => setIsMenuOpen(false)}
                        aria-hidden="true"
                    />

                    {/* Sidebar Panel */}
                    <nav
                        className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-[#1a1d19] shadow-2xl overflow-y-auto animate-slide-in-left"
                    >
                        {/* Logo + Brand */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                            <Link href="/" className="flex items-center gap-3" onClick={() => setIsMenuOpen(false)}>
                                <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm ring-1 ring-[#505A4A]/15 flex-shrink-0">
                                    <Image
                                        src="/images/sophia_logo_nuevo.jpeg"
                                        alt="Sophia"
                                        fill
                                        sizes="40px"
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-semibold text-[#505A4A] dark:text-[#C4B590] leading-tight">Sophia</span>
                                    <span className="text-xs text-[#505A4A]/60 dark:text-[#C4B590]/60 leading-tight">Cosmética Botánica</span>
                                </div>
                            </Link>
                        </div>

                        {/* Navigation Links */}
                        <div className="py-2">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors ${
                                            isActive
                                                ? 'bg-[#505A4A]/8 text-[#505A4A] dark:text-[#C4B590] border-l-3 border-[#505A4A]'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-3 border-transparent'
                                        }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-[#505A4A] dark:text-[#C4B590]' : 'text-gray-400 dark:text-gray-500'}`} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Bottom section: Admin links + Logout */}
                        <div className="absolute bottom-0 left-0 right-0">
                            {/* Quick admin links */}
                            {isAuthenticated && user?.role === 'admin' && (
                                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
                                    <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:text-[#505A4A] hover:bg-[#505A4A]/5 transition-all text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
                                        <LayoutDashboard className="w-5 h-5" />
                                        Panel Admin
                                    </Link>
                                    <Link href="/admin/gestores" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:text-[#505A4A] hover:bg-[#505A4A]/5 transition-all text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
                                        <UserCog className="w-5 h-5" />
                                        Gestores
                                    </Link>
                                    <Link href="/admin/newsletter" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:text-[#505A4A] hover:bg-[#505A4A]/5 transition-all text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
                                        <Newspaper className="w-5 h-5" />
                                        Newsletter
                                    </Link>
                                </div>
                            )}

                            {/* View catalog + Logout */}
                            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
                                <Link href="/" target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:text-[#505A4A] hover:bg-[#505A4A]/5 transition-all text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
                                    <ExternalLink className="w-5 h-5" />
                                    Ver Catálogo
                                </Link>
                                {isAuthenticated && (
                                    <button onClick={() => { logout(); setIsMenuOpen(false); }} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-sm font-medium">
                                        <LogOut className="w-5 h-5" />
                                        Cerrar Sesión
                                    </button>
                                )}
                            </div>

                            {/* Footer brand */}
                            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                                    <Leaf className="w-3.5 h-3.5 text-[#505A4A]/50" />
                                    <span>Cosmética Botánica Artesanal</span>
                                </div>
                            </div>
                        </div>
                    </nav>
                </div>
            )}
        </>
    );
}
