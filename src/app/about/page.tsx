"use client";

import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import { Leaf, Heart, Globe, Award, Users, TrendingUp, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function AboutPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const heroRef = useRef<HTMLDivElement>(null);
    const storyRef = useRef<HTMLDivElement>(null);
    const valuesRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

    const heroInView = useInView(heroRef, { once: true, amount: 0.3 });
    const storyInView = useInView(storyRef, { once: true, amount: 0.2 });
    const valuesInView = useInView(valuesRef, { once: true, amount: 0.2 });

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

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.8, y: 40 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { duration: 0.6 }
        }
    };

    return (
        <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-[#FEFCF7] via-white to-[#F5F1E8]">
            {/* Hero Section */}
            <motion.section
                ref={heroRef}
                style={{ opacity: heroOpacity, scale: heroScale }}
                className="relative min-h-screen flex items-center justify-center overflow-hidden"
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#505A4A]/5 via-transparent to-[#C4B590]/10" />

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate={heroInView ? "visible" : "hidden"}
                    className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 relative z-10"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
                        {/* Text Content */}
                        <motion.div variants={itemVariants} className="space-y-6 sm:space-y-8 text-center lg:text-left">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                animate={heroInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                            >
                                <Badge className="bg-[#505A4A]/10 text-[#505A4A] font-bold text-sm sm:text-base lg:text-lg px-4 sm:px-6 py-2 mb-4 sm:mb-6">
                                    Nuestra Historia
                                </Badge>
                                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
                                    De Cuba a
                                    <span className="text-[#505A4A]"> Europa</span>
                                </h1>
                            </motion.div>

                            <motion.p
                                variants={itemVariants}
                                className="text-base sm:text-lg lg:text-xl text-gray-700 font-medium leading-relaxed"
                            >
                                La historia de <strong className="text-[#505A4A]">Sophia Natural</strong> es la historia de una mujer valiente que transformó su pasión por la belleza natural en un imperio de bienestar que ahora cruza océanos.
                            </motion.p>

                            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                                <Link href="/products">
                                    <Button className="w-full sm:w-auto bg-[#505A4A] hover:bg-[#414A3C] text-white font-bold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-lg">
                                        Descubre Nuestros Productos
                                    </Button>
                                </Link>
                                <button
                                    className="w-full sm:w-auto border-2 border-[#505A4A] bg-transparent text-[#505A4A] hover:bg-[#505A4A] hover:text-white font-bold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg transition-colors rounded-md"
                                    onClick={() => storyRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                >
                                    Conoce la Historia
                                </button>
                            </motion.div>
                        </motion.div>

                        {/* Hero Image */}
                        <motion.div
                            variants={itemVariants}
                            className="relative"
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={heroInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                                transition={{ duration: 1, delay: 0.4 }}
                                className="relative"
                            >
                                {/* Decorative elements */}
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
                                    className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-r from-[#505A4A]/20 to-[#C4B590]/20 rounded-full blur-xl"
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
                                    className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-l from-[#505A4A]/15 to-[#C4B590]/15 rounded-full blur-2xl"
                                />

                                <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#FEFCF7] to-[#F5F1E8] p-4">
                                    <Image
                                        src="/sophia-founder.jpg"
                                        alt="Sophia, fundadora de Sophia Natural"
                                        width={300}
                                        height={400}
                                        className="rounded-2xl object-cover w-full h-auto"
                                        priority
                                    />
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.section>

            {/* Story Section */}
            <motion.section
                ref={storyRef}
                className="py-16 sm:py-24 lg:py-32 relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-[#505A4A]/5 to-transparent" />

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate={storyInView ? "visible" : "hidden"}
                    className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
                >
                    <motion.div variants={itemVariants} className="text-center mb-12 sm:mb-16 lg:mb-20">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
                            Una Historia de <span className="text-[#505A4A]">Determinación</span>
                        </h2>
                        <p className="text-base sm:text-lg lg:text-xl text-gray-700 max-w-3xl mx-auto font-medium leading-relaxed">
                            Desde las calles de La Habana hasta las capitales europeas, esta es la historia de cómo la pasión y la perseverancia pueden cambiar el mundo.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center mb-12 sm:mb-16 lg:mb-20">
                        {/* Story Content */}
                        <motion.div variants={itemVariants} className="space-y-8">
                            <div className="space-y-6">
                                <motion.div
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={storyInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                >
                                    <h3 className="text-2xl font-bold text-[#505A4A] flex items-center gap-3">
                                        <Heart className="h-6 w-6 text-[#C4B590]" />
                                        Los Inicios en Cuba
                                    </h3>
                                    <p className="text-gray-700 text-lg leading-relaxed font-medium">
                                        En 2018, Sophia comenzó su viaje en un pequeño apartamento de La Habana, mezclando ingredientes naturales cubanos con recetas heredadas de su abuela. Su pasión por la belleza natural y su determinación de crear productos libres de químicos dañinos la llevaron a experimentar con aloe vera, miel local y aceites esenciales de la isla.
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={storyInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                >
                                    <h3 className="text-2xl font-bold text-[#505A4A] flex items-center gap-3">
                                        <TrendingUp className="h-6 w-6 text-[#505A4A]" />
                                        El Crecimiento
                                    </h3>
                                    <p className="text-gray-700 text-lg leading-relaxed font-medium">
                                        Lo que comenzó como una pasión personal se convirtió rápidamente en un negocio próspero. Las mujeres cubanas descubrieron la magia de los productos de Sophia, y el boca a boca se extendió como fuego. En tres años, había creado una red de distribuidoras en toda la isla, empleando a más de 50 mujeres locales.
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={storyInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                                    transition={{ duration: 0.6, delay: 0.6 }}
                                >
                                    <h3 className="text-2xl font-bold text-[#505A4A] flex items-center gap-3">
                                        <Globe className="h-6 w-6 text-[#414A3C]" />
                                        La Conquista Europea
                                    </h3>
                                    <p className="text-gray-700 text-lg leading-relaxed font-medium">
                                        En 2023, Sophia tomó la decisión más importante de su vida: expandir su imperio de belleza natural a Europa. Con una maleta llena de sueños y productos, llegó a España decidida a demostrar que la belleza natural cubana podía conquistar el mundo. Hoy, Sophia Natural es reconocida en toda Europa como sinónimo de calidad, naturalidad y empoderamiento femenino.
                                    </p>
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Stats Cards */}
                        <motion.div variants={itemVariants} className="space-y-6">
                            <motion.div variants={cardVariants}>
                                <Card className="border-0 shadow-xl bg-gradient-to-r from-[#505A4A]/5 to-[#505A4A]/10 backdrop-blur-sm">
                                    <CardContent className="p-8 text-center">
                                        <Award className="h-12 w-12 text-[#505A4A] mx-auto mb-4" />
                                        <h4 className="text-3xl font-bold text-gray-900 mb-2">7</h4>
                                        <p className="text-gray-700 font-semibold">Años de Experiencia</p>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div variants={cardVariants}>
                                <Card className="border-0 shadow-xl bg-gradient-to-r from-[#C4B590]/10 to-[#C4B590]/20 backdrop-blur-sm">
                                    <CardContent className="p-8 text-center">
                                        <Users className="h-12 w-12 text-[#505A4A] mx-auto mb-4" />
                                        <h4 className="text-3xl font-bold text-gray-900 mb-2">50,000+</h4>
                                        <p className="text-gray-700 font-semibold">Mujeres Satisfechas</p>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div variants={cardVariants}>
                                <Card className="border-0 shadow-xl bg-gradient-to-r from-[#F5F1E8] to-[#E8E2D5] backdrop-blur-sm">
                                    <CardContent className="p-8 text-center">
                                        <Globe className="h-12 w-12 text-[#414A3C] mx-auto mb-4" />
                                        <h4 className="text-3xl font-bold text-gray-900 mb-2">15</h4>
                                        <p className="text-gray-700 font-semibold">Países en Europa</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.section>

            {/* Values Section */}
            <motion.section
                ref={valuesRef}
                className="py-24 sm:py-32 bg-gradient-to-r from-[#F5F1E8]/50 via-transparent to-[#F5F1E8]/50"
            >
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate={valuesInView ? "visible" : "hidden"}
                    className="container mx-auto px-4"
                >
                    <motion.div variants={itemVariants} className="text-center mb-16 sm:mb-20">
                        <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                            Nuestros <span className="text-[#505A4A]">Valores</span>
                        </h2>
                        <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto font-medium">
                            Los principios que nos guían en cada paso de nuestro viaje hacia la belleza natural y el empoderamiento femenino.
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                        {[
                            {
                                icon: Heart,
                                title: "Pasión",
                                description: "Cada producto está hecho con amor y dedicación, siguiendo recetas tradicionales cubanas.",
                                accent: "bg-[#505A4A]/10"
                            },
                            {
                                icon: Sparkles,
                                title: "Calidad",
                                description: "Solo utilizamos ingredientes naturales de la más alta calidad, sin químicos dañinos.",
                                accent: "bg-[#C4B590]/15"
                            },
                            {
                                icon: Users,
                                title: "Empoderamiento",
                                description: "Creamos oportunidades para mujeres emprendedoras en Cuba y Europa.",
                                accent: "bg-[#505A4A]/10"
                            },
                            {
                                icon: ShieldCheck,
                                title: "Compromiso",
                                description: "Combinamos tradición cubana con estándares europeos para crear productos únicos.",
                                accent: "bg-[#C4B590]/15"
                            }
                        ].map((value, index) => (
                            <motion.div
                                key={index}
                                variants={cardVariants}
                                whileHover={{ y: -10, scale: 1.02 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm h-full hover:shadow-2xl transition-all duration-300">
                                    <CardContent className="p-8 text-center h-full flex flex-col">
                                        <div className={`w-16 h-16 ${value.accent} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                                            <value.icon className="h-8 w-8 text-[#505A4A]" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-4">{value.title}</h3>
                                        <p className="text-gray-700 font-medium leading-relaxed flex-grow">
                                            {value.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </motion.section>

            {/* CTA Section */}
            <motion.section className="py-24 sm:py-32 bg-[#505A4A] text-white">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="container mx-auto px-4 text-center"
                >
                    <Leaf className="h-12 w-12 text-[#C4B590] mx-auto mb-8" />
                    <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-6">
                        Únete a Nuestra Historia
                    </h2>
                    <p className="text-lg sm:text-xl mb-12 max-w-3xl mx-auto font-medium opacity-90">
                        Sé parte de la revolución de la belleza natural. Descubre productos que no solo cuidan tu piel, sino que también apoyan el sueño de una mujer emprendedora.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
                        <Link href="/products">
                            <Button
                                size="lg"
                                className="w-full sm:w-auto bg-white text-[#505A4A] hover:bg-[#F5F1E8] font-bold px-10 sm:px-12 py-4 text-lg sm:text-xl shadow-xl"
                            >
                                Comprar Ahora
                            </Button>
                        </Link>
                        <Link href="/contact">
                            <button
                                className="w-full sm:w-auto border-2 border-white bg-transparent text-white hover:bg-white hover:text-[#505A4A] font-bold px-10 sm:px-12 py-4 text-lg sm:text-xl rounded-md transition-colors"
                            >
                                Contáctanos
                            </button>
                        </Link>
                    </div>
                </motion.div>
            </motion.section>
        </div>
    );
}
