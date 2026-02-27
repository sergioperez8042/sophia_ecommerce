"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Mail, Phone, MapPin, Clock, Send, Leaf, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Breadcrumb from "@/components/ui/breadcrumb";

const WHATSAPP_NUMBER = "34642633982";

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
        // TODO: Handle form submission
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
                staggerChildren: 0.15
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 40 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.7 }
        }
    };

    const contactInfo = [
        {
            icon: Mail,
            title: "Email",
            value: "chavesophia1994@gmail.com",
            href: "mailto:chavesophia1994@gmail.com"
        },
        {
            icon: Phone,
            title: "Teléfono",
            value: "+34 642 63 39 82",
            href: "tel:+34642633982"
        },
        {
            icon: MapPin,
            title: "Ubicación",
            value: "Madrid, España",
            href: null
        },
        {
            icon: Clock,
            title: "Horario",
            value: "Lun – Vie: 9:00 – 18:00",
            href: null
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FEFCF7] via-white to-[#F5F1E8]">
            {/* Hero Section */}
            <motion.section
                ref={heroRef}
                className="relative pt-24 pb-16 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-[#505A4A]/5 via-transparent to-[#C4B590]/10" />

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

                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
                        {/* Text Content */}
                        <motion.div variants={itemVariants} className="space-y-8">
                            <div>
                                <Badge className="bg-[#505A4A]/10 text-[#505A4A] font-bold text-base sm:text-lg px-5 sm:px-6 py-2 mb-6">
                                    Contáctanos
                                </Badge>
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                                    Estamos Aquí Para
                                    <span className="text-[#505A4A]"> Ayudarte</span>
                                </h1>
                                <p className="text-lg sm:text-xl text-gray-700 font-medium leading-relaxed">
                                    ¿Tienes preguntas sobre nuestros productos? ¿Quieres conocer más sobre nuestra historia?
                                    Estamos aquí para escucharte y ayudarte en tu camino hacia la belleza natural.
                                </p>
                            </div>

                            {/* Contact Info Cards */}
                            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
                                {contactInfo.map((info, index) => (
                                    <motion.div
                                        key={info.title}
                                        variants={itemVariants}
                                        whileHover={{ y: -4, scale: 1.02 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {info.href ? (
                                            <a href={info.href} className="block">
                                                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow h-full">
                                                    <CardContent className="p-5 sm:p-6">
                                                        <div className="w-10 h-10 bg-[#505A4A]/10 rounded-xl flex items-center justify-center mb-3">
                                                            <info.icon className="h-5 w-5 text-[#505A4A]" />
                                                        </div>
                                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{info.title}</h3>
                                                        <p className="text-gray-700 font-medium text-sm sm:text-base">{info.value}</p>
                                                    </CardContent>
                                                </Card>
                                            </a>
                                        ) : (
                                            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm h-full">
                                                <CardContent className="p-5 sm:p-6">
                                                    <div className="w-10 h-10 bg-[#505A4A]/10 rounded-xl flex items-center justify-center mb-3">
                                                        <info.icon className="h-5 w-5 text-[#505A4A]" />
                                                    </div>
                                                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{info.title}</h3>
                                                    <p className="text-gray-700 font-medium text-sm sm:text-base">{info.value}</p>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* WhatsApp CTA + Quick Info */}
                        <motion.div variants={itemVariants} className="space-y-6">
                            {/* WhatsApp Card */}
                            <Card className="border-0 shadow-2xl bg-[#505A4A] text-white overflow-hidden">
                                <CardContent className="p-8 sm:p-10 relative">
                                    {/* Decorative circles */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                                    <div className="relative z-10">
                                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                                            <MessageCircle className="h-7 w-7 text-white" />
                                        </div>
                                        <h3 className="text-2xl sm:text-3xl font-bold mb-3">
                                            Respuesta Inmediata
                                        </h3>
                                        <p className="text-white/80 font-medium text-base sm:text-lg mb-8 leading-relaxed">
                                            ¿Prefieres una respuesta rápida? Escríbenos por WhatsApp y te atendemos al instante.
                                        </p>
                                        <a
                                            href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20Sophia!%20Me%20gustaría%20saber%20más%20sobre%20sus%20productos.`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button className="w-full sm:w-auto bg-white text-[#505A4A] hover:bg-[#F5F1E8] font-bold px-8 py-4 text-lg shadow-lg">
                                                <MessageCircle className="h-5 w-5 mr-2" />
                                                Escribir por WhatsApp
                                            </Button>
                                        </a>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Highlights */}
                            <div className="grid grid-cols-2 gap-4">
                                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                                    <CardContent className="p-5 sm:p-6 text-center">
                                        <div className="w-10 h-10 bg-[#C4B590]/15 rounded-xl flex items-center justify-center mx-auto mb-3">
                                            <Leaf className="h-5 w-5 text-[#505A4A]" />
                                        </div>
                                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">100%</p>
                                        <p className="text-sm text-gray-600 font-medium">Natural</p>
                                    </CardContent>
                                </Card>
                                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                                    <CardContent className="p-5 sm:p-6 text-center">
                                        <div className="w-10 h-10 bg-[#C4B590]/15 rounded-xl flex items-center justify-center mx-auto mb-3">
                                            <Send className="h-5 w-5 text-[#505A4A]" />
                                        </div>
                                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">&lt;24h</p>
                                        <p className="text-sm text-gray-600 font-medium">Respuesta</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.section>

            {/* Contact Form Section */}
            <motion.section
                ref={formRef}
                className="py-20 sm:py-32 bg-gradient-to-b from-[#F5F1E8]/30 via-transparent to-[#F5F1E8]/30"
            >
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate={formInView ? "visible" : "hidden"}
                    className="container mx-auto px-4"
                >
                    <motion.div variants={itemVariants} className="text-center mb-12 sm:mb-16">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                            Envíanos un <span className="text-[#505A4A]">Mensaje</span>
                        </h2>
                        <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto font-medium">
                            Cuéntanos cómo podemos ayudarte. Respondemos todos los mensajes en menos de 24 horas.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className="max-w-4xl mx-auto"
                    >
                        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
                            <CardContent className="p-6 sm:p-8 md:p-12">
                                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                                    <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                                Nombre Completo
                                            </label>
                                            <Input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="border-2 border-gray-200 focus:border-[#505A4A] rounded-lg p-4 text-base sm:text-lg placeholder:text-gray-500 text-gray-800"
                                                placeholder="Tu nombre"
                                                required
                                                autoComplete="name"
                                                data-lpignore="true"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                                Email
                                            </label>
                                            <Input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="border-2 border-gray-200 focus:border-[#505A4A] rounded-lg p-4 text-base sm:text-lg placeholder:text-gray-500 text-gray-800"
                                                placeholder="tu@email.com"
                                                required
                                                autoComplete="email"
                                                data-lpignore="true"
                                                data-form-type="other"
                                                suppressHydrationWarning={true}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-2">
                                            Asunto
                                        </label>
                                        <Input
                                            type="text"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            className="border-2 border-gray-200 focus:border-[#505A4A] rounded-lg p-4 text-base sm:text-lg placeholder:text-gray-500 text-gray-800"
                                            placeholder="¿En qué podemos ayudarte?"
                                            required
                                            data-lpignore="true"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-2">
                                            Mensaje
                                        </label>
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            rows={6}
                                            className="w-full border-2 border-gray-200 focus:border-[#505A4A] rounded-lg p-4 text-base sm:text-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#505A4A]/20 placeholder:text-gray-500 text-gray-800"
                                            placeholder="Cuéntanos más detalles..."
                                            required
                                            data-lpignore="true"
                                        />
                                    </div>

                                    <motion.div
                                        className="flex flex-col sm:flex-row gap-4 pt-2 sm:pt-4"
                                        whileHover={{ scale: 1.01 }}
                                    >
                                        <Button
                                            type="submit"
                                            className="flex-1 sm:flex-none bg-[#505A4A] hover:bg-[#414A3C] text-white font-bold px-10 sm:px-12 py-4 text-lg shadow-xl"
                                        >
                                            <Send className="h-5 w-5 mr-3" />
                                            Enviar Mensaje
                                        </Button>
                                        <a
                                            href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20Sophia!`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 sm:flex-none"
                                        >
                                            <button
                                                type="button"
                                                className="w-full inline-flex items-center justify-center border-2 border-[#505A4A] bg-transparent text-[#505A4A] hover:bg-[#505A4A] hover:text-white font-bold px-10 sm:px-12 py-4 text-lg rounded-md transition-colors"
                                            >
                                                <MessageCircle className="h-5 w-5 mr-3" />
                                                WhatsApp
                                            </button>
                                        </a>
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
