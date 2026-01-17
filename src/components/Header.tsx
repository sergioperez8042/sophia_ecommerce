"use client";

import { useState } from "react";
import { Leaf, Heart, ShoppingBag, Menu, X, Home, Package, Grid3X3, Users, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCart, useWishlist } from "@/store";
import UserMenu from "@/components/UserMenu";

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    const { totalItems: cartCount } = useCart();
    const { totalItems: wishlistCount } = useWishlist();

    const navItems = [
        { name: "Inicio", href: "/", icon: Home },
        { name: "Productos", href: "/products", icon: Package },
        { name: "Categorías", href: "/categories", icon: Grid3X3 },
        { name: "Nosotros", href: "/about", icon: Users },
        { name: "Contacto", href: "/contact", icon: Phone }
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-14 sm:h-16">
                    {/* Mobile menu button - Moved to left on mobile */}
                    <motion.div 
                        className="md:hidden flex items-center"
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="hover:bg-[#4A6741]/10 h-9 w-9"
                        >
                            <AnimatePresence mode="wait">
                                {isMenuOpen ? (
                                    <motion.div
                                        key="close"
                                        initial={{ rotate: -90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: 90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <X className="w-5 h-5 text-[#4A6741]" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="menu"
                                        initial={{ rotate: 90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: -90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Menu className="w-5 h-5 text-gray-700" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Button>
                    </motion.div>

                    {/* Logo + Tagline on mobile */}
                    <motion.div
                        className="flex items-center justify-center md:justify-start flex-1 md:flex-none"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Link href="/" className="flex items-center gap-2">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="relative w-20 h-8 sm:w-28 sm:h-12 md:w-44 md:h-16 lg:w-52 lg:h-20"
                            >
                                <img
                                    src="/images/logo-sophia.png"
                                    alt="Sophia - Cosmética Natural"
                                    className="w-full h-full object-contain"
                                />
                            </motion.div>
                            {/* Mobile tagline - visible only on small screens */}
                            <div className="flex sm:hidden flex-col border-l border-[#4A6741]/30 pl-2">
                                <span className="text-[11px] text-[#4A6741] font-semibold leading-tight tracking-tight">Cosmética</span>
                                <span className="text-[10px] text-[#4A6741]/70 leading-tight">Natural Artesanal</span>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Desktop Navigation */}
                    <motion.nav
                        className="hidden md:flex items-center gap-6 lg:gap-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <motion.div
                                    key={item.name}
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Link
                                        href={item.href}
                                        className={`font-medium transition-colors duration-200 relative group ${isActive ? 'text-[#4A6741]' : 'text-gray-700 hover:text-[#4A6741]'
                                            }`}
                                    >
                                        {item.name}
                                        <span className={`absolute inset-x-0 -bottom-1 h-0.5 bg-[#4A6741] transform transition-transform duration-200 ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                                            }`}></span>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </motion.nav>

                    {/* Actions */}
                    <motion.div
                        className="flex items-center gap-1 sm:gap-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        {/* User Menu - Hidden on mobile, visible on larger screens */}
                        <div className="hidden sm:block">
                            <UserMenu />
                        </div>

                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Link href="/cart">
                                <Button variant="ghost" size="icon" className="hover:bg-[#4A6741]/10 hover:text-[#4A6741] transition-colors relative h-9 w-9 sm:h-10 sm:w-10">
                                    <ShoppingBag className="w-5 h-5 text-gray-700" />
                                    {cartCount > 0 && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-[#4A6741] text-white text-[10px] sm:text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-bold shadow-sm"
                                        >
                                            {cartCount > 9 ? '9+' : cartCount}
                                        </motion.div>
                                    )}
                                </Button>
                            </Link>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Link href="/wishlist">
                                <Button variant="ghost" size="icon" className="hover:bg-red-50 hover:text-red-500 transition-colors relative h-9 w-9 sm:h-10 sm:w-10">
                                    <Heart className="w-5 h-5 text-gray-700" />
                                    {wishlistCount > 0 && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-red-500 text-white text-[10px] sm:text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-bold shadow-sm"
                                        >
                                            {wishlistCount > 9 ? '9+' : wishlistCount}
                                        </motion.div>
                                    )}
                                </Button>
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Mobile Navigation - Full screen overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm md:hidden z-40"
                            onClick={() => setIsMenuOpen(false)}
                            style={{ top: '56px' }}
                        />
                        
                        {/* Menu Panel */}
                        <motion.div
                            initial={{ opacity: 0, x: -280 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -280 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="fixed left-0 top-14 bottom-0 w-72 bg-white shadow-xl md:hidden z-50 overflow-y-auto"
                        >
                            {/* User section at top of mobile menu */}
                            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-[#4A6741]/5 to-transparent">
                                <UserMenu />
                            </div>

                            {/* Navigation Links */}
                            <nav className="py-4">
                                {navItems.map((item, index) => {
                                    const isActive = pathname === item.href;
                                    const Icon = item.icon;
                                    return (
                                        <motion.div
                                            key={item.name}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                        >
                                            <Link
                                                href={item.href}
                                                className={`flex items-center gap-4 px-6 py-4 transition-all duration-200 ${
                                                    isActive 
                                                        ? 'bg-[#4A6741]/10 text-[#4A6741] border-l-4 border-[#4A6741]' 
                                                        : 'text-gray-700 hover:bg-gray-50 hover:text-[#4A6741] border-l-4 border-transparent'
                                                }`}
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                <Icon className={`w-5 h-5 ${isActive ? 'text-[#4A6741]' : 'text-gray-500'}`} />
                                                <span className="font-medium text-base">{item.name}</span>
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="activeIndicator"
                                                        className="ml-auto w-2 h-2 rounded-full bg-[#4A6741]"
                                                    />
                                                )}
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </nav>

                            {/* Bottom decoration */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100 bg-gradient-to-t from-[#4A6741]/5 to-transparent">
                                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                    <Leaf className="w-4 h-4 text-[#4A6741]" />
                                    <span>Cosmética Natural Artesanal</span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}