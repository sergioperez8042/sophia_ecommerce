"use client";

import { AdminGuard, PageHeader } from '@/components/ui/admin-components';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, ExternalLink } from 'lucide-react';

export default function NewsletterAdminPage() {
    return (
        <AdminGuard>
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6">
                <div className="max-w-4xl mx-auto">
                    <PageHeader
                        title="Newsletter"
                        description="Gestión de suscriptores del boletín"
                    />

                    <Card className="mt-8">
                        <CardContent className="p-8 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                Newsletter con EmailJS
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Las suscripciones se gestionan a través de EmailJS. 
                                Los emails de bienvenida se envían automáticamente cuando alguien se suscribe.
                            </p>
                            <Button
                                onClick={() => window.open('https://dashboard.emailjs.com/admin', '_blank')}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Abrir Dashboard de EmailJS
                            </Button>
                            <p className="text-sm text-gray-500 mt-4">
                                En EmailJS puedes ver el historial de emails enviados y estadísticas.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminGuard>
    );
}
