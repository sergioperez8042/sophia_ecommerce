"use client";

import { useState } from 'react';
import { Minus, Plus, X, ShoppingBag, ArrowLeft, Trash2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Breadcrumb from "@/components/ui/breadcrumb";

// Datos simulados del carrito
const initialCartItems = [
    {
        id: "1",
        name: "Crema Hidratante Natural",
        price: 25.99,
        originalPrice: 32.99,
        image: "/product1.png",
        quantity: 2,
        category: "Cuidado Facial",
        inStock: true
    },
    {
        id: "2",
        name: "Serum Vitamina C",
        price: 35.99,
        originalPrice: 45.99,
        image: "/product2.png",
        quantity: 1,
        category: "Tratamiento",
        inStock: true
    }
];

export default function CartPage() {
    const [cartItems, setCartItems] = useState(initialCartItems);

    const updateQuantity = (id: string, newQuantity: number) => {
        if (newQuantity === 0) {
            removeItem(id);
            return;
        }
        setCartItems(cartItems.map(item =>
            item.id === id ? { ...item, quantity: newQuantity } : item
        ));
    };

    const removeItem = (id: string) => {
        setCartItems(cartItems.filter(item => item.id !== id));
    };

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = subtotal + shipping;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
                <div className="container mx-auto px-4 py-8">
                    {/* Breadcrumb */}
                    <div className="mb-6">
                        <Breadcrumb
                            items={[
                                { label: 'Carrito de Compras' }
                            ]}
                        />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16"
                    >
                        <div className="max-w-md mx-auto">
                            <ShoppingBag className="h-24 w-24 text-[#4A6741]/40 mx-auto mb-6" />
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tu carrito está vacío</h2>
                            <p className="text-gray-600 mb-8 text-lg">Descubre nuestros productos naturales y añade algunos a tu carrito.</p>
                            <Link href="/products">
                                <Button className="bg-[#4A6741] hover:bg-[#3F5D4C] text-white font-bold px-8 py-3 text-lg">
                                    Ver Productos
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Breadcrumb
                        items={[
                            { label: 'Carrito de Compras' }
                        ]}
                    />
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                >
                    {/* Items del carrito */}
                    <motion.div variants={itemVariants} className="lg:col-span-2">
                        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                                        <ShoppingBag className="h-6 w-6 mr-2 text-[#4A6741]" />
                                        Carrito de Compras
                                    </h1>
                                    <Badge variant="secondary" className="bg-[#4A6741]/10 text-[#4A6741] font-bold">
                                        {cartItems.reduce((sum, item) => sum + item.quantity, 0)} productos
                                    </Badge>
                                </div>

                                <AnimatePresence>
                                    <div className="space-y-4">
                                        {cartItems.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow"
                                            >
                                                {/* Imagen del producto */}
                                                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-white shadow-sm">
                                                    <Image
                                                        src={item.image}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>

                                                {/* Información del producto */}
                                                <div className="flex-1">
                                                    <Badge variant="secondary" className="text-xs mb-1 bg-[#4A6741]/10 text-[#4A6741]">
                                                        {item.category}
                                                    </Badge>
                                                    <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg font-bold text-[#4A6741]">${item.price}</span>
                                                        {item.originalPrice > item.price && (
                                                            <span className="text-sm text-gray-500 line-through">${item.originalPrice}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Controles de cantidad */}
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center bg-white border-2 border-[#4A6741]/30 rounded-lg shadow-sm">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            className="h-8 w-8 p-0 hover:bg-[#4A6741] hover:text-white text-[#4A6741] rounded-r-none"
                                                        >
                                                            <Minus className="h-4 w-4 stroke-2" />
                                                        </Button>
                                                        <span className="px-3 py-1 font-bold text-gray-900 min-w-[2rem] text-center bg-gray-50">
                                                            {item.quantity}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            className="h-8 w-8 p-0 hover:bg-[#4A6741] hover:text-white text-[#4A6741] rounded-l-none"
                                                        >
                                                            <Plus className="h-4 w-4 stroke-2" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Total del item */}
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-gray-900">
                                                        ${(item.price * item.quantity).toFixed(2)}
                                                    </div>
                                                </div>

                                                {/* Botones de acción */}
                                                <div className="flex flex-col gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 text-gray-500"
                                                        onClick={() => removeItem(item.id)}
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 hover:bg-pink-50 hover:text-pink-600 text-gray-500"
                                                    >
                                                        <Heart className="h-7 w-7" />
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </AnimatePresence>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Resumen del pedido */}
                    <motion.div variants={itemVariants}>
                        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm sticky top-4">
                            <CardContent className="p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Resumen del Pedido</h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-gray-700">
                                        <span className="font-medium">Subtotal:</span>
                                        <span className="font-bold">${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-700">
                                        <span className="font-medium">Envío:</span>
                                        <span className="font-bold">
                                            {shipping === 0 ? (
                                                <span className="text-green-600">Gratis</span>
                                            ) : (
                                                `$${shipping.toFixed(2)}`
                                            )}
                                        </span>
                                    </div>
                                    {subtotal < 50 && (
                                        <div className="text-xs text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                                            💡 Agrega ${(50 - subtotal).toFixed(2)} más para envío gratuito
                                        </div>
                                    )}
                                    <hr className="border-gray-200" />
                                    <div className="flex justify-between text-xl font-bold text-gray-900">
                                        <span>Total:</span>
                                        <span className="text-[#4A6741]">${total.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Link href="/checkout">
                                        <Button className="w-full bg-[#4A6741] hover:bg-[#3F5D4C] text-white font-bold h-12 text-lg shadow-lg">
                                            Proceder al Checkout
                                        </Button>
                                    </Link>
                                    <Link href="/products">
                                        <Button variant="outline" className="w-full border-[#4A6741] text-[#4A6741] hover:bg-[#4A6741] hover:text-white font-bold">
                                            <ArrowLeft className="h-4 w-4 mr-2" />
                                            Seguir Comprando
                                        </Button>
                                    </Link>
                                </div>

                                {/* Beneficios */}
                                <div className="mt-6 p-4 bg-green-50/50 rounded-lg border border-green-100">
                                    <div className="text-sm text-gray-700 space-y-2">
                                        <div className="flex items-center">
                                            <div className="h-2 w-2 bg-[#4A6741] rounded-full mr-2"></div>
                                            <span className="font-medium">Envío gratis en pedidos +$50</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="h-2 w-2 bg-[#4A6741] rounded-full mr-2"></div>
                                            <span className="font-medium">Devoluciones gratuitas</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="h-2 w-2 bg-[#4A6741] rounded-full mr-2"></div>
                                            <span className="font-medium">Garantía de 30 días</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}