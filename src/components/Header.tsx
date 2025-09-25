"use client";

import { useState } from "react";
import { Leaf, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/" className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-full bg-gradient-to-r from-[#4A6741] to-[#3F5D4C] flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.3 }}
              >
                <Leaf className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Sophia
                </h1>
                <p className="text-xs text-[#4A6741] font-medium -mt-1">
                  Cosmética Natural
                </p>
              </div>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <motion.nav
            className="hidden md:flex items-center gap-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {[
              { name: "Inicio", href: "/" },
              { name: "Productos", href: "/products" },
              { name: "Categorías", href: "/categories" },
              { name: "Nosotros", href: "/about" },
              { name: "Contacto", href: "/contact" }
            ].map((item, index) => (
              <motion.div
                key={item.name}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href={item.href}
                  className="text-gray-700 hover:text-[#4A6741] font-medium transition-colors duration-200 relative group"
                >
                  {item.name}
                  <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-[#4A6741] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
                </Link>
              </motion.div>
            ))}
          </motion.nav>

          {/* Actions */}
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="hover:bg-[#4A6741]/10 hover:text-[#4A6741] transition-colors relative">
                  <ShoppingBag className="w-5 h-5 text-gray-800 stroke-2" />
                  {/* Badge de cantidad */}
                  <div className="absolute -top-1 -right-1 bg-[#4A6741] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    3
                  </div>
                </Button>
              </Link>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Link href="/wishlist">
                <Button variant="ghost" size="icon" className="hover:bg-red-50 hover:text-red-500 transition-colors">
                  <Heart className="w-5 h-5 text-gray-800 stroke-2" />
                </Button>
              </Link>
            </motion.div>

            {/* Mobile menu button */}
            <motion.div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="hover:bg-gray-100"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5 text-gray-800" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-800" />
                )}
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-gray-100 py-4"
            >
              <nav className="flex flex-col gap-4">
                {[
                  { name: "Inicio", href: "/" },
                  { name: "Productos", href: "/products" },
                  { name: "Categorías", href: "/categories" },
                  { name: "Nosotros", href: "/about" },
                  { name: "Contacto", href: "/contact" }
                ].map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-700 hover:text-[#4A6741] font-medium transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-[#4A6741]/5"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}