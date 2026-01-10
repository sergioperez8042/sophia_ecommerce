"use client";

import { useEffect, useState } from 'react';
import { useAuth, useCategories } from '@/store';
import { ICategory } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Pencil,
    Trash2,
    Layers,
    Package,
    ArrowLeft,
    Save,
    ImageIcon,
    Eye,
    EyeOff,
    ArrowUpFromLine,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type ViewMode = 'list' | 'create' | 'edit';

// Empty category template
const emptyCategory: Omit<ICategory, 'id'> = {
    name: '',
    description: '',
    image: '/images/categories/placeholder.jpg',
    active: true,
    sort_order: 0,
    product_count: 0
};

export default function AdminCategoriesPage() {
    const router = useRouter();
    const { isAdmin, isLoaded, isAuthenticated } = useAuth();
    const {
        categories,
        isLoading,
        createCategory,
        updateCategory,
        deleteCategory,
        refreshCategories
    } = useCategories();

    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
    const [formData, setFormData] = useState<Omit<ICategory, 'id'>>(emptyCategory);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Redirect if not admin
    useEffect(() => {
        if (isLoaded && (!isAuthenticated || !isAdmin)) {
            router.push('/auth');
        }
    }, [isLoaded, isAuthenticated, isAdmin, router]);

    if (!isLoaded || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A6741]" />
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    const resetForm = () => {
        setFormData(emptyCategory);
        setEditingCategory(null);
        setViewMode('list');
        setDeleteConfirm(null);
    };

    const handleCreate = () => {
        // Auto-increment sort order
        const maxOrder = Math.max(...categories.map(c => c.sort_order || 0), 0);
        setFormData({ ...emptyCategory, sort_order: maxOrder + 1 });
        setViewMode('create');
    };

    const handleEdit = (category: ICategory) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description,
            image: category.image || '/images/categories/placeholder.jpg',
            active: category.active,
            sort_order: category.sort_order || 0,
            product_count: category.product_count || 0,
        });
        setViewMode('edit');
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteCategory(id);
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('Error al eliminar la categoría');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            if (viewMode === 'create') {
                await createCategory(formData);
            } else if (viewMode === 'edit' && editingCategory) {
                await updateCategory(editingCategory.id, formData);
            }
            resetForm();
            await refreshCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Error al guardar la categoría');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleActive = async (category: ICategory) => {
        try {
            await updateCategory(category.id, { active: !category.active });
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    // Render list view
    if (viewMode === 'list') {
        return (
            <div className="min-h-screen bg-gray-50 pt-20">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <Link
                                href="/admin"
                                className="flex items-center gap-2 text-gray-600 hover:text-[#4A6741] transition-colors mb-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Volver al panel
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-900">Gestión de Categorías</h1>
                            <p className="text-gray-600">Administra las categorías de productos de tu tienda</p>
                        </div>
                        <Button
                            onClick={handleCreate}
                            className="bg-[#4A6741] hover:bg-[#3d5636] text-white"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Nueva Categoría
                        </Button>
                    </div>

                    <Card className="border-0 shadow-lg overflow-hidden">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Layers className="w-5 h-5" />
                                Categorías ({categories.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-gray-50">
                                            <th className="text-left p-4 font-medium text-gray-600">Orden</th>
                                            <th className="text-left p-4 font-medium text-gray-600">Categoría</th>
                                            <th className="text-left p-4 font-medium text-gray-600">Descripción</th>
                                            <th className="text-center p-4 font-medium text-gray-600">Estado</th>
                                            <th className="text-end p-4 font-medium text-gray-600">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <AnimatePresence>
                                            {categories.map((category, index) => (
                                                <motion.tr
                                                    key={category.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="border-b hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="p-4 font-mono text-sm text-gray-500">
                                                        {category.sort_order}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-gray-100 relative overflow-hidden flex items-center justify-center">
                                                                {category.image && category.image !== '/images/placeholder.jpg' ? (
                                                                    <Image
                                                                        src={category.image}
                                                                        alt={category.name}
                                                                        fill
                                                                        className="object-cover"
                                                                        unoptimized
                                                                    />
                                                                ) : (
                                                                    <ImageIcon className="w-5 h-5 text-gray-400" />
                                                                )}
                                                            </div>
                                                            <span className="font-medium text-gray-900">{category.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-gray-600 max-w-xs truncate">
                                                        {category.description}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <button
                                                            onClick={() => toggleActive(category)}
                                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${category.active
                                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                                }`}
                                                        >
                                                            {category.active ? (
                                                                <>
                                                                    <Eye className="w-3 h-3" />
                                                                    Activa
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <EyeOff className="w-3 h-3" />
                                                                    Oculta
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEdit(category)}
                                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            {deleteConfirm === category.id ? (
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleDelete(category.id)}
                                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-red-50"
                                                                    >
                                                                        Confirmar
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => setDeleteConfirm(null)}
                                                                        className="text-gray-600 hover:text-gray-700"
                                                                    >
                                                                        X
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setDeleteConfirm(category.id)}
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                        {categories.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="text-center py-12 text-gray-500">
                                                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                                    <p>No hay categorías creadas</p>
                                                    <Button variant="link" onClick={handleCreate}>
                                                        Crear la primera categoría
                                                    </Button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Render create/edit form
    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={resetForm}
                        className="flex items-center gap-2 text-gray-600 hover:text-[#4A6741] transition-colors mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Volver a la lista
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {viewMode === 'create' ? 'Nueva Categoría' : 'Editar Categoría'}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {viewMode === 'create'
                            ? 'Define una nueva sección para tu catálogo'
                            : `Editando: ${editingCategory?.name}`}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="max-w-3xl">
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Layers className="w-5 h-5" />
                                Información de la Categoría
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nombre *
                                        </label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Ej: Cuidado Facial"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Orden de Visualización
                                        </label>
                                        <div className="relative">
                                            <ArrowUpFromLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                type="number"
                                                value={formData.sort_order}
                                                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                                                className="pl-9"
                                                min="0"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Número más bajo = aparece primero</p>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2">
                                        <input
                                            type="checkbox"
                                            id="active"
                                            checked={formData.active}
                                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                            className="w-4 h-4 text-[#4A6741] focus:ring-[#4A6741] rounded"
                                        />
                                        <label htmlFor="active" className="text-sm font-medium text-gray-700 select-none">
                                            Categoría Visible al público
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        URL de Imagen
                                    </label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={formData.image}
                                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                            placeholder="/images/categories/..."
                                        />
                                    </div>
                                    <div className="mt-4 aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative flex items-center justify-center group">
                                        {formData.image ? (
                                            <>
                                                <Image
                                                    src={formData.image}
                                                    alt="Preview"
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                    onError={(e) => {
                                                        // Fallback logic could go here
                                                        (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
                                                    Vista Previa
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center text-gray-400">
                                                <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                <span className="text-sm">Sin imagen</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A6741]"
                                    placeholder="Breve descripción de la categoría..."
                                />
                            </div>

                            <div className="border-t pt-6 flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetForm}
                                    disabled={isSaving}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-[#4A6741] hover:bg-[#3d5636] text-white min-w-[150px]"
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <span className="animate-pulse">Guardando...</span>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Guardar Categoría
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </div>
    );
}
