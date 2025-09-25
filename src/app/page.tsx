"use client";

import { Leaf, Heart, Star, ArrowRight, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 nav-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
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
            </motion.div>

            {/* Desktop Navigation */}
            <motion.nav
              className="hidden md:flex items-center gap-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {[
                { name: "Inicio", href: "/", active: true },
                { name: "Productos", href: "/products", active: false },
                { name: "Categorías", href: "#", active: false },
                { name: "Nosotros", href: "#", active: false },
                { name: "Contacto", href: "#", active: false }
              ].map((item) => (
                <motion.div key={item.name}>
                  <Link
                    href={item.href}
                    className={`text-sm font-medium transition-colors ${item.active
                      ? 'text-[#4A6741] border-b-2 border-[#4A6741] pb-1'
                      : 'text-gray-700 hover:text-[#4A6741]'
                      }`}
                  >
                    <motion.span
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                      className="block"
                    >
                      {item.name}
                    </motion.span>
                  </Link>
                </motion.div>
              ))}
            </motion.nav>

            {/* Actions */}
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button variant="ghost" size="icon">
                  <Heart className="w-5 h-5 text-gray-700" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-gradient py-16 md:py-24 pt-24 relative overflow-hidden">
        {/* Animated background elements */}
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 rounded-full bg-[#4A6741]/10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-[#D4AF37]/10 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.5, 0.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div
                className="flex items-center gap-2 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Badge className="bg-[#4A6741]/10 text-[#4A6741] border-[#4A6741]/20">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    <Leaf className="w-3 h-3 mr-1" />
                  </motion.div>
                  100% Natural
                </Badge>
              </motion.div>

              <motion.h1
                className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                Belleza natural
                <motion.span
                  className="block text-[#4A6741]"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  para tu piel
                </motion.span>
              </motion.h1>

              <motion.p
                className="text-xl text-gray-800 leading-relaxed mb-8 max-w-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                Descubre nuestra colección de cosméticos artesanales,
                elaborados con ingredientes orgánicos seleccionados para
                nutrir y cuidar tu piel de forma natural.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href="/products">
                    <Button size="lg" className="bg-[#4A6741] hover:bg-[#3F5D4C] text-white px-8 py-3 text-lg group">
                      Explorar productos
                      <motion.div
                        className="ml-2"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    </Button>
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="outline" size="lg" className="border-[#4A6741] text-[#4A6741] hover:bg-[#4A6741] hover:text-white px-8 py-3 text-lg">
                    Nuestra historia
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <motion.div
                className="relative rounded-2xl overflow-hidden shadow-2xl"
                whileHover={{ scale: 1.02, rotateY: 5 }}
                transition={{ duration: 0.3 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <Image
                  src="/product1.png"
                  alt="Productos naturales Sophia"
                  width={600}
                  height={500}
                  className="w-full h-[500px] object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </motion.div>

              {/* Floating elements with animations */}
              <motion.div
                className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-[#4A6741]/20 blur-xl"
                animate={{
                  y: [0, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-[#D4AF37]/10 blur-2xl"
                animate={{
                  y: [0, 10, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.h2
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              ¿Por qué elegir Sophia?
            </motion.h2>
            <motion.p
              className="text-xl text-gray-800 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              Nuestro compromiso con la belleza natural y sostenible nos hace únicos
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Leaf, title: "100% Natural", desc: "Ingredientes orgánicos seleccionados con cuidado para tu piel", delay: 0 },
              { icon: Shield, title: "Sin químicos", desc: "Libres de parabenos, sulfatos y ingredientes sintéticos", delay: 0.2 },
              { icon: Heart, title: "Cruelty Free", desc: "Nunca testamos en animales, comprometidos con el bienestar animal", delay: 0.4 },
              { icon: Sparkles, title: "Artesanal", desc: "Elaborados a mano en pequeños lotes para garantizar la calidad", delay: 0.6 }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="text-center group"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: item.delay }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
              >
                <motion.div
                  className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#4A6741] to-[#3F5D4C] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300"
                  whileHover={{
                    scale: 1.1,
                    rotate: [0, -10, 10, -10, 0],
                    boxShadow: "0 20px 40px rgba(135, 169, 107, 0.4)"
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    animate={{
                      rotate: index % 2 === 0 ? [0, 360] : [360, 0]
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    <item.icon className="w-8 h-8 text-white" />
                  </motion.div>
                </motion.div>
                <motion.h3
                  className="text-xl font-semibold text-gray-900 mb-3"
                  whileHover={{ color: "#4A6741" }}
                  transition={{ duration: 0.2 }}
                >
                  {item.title}
                </motion.h3>
                <motion.p
                  className="text-gray-700 leading-relaxed"
                  initial={{ opacity: 0.7 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.desc}
                </motion.p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.h2
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Productos Destacados
            </motion.h2>
            <motion.p
              className="text-xl text-gray-800 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              Una selección de nuestros productos más populares y efectivos
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { image: "/product1.png", badge: "Bestseller", title: "Crema Hidratante Natural", desc: "Hidratación profunda con aloe vera y aceite de jojoba", price: "€25.99", rating: "4.8", delay: 0 },
              { image: "/product2.png", badge: "Nuevo", title: "Sérum Vitamina C", desc: "Ilumina y rejuvenece con antioxidantes naturales", price: "€32.50", rating: "4.9", delay: 0.2 },
              { image: "/product5.png", badge: "Popular", title: "Mascarilla Purificante", desc: "Limpieza profunda con arcilla y extractos naturales", price: "€18.99", rating: "4.7", delay: 0.4 }
            ].map((product, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: product.delay }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <Card className="product-card border-0 overflow-hidden group cursor-pointer">
                  <motion.div className="p-6">
                    <motion.div
                      className="aspect-square bg-gradient-to-br from-[#F5F1E8] to-white rounded-lg mb-4 overflow-hidden relative group-hover:bg-gradient-to-br group-hover:from-[#87A96B]/10 group-hover:to-[#6B8A78]/10 transition-all duration-300"
                      whileHover={{ rotate: [0, -2, 2, 0] }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        className="w-full h-full relative"
                        animate={{
                          scale: [1, 1.05, 1]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          delay: index * 0.5
                        }}
                      >
                        <Image
                          src={product.image}
                          alt={product.title}
                          width={300}
                          height={300}
                          className="object-cover w-full h-full rounded-lg"
                          priority={index < 3}
                        />
                      </motion.div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: product.delay + 0.2 }}
                      viewport={{ once: true }}
                    >
                      <Badge variant="secondary" className="mb-2">{product.badge}</Badge>
                    </motion.div>

                    <motion.h3
                      className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-[#87A96B] transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: product.delay + 0.3 }}
                      viewport={{ once: true }}
                    >
                      {product.title}
                    </motion.h3>

                    <motion.p
                      className="text-gray-700 mb-4"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: product.delay + 0.4 }}
                      viewport={{ once: true }}
                    >
                      {product.desc}
                    </motion.p>

                    <motion.div
                      className="flex items-center justify-between"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: product.delay + 0.5 }}
                      viewport={{ once: true }}
                    >
                      <motion.span
                        className="text-2xl font-bold text-[#87A96B]"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {product.price}
                      </motion.span>
                      <div className="flex items-center gap-1">
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        >
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        </motion.div>
                        <span className="text-sm text-gray-700">{product.rating}</span>
                      </div>
                    </motion.div>
                  </motion.div>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/products">
                <Button size="lg" variant="outline" className="border-[#87A96B] text-[#87A96B] hover:bg-[#87A96B] hover:text-white">
                  Ver Todos los Productos
                  <motion.div
                    className="ml-2"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Newsletter Section */}
      <motion.section
        className="py-16 bg-gradient-to-r from-[#87A96B] to-[#6B8A78]"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-6"
            >
              <Sparkles className="w-12 h-12 text-white mx-auto" />
            </motion.div>

            <motion.h2
              className="text-3xl md:text-4xl font-bold text-white mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Únete a la familia Sophia
            </motion.h2>

            <motion.p
              className="text-xl text-white/90 mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              Recibe consejos de belleza natural y ofertas exclusivas
            </motion.p>

            <motion.div
              className="max-w-md mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="flex gap-4">
                <motion.input
                  type="email"
                  placeholder="Tu email"
                  className="flex-1 px-4 py-3 rounded-lg border-2 border-white/30 bg-white text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-white focus:border-white outline-none transition-colors"
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                />
                <motion.button
                  className="px-6 py-3 bg-white text-[#4A6741] font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Suscribirse
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
    </main>
  );
}