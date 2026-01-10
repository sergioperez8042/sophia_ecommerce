import React from "react";
import { Leaf, Shield, Heart, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function ValueProposition() {
    const values = [
        {
            icon: Leaf,
            title: "100% Natural",
            description: "Ingredientes orgánicos seleccionados con cuidado para tu piel"
        },
        {
            icon: Shield,
            title: "Sin químicos",
            description: "Libres de parabenos, sulfatos y ingredientes sintéticos"
        },
        {
            icon: Heart,
            title: "Cruelty Free",
            description: "Nunca testamos en animales, comprometidos con el bienestar animal"
        },
        {
            icon: Sparkles,
            title: "Artesanal",
            description: "Elaborados a mano en pequeños lotes para garantizar la calidad"
        }
    ];

    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        ¿Por qué elegir Sophia?
                    </h2>
                    <p className="text-xl text-gray-800 max-w-3xl mx-auto">
                        Nuestro compromiso con la belleza natural y sostenible nos hace únicos
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {values.map((value, index) => {
                        const Icon = value.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className="text-center group"
                            >
                                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#4A6741] to-[#3F5D4C] flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                                    <Icon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                    {value.title}
                                </h3>
                                <p className="text-gray-700 leading-relaxed">
                                    {value.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}