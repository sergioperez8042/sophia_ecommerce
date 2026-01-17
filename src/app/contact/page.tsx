"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Mail, Phone, MapPin, Clock, Send, Heart, Leaf, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Breadcrumb from "@/components/ui/breadcrumb";

export default function ContactPage() {
    const heroRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLDivElement>(null);
    const [isHydrated, setIsHydrated] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const heroInView = useInView(heroRef, { once: true, amount: 0.3 });
    const formInView = useInView(formRef, { once: true, amount: 0.2 });

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Aquí manejarías el envío del formulario
        console.log('Formulario enviado:', formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.6,
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 60 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8 }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
            {/* Hero Section */}
            <motion.section
                ref={heroRef}
                className="relative pt-24 pb-16 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-[#4A6741]/5 via-transparent to-[#4A6741]/10" />

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate={heroInView ? "visible" : "hidden"}
                    className="container mx-auto px-4 relative z-10"
                >
                    {/* Breadcrumb */}
                    <motion.div variants={itemVariants} className="mb-8">
                        <Breadcrumb
                            items={[
                                { label: 'Contacto' }
                            ]}
                        />
                    </motion.div>

                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Text Content */}
                        <motion.div variants={itemVariants} className="space-y-8">
                            <div>
                                <Badge className="bg-[#4A6741]/10 text-[#4A6741] font-bold text-lg px-6 py-2 mb-6">
                                    Contáctanos
                                </Badge>
                                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                                    Estamos Aquí Para
                                    <span className="bg-gradient-to-r from-[#4A6741] to-[#6B8E5A] bg-clip-text text-transparent"> Ayudarte</span>
                                </h1>
                                <p className="text-xl text-gray-700 font-medium leading-relaxed">
                                    ¿Tienes preguntas sobre nuestros productos? ¿Quieres conocer más sobre nuestra historia?
                                    Estamos aquí para escucharte y ayudarte en tu camino hacia la belleza natural.
                                </p>
                            </div>

                            {/* Contact Info Cards */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <motion.div
                                    variants={itemVariants}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                                        <CardContent className="p-6">
                                            <Mail className="h-8 w-8 text-[#4A6741] mb-4" />
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">Email</h3>
                                            <p className="text-gray-700 font-medium">chavesophia1994@gmail.com</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                <motion.div
                                    variants={itemVariants}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                                        <CardContent className="p-6">
                                            <Phone className="h-8 w-8 text-[#4A6741] mb-4" />
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">Teléfono</h3>
                                            <p className="text-gray-700 font-medium">+34 642 63 39 82</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                <motion.div
                                    variants={itemVariants}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                                        <CardContent className="p-6">
                                            <MapPin className="h-8 w-8 text-[#4A6741] mb-4" />
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">Ubicación</h3>
                                            <p className="text-gray-700 font-medium">Madrid, España</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                <motion.div
                                    variants={itemVariants}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                                        <CardContent className="p-6">
                                            <Clock className="h-8 w-8 text-[#4A6741] mb-4" />
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">Horario</h3>
                                            <p className="text-gray-700 font-medium">Lun - Vie: 9:00 - 18:00</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Decorative Elements */}
                        <motion.div variants={itemVariants} className="relative">
                            <motion.div
                                animate={{
                                    rotate: [0, 360],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{
                                    duration: 20,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                                className="absolute top-10 right-10 w-20 h-20 bg-gradient-to-r from-[#4A6741]/20 to-[#6B8E5A]/20 rounded-full blur-xl"
                            />
                            <motion.div
                                animate={{
                                    rotate: [360, 0],
                                    scale: [1, 1.2, 1]
                                }}
                                transition={{
                                    duration: 15,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                                className="absolute bottom-20 left-10 w-32 h-32 bg-gradient-to-l from-[#4A6741]/15 to-[#6B8E5A]/15 rounded-full blur-2xl"
                            />

                            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50 p-8">
                                <CardContent className="text-center space-y-6">
                                    <div className="flex justify-center space-x-4">
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <Heart className="h-12 w-12 text-red-500" />
                                        </motion.div>
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                                        >
                                            <Leaf className="h-12 w-12 text-[#4A6741]" />
                                        </motion.div>
                                        <motion.div
                                            animate={{ rotate: [0, -10, 10, 0] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                                        >
                                            <Star className="h-12 w-12 text-yellow-500" />
                                        </motion.div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        Siempre Disponibles
                                    </h3>
                                    <p className="text-gray-700 font-medium">
                                        Nuestro equipo está aquí para ayudarte con cualquier pregunta sobre belleza natural y productos.
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.section>

            {/* Contact Form Section */}
            <motion.section
                ref={formRef}
                className="py-32 bg-gradient-to-r from-[#4A6741]/5 via-transparent to-[#4A6741]/5"
            >
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate={formInView ? "visible" : "hidden"}
                    className="container mx-auto px-4"
                >
                    <motion.div variants={itemVariants} className="text-center mb-16">
                        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                            Envíanos un <span className="text-[#4A6741]">Mensaje</span>
                        </h2>
                        <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
                            Cuéntanos cómo podemos ayudarte. Respondemos todos los mensajes en menos de 24 horas.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className="max-w-4xl mx-auto"
                    >
                        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
                            <CardContent className="p-8 md:p-12">
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <motion.div
                                            whileFocus={{ scale: 1.02 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                                Nombre Completo
                                            </label>
                                            <Input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="border-2 border-gray-200 focus:border-[#4A6741] rounded-lg p-4 text-lg placeholder:text-gray-600 text-gray-800"
                                                placeholder="Tu nombre"
                                                required
                                                autoComplete="name"
                                                data-lpignore="true"
                                            />
                                        </motion.div>

                                        <motion.div
                                            whileFocus={{ scale: 1.02 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                                Email
                                            </label>
                                            <Input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="border-2 border-gray-200 focus:border-[#4A6741] rounded-lg p-4 text-lg placeholder:text-gray-600 text-gray-800"
                                                placeholder="tu@email.com"
                                                required
                                                autoComplete="email"
                                                data-lpignore="true"
                                                data-form-type="other"
                                                suppressHydrationWarning={true}
                                            />
                                        </motion.div>
                                    </div>

                                    <motion.div
                                        whileFocus={{ scale: 1.02 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <label className="block text-sm font-bold text-gray-900 mb-2">
                                            Asunto
                                        </label>
                                        <Input
                                            type="text"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            className="border-2 border-gray-200 focus:border-[#4A6741] rounded-lg p-4 text-lg placeholder:text-gray-600 text-gray-800"
                                            placeholder="¿En qué podemos ayudarte?"
                                            required
                                            data-lpignore="true"
                                        />
                                    </motion.div>

                                    <motion.div
                                        whileFocus={{ scale: 1.02 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <label className="block text-sm font-bold text-gray-900 mb-2">
                                            Mensaje
                                        </label>
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            rows={6}
                                            className="w-full border-2 border-gray-200 focus:border-[#4A6741] rounded-lg p-4 text-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#4A6741]/20 placeholder:text-gray-600 text-gray-800"
                                            placeholder="Cuéntanos más detalles..."
                                            required
                                            data-lpignore="true"
                                        />
                                    </motion.div>

                                    <motion.div
                                        className="text-center pt-4"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Button
                                            type="submit"
                                            className="bg-[#4A6741] hover:bg-[#3F5D4C] text-white font-bold px-12 py-4 text-xl shadow-xl"
                                        >
                                            <Send className="h-5 w-5 mr-3" />
                                            Enviar Mensaje
                                        </Button>
                                    </motion.div>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
            </motion.section>
        </div>
    );
}