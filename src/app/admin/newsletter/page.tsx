"use client";

import { AdminGuard, PageHeader } from '@/components/ui/admin-components';
import { Mail, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewsletterAdminPage() {
    return (
        <AdminGuard>
            <div className="min-h-screen bg-gray-50/50 pt-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                    <Link
                        href="/admin"
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#505A4A] transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver al panel
                    </Link>

                    <PageHeader
                        title="Newsletter"
                        description="Gestión de suscriptores del boletín"
                    />

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-8">
                        <div className="p-8 sm:p-10 text-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-6 h-6 text-gray-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">
                                Newsletter con EmailJS
                            </h2>
                            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                                Las suscripciones se gestionan a través de EmailJS.
                                Los emails de bienvenida se envían automáticamente cuando alguien se suscribe.
                            </p>
                            <button
                                onClick={() => window.open('https://dashboard.emailjs.com/admin', '_blank')}
                                className="inline-flex items-center gap-2 bg-[#505A4A] hover:bg-[#414A3C] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Abrir Dashboard de EmailJS
                            </button>
                            <p className="text-xs text-gray-400 mt-4">
                                En EmailJS puedes ver el historial de emails enviados y estadísticas.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminGuard>
    );
}
