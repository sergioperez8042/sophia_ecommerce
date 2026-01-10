"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/store';
import { AdminGuard, PageHeader, LoadingSpinner } from '@/components/ui/admin-components';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
    Users,
    Mail,
    Trash2,
    Download,
    Search,
    TrendingUp,
    Calendar,
    Send,
    RefreshCw,
    AlertCircle,
    CheckCircle
} from 'lucide-react';

interface Subscriber {
    email: string;
    subscribedAt: string;
    source: 'newsletter' | 'checkout' | 'contact';
}

export default function NewsletterAdminPage() {
    const { isAdmin, isLoaded } = useAuth();
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Fetch subscribers
    const fetchSubscribers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/subscribe');
            const data = await res.json();
            setSubscribers(data.subscribers || []);
        } catch (error) {
            console.error('Error fetching subscribers:', error);
            setMessage({ type: 'error', text: 'Error al cargar suscriptores' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isLoaded && isAdmin) {
            fetchSubscribers();
        }
    }, [isLoaded, isAdmin]);

    // Delete subscriber
    const handleDelete = async (email: string) => {
        if (!confirm(`¿Eliminar a ${email} de la lista?`)) return;

        try {
            const res = await fetch('/api/newsletter', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setSubscribers(prev => prev.filter(s => s.email !== email));
                setMessage({ type: 'success', text: 'Suscriptor eliminado' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al eliminar suscriptor' });
        }
    };

    // Export to CSV
    const handleExport = () => {
        const csv = [
            'Email,Fecha de Suscripción,Fuente',
            ...subscribers.map(s => `${s.email},${new Date(s.subscribedAt).toLocaleDateString()},${s.source}`)
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `suscriptores-sophia-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Filter subscribers
    const filteredSubscribers = subscribers.filter(s =>
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Stats
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const newThisMonth = subscribers.filter(s => new Date(s.subscribedAt) >= thisMonth).length;

    return (
        <AdminGuard>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <PageHeader
                        title="Newsletter"
                        description="Gestiona tus suscriptores y envía newsletters"
                    />

                    {/* Message */}
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}
                        >
                            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            {message.text}
                            <button onClick={() => setMessage(null)} className="ml-auto">×</button>
                        </motion.div>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Total Suscriptores</p>
                                        <p className="text-3xl font-bold text-gray-900">{subscribers.length}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-[#4A6741]/10 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-[#4A6741]" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Este Mes</p>
                                        <p className="text-3xl font-bold text-[#4A6741]">+{newThisMonth}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Último Suscriptor</p>
                                        <p className="text-lg font-medium text-gray-900 truncate max-w-[180px]">
                                            {subscribers[subscribers.length - 1]?.email || '-'}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Mail className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                placeholder="Buscar por email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={fetchSubscribers} disabled={isLoading}>
                                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Actualizar
                            </Button>
                            <Button variant="outline" onClick={handleExport}>
                                <Download className="w-4 h-4 mr-2" />
                                Exportar CSV
                            </Button>
                        </div>
                    </div>

                    {/* Subscribers Table */}
                    <Card className="border-0 shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            {isLoading ? (
                                <div className="flex justify-center py-12">
                                    <LoadingSpinner />
                                </div>
                            ) : filteredSubscribers.length === 0 ? (
                                <div className="text-center py-12">
                                    <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No hay suscriptores aún</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Fecha</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Fuente</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredSubscribers.map((subscriber, index) => (
                                            <motion.tr
                                                key={subscriber.email}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.02 }}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-[#4A6741]/10 flex items-center justify-center">
                                                            <span className="text-sm font-medium text-[#4A6741]">
                                                                {subscriber.email[0].toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <span className="font-medium text-gray-900">{subscriber.email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(subscriber.subscribedAt).toLocaleDateString('es-ES', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="secondary" className="capitalize">
                                                        {subscriber.source}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(subscriber.email)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </Card>

                    {/* Info Card */}
                    <Card className="border-0 shadow-lg mt-8">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <Send className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Email de Bienvenida Automático</h3>
                                    <p className="text-gray-600 text-sm">
                                        Cada nuevo suscriptor recibe automáticamente un email de bienvenida profesional con el código de descuento <strong>BIENVENIDA10</strong> (10% de descuento en su primera compra).
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminGuard>
    );
}
