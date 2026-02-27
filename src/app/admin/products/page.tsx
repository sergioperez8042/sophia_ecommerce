"use client";

import { useEffect, useState } from 'react';
import { useAuth, useProducts, useCategories } from '@/store';
import { IProduct, ICategory } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Pencil,
    Trash2,
    Search,
    Package,
    X,
    Star,
    Eye,
    EyeOff,
    ArrowLeft,
    Save,
    ImageIcon,
    Tag,
    DollarSign,
    FileText,
    Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// Firebase Storage - comentado para uso futuro
// import { storage } from '@/lib/firebase';
// import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';

type ViewMode = 'list' | 'create' | 'edit';

// Empty product template
const emptyProduct: Omit<IProduct, 'id' | 'created_date'> = {
    name: '',
    description: '',
    price: 0,
    category_id: '',
    image: '/images/placeholder.jpg',
    rating: 0,
    reviews_count: 0,
    tags: [],
    ingredients: [],
    active: true,
    featured: false,
};

export default function AdminProductsPage() {
    const router = useRouter();
    const { isAdmin, isLoaded, isAuthenticated } = useAuth();
    const {
        products,
        isLoading,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductActive,
        toggleProductFeatured,
    } = useProducts();
    const { categories, isLoading: categoriesLoading } = useCategories();

    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
    const [formData, setFormData] = useState<Omit<IProduct, 'id' | 'created_date'>>(emptyProduct);
    const [tagsInput, setTagsInput] = useState('');
    const [ingredientsInput, setIngredientsInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Redirect if not admin
    useEffect(() => {
        if (isLoaded && (!isAuthenticated || !isAdmin)) {
            router.push('/auth');
        }
    }, [isLoaded, isAuthenticated, isAdmin, router]);

    if (!isLoaded || isLoading || categoriesLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#505A4A]" />
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    // Filter products
    const filteredProducts = products.filter((p) => {
        const matchesSearch =
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
            categoryFilter === 'all' || p.category_id === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    // Handlers
    const handleCreateNew = () => {
        setFormData(emptyProduct);
        setTagsInput('');
        setIngredientsInput('');
        setEditingProduct(null);
        setViewMode('create');
    };

    const handleEdit = (product: IProduct) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            category_id: product.category_id,
            image: product.image,
            rating: product.rating,
            reviews_count: product.reviews_count,
            tags: product.tags,
            ingredients: product.ingredients,
            active: product.active,
            featured: product.featured,
        });
        setTagsInput(product.tags.join(', '));
        setIngredientsInput(product.ingredients.join(', '));
        setViewMode('edit');
    };

    const handleDelete = async (id: string) => {
        await deleteProduct(id);
        setDeleteConfirm(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar que haya imagen
        if (!formData.image || formData.image === '/images/placeholder.jpg') {
            setUploadError('La imagen del producto es requerida');
            return;
        }

        setIsSaving(true);

        try {
            const productData = {
                ...formData,
                tags: tagsInput
                    .split(',')
                    .map((t) => t.trim())
                    .filter((t) => t),
                ingredients: ingredientsInput
                    .split(',')
                    .map((i) => i.trim())
                    .filter((i) => i),
            };

            if (viewMode === 'create') {
                await addProduct(productData);
            } else if (editingProduct) {
                await updateProduct(editingProduct.id, productData);
            }

            setViewMode('list');
            setFormData(emptyProduct);
            setEditingProduct(null);
        } catch (error) {
            console.error('Error saving product:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setViewMode('list');
        setFormData(emptyProduct);
        setEditingProduct(null);
        setTagsInput('');
        setIngredientsInput('');
    };

    const getCategoryName = (categoryId: string) => {
        const category = categories.find((c) => c.id === categoryId);
        return category?.name || categoryId;
    };

    // Render list view
    if (viewMode === 'list') {
        return (
            <div className="min-h-screen bg-gray-50 pt-20">
                <div className="container mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Link
                                    href="/admin"
                                    className="text-gray-500 hover:text-[#505A4A] transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Gestión de Productos
                                </h1>
                            </div>
                            <p className="text-gray-600">
                                Administra el catálogo de productos de la tienda
                            </p>
                        </div>
                        <Button
                            onClick={handleCreateNew}
                            className="bg-[#505A4A] hover:bg-[#3d5636] text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Producto
                        </Button>
                    </div>

                    {/* Filters */}
                    <Card className="mb-6 border-0 shadow-lg">
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <Input
                                        type="text"
                                        placeholder="Buscar productos..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#505A4A] text-gray-900 bg-white"
                                >
                                    <option value="all" className="text-gray-900">Todas las categorías</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id} className="text-gray-900">
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Card className="border-0 shadow-md">
                            <CardContent className="pt-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Total</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {products.length}
                                        </p>
                                    </div>
                                    <Package className="w-8 h-8 text-gray-400" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-md">
                            <CardContent className="pt-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Activos</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {products.filter((p) => p.active).length}
                                        </p>
                                    </div>
                                    <Eye className="w-8 h-8 text-green-200" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-md">
                            <CardContent className="pt-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Destacados</p>
                                        <p className="text-2xl font-bold text-amber-600">
                                            {products.filter((p) => p.featured).length}
                                        </p>
                                    </div>
                                    <Star className="w-8 h-8 text-amber-200" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-md">
                            <CardContent className="pt-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Inactivos</p>
                                        <p className="text-2xl font-bold text-gray-600">
                                            {products.filter((p) => !p.active).length}
                                        </p>
                                    </div>
                                    <EyeOff className="w-8 h-8 text-gray-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Products Table */}
                    <Card className="border-0 shadow-lg overflow-hidden">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Productos ({filteredProducts.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-gray-50">
                                            <th className="text-left p-4 font-medium text-gray-600">
                                                Producto
                                            </th>
                                            <th className="text-left p-4 font-medium text-gray-600">
                                                Categoría
                                            </th>
                                            <th className="text-left p-4 font-medium text-gray-600">
                                                Precio
                                            </th>
                                            <th className="text-center p-4 font-medium text-gray-600">
                                                Estado
                                            </th>
                                            <th className="text-center p-4 font-medium text-gray-600">
                                                Destacado
                                            </th>
                                            <th className="text-right p-4 font-medium text-gray-600">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <AnimatePresence>
                                            {filteredProducts.map((product, index) => (
                                                <motion.tr
                                                    key={product.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    className="border-b hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            {product.image ? (
                                                                <Image
                                                                    src={product.image}
                                                                    alt={product.name}
                                                                    width={48}
                                                                    height={48}
                                                                    className="w-12 h-12 rounded-lg object-cover"
                                                                    unoptimized
                                                                />
                                                            ) : (
                                                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                                                    <ImageIcon className="w-6 h-6 text-gray-500" />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="font-medium text-gray-900">
                                                                    {product.name}
                                                                </p>
                                                                <p className="text-sm text-gray-500 truncate max-w-[200px]">
                                                                    {product.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge variant="secondary">
                                                            {getCategoryName(product.category_id)}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="font-semibold text-green-600">
                                                            €{product.price.toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <button
                                                            onClick={() => toggleProductActive(product.id)}
                                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${product.active
                                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                                }`}
                                                        >
                                                            {product.active ? (
                                                                <>
                                                                    <Eye className="w-3 h-3" />
                                                                    Activo
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <EyeOff className="w-3 h-3" />
                                                                    Inactivo
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <button
                                                            onClick={() => toggleProductFeatured(product.id)}
                                                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${product.featured
                                                                ? 'bg-amber-100 text-amber-600'
                                                                : 'bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-500'
                                                                }`}
                                                        >
                                                            <Star
                                                                className={`w-4 h-4 ${product.featured ? 'fill-current' : ''
                                                                    }`}
                                                            />
                                                        </button>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEdit(product)}
                                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            {deleteConfirm === product.id ? (
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleDelete(product.id)}
                                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    >
                                                                        Sí
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => setDeleteConfirm(null)}
                                                                        className="text-gray-600 hover:text-gray-700"
                                                                    >
                                                                        No
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setDeleteConfirm(product.id)}
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
                                    </tbody>
                                </table>

                                {filteredProducts.length === 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                        <p>No se encontraron productos</p>
                                    </div>
                                )}
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
                        onClick={handleCancel}
                        className="flex items-center gap-2 text-gray-600 hover:text-[#505A4A] transition-colors mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Volver a la lista
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {viewMode === 'create' ? 'Nuevo Producto' : 'Editar Producto'}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {viewMode === 'create'
                            ? 'Completa la información para crear un nuevo producto'
                            : `Editando: ${editingProduct?.name}`}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Info */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        Información Básica
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nombre del Producto *
                                        </label>
                                        <Input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, name: e.target.value })
                                            }
                                            placeholder="Ej: Crema Hidratante Natural"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Descripción *
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) =>
                                                setFormData({ ...formData, description: e.target.value })
                                            }
                                            placeholder="Describe el producto..."
                                            rows={4}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#505A4A] text-gray-900 placeholder:text-gray-500"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                <DollarSign className="w-4 h-4 inline mr-1" />
                                                Precio (€) *
                                            </label>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                value={formData.price === 0 ? '' : formData.price.toString()}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                                        setFormData({
                                                            ...formData,
                                                            price: value === '' ? 0 : parseFloat(value) || 0,
                                                        });
                                                    }
                                                }}
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                <Layers className="w-4 h-4 inline mr-1" />
                                                Categoría *
                                            </label>
                                            <select
                                                value={formData.category_id}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, category_id: e.target.value })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#505A4A] text-gray-900 bg-white"
                                                required
                                            >
                                                <option value="" className="text-gray-500">Seleccionar categoría</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.id} className="text-gray-900">
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Tag className="w-5 h-5" />
                                        Etiquetas e Ingredientes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Etiquetas (separadas por coma)
                                        </label>
                                        <Input
                                            type="text"
                                            value={tagsInput}
                                            onChange={(e) => setTagsInput(e.target.value)}
                                            placeholder="Ej: natural, hidratante, orgánico"
                                        />
                                        {tagsInput && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {tagsInput
                                                    .split(',')
                                                    .map((t) => t.trim())
                                                    .filter((t) => t)
                                                    .map((tag, i) => (
                                                        <Badge key={i} variant="secondary">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ingredientes (separados por coma)
                                        </label>
                                        <textarea
                                            value={ingredientsInput}
                                            onChange={(e) => setIngredientsInput(e.target.value)}
                                            placeholder="Ej: aloe vera, aceite de jojoba, manteca de karité"
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#505A4A] text-gray-900 placeholder:text-gray-500"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ImageIcon className="w-5 h-5" />
                                        Imagen <span className="text-red-500">*</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {uploadError && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                            {uploadError}
                                        </div>
                                    )}

                                    {/* File Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Subir imagen desde dispositivo <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    // Show immediate local preview
                                                    const localPreviewUrl = URL.createObjectURL(file);
                                                    setFormData({ ...formData, image: localPreviewUrl });

                                                    setIsUploading(true);
                                                    setUploadProgress(10);
                                                    setUploadError(null);

                                                    try {
                                                        // Upload to local API
                                                        const uploadFormData = new FormData();
                                                        uploadFormData.append('file', file);

                                                        setUploadProgress(30);

                                                        const response = await fetch('/api/upload', {
                                                            method: 'POST',
                                                            body: uploadFormData,
                                                        });

                                                        setUploadProgress(80);

                                                        const result = await response.json();

                                                        if (!response.ok) {
                                                            throw new Error(result.error || 'Error al subir la imagen');
                                                        }

                                                        // Update with server URL
                                                        URL.revokeObjectURL(localPreviewUrl);
                                                        setFormData({ ...formData, image: result.url });
                                                        setUploadProgress(100);
                                                        setIsUploading(false);


                                                        // Firebase Storage code removed - see commented imports at top of file for future use

                                                    } catch (error: any) {
                                                        console.error('Error uploading:', error);
                                                        setUploadError(error.message || 'No se pudo subir la imagen');
                                                        setIsUploading(false);
                                                    }
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#505A4A] file:text-white hover:file:bg-[#3d5636] cursor-pointer"
                                                disabled={isUploading}
                                            />
                                        </div>

                                        {/* Upload Progress */}
                                        {isUploading && (
                                            <div className="mt-2">
                                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-[#505A4A] transition-all duration-300"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1">Subiendo... {Math.round(uploadProgress)}%</p>
                                            </div>
                                        )}

                                        {/* Upload Error */}
                                        {uploadError && (
                                            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                                                <p className="text-sm text-red-700">{uploadError}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <Card className="border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle>Estado</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            {formData.active ? (
                                                <Eye className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <EyeOff className="w-4 h-4 text-gray-500" />
                                            )}
                                            <span className="text-sm font-medium text-gray-900">
                                                {formData.active ? 'Producto visible' : 'Producto oculto'}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setFormData({ ...formData, active: !formData.active })
                                            }
                                            className={`w-12 h-6 rounded-full transition-colors ${formData.active ? 'bg-green-500' : 'bg-gray-300'
                                                }`}
                                        >
                                            <div
                                                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.active ? 'translate-x-6' : 'translate-x-0.5'
                                                    }`}
                                            />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Star
                                                className={`w-4 h-4 ${formData.featured
                                                    ? 'text-amber-500 fill-current'
                                                    : 'text-gray-500'
                                                    }`}
                                            />
                                            <span className="text-sm font-medium text-gray-900">
                                                {formData.featured ? 'Destacado' : 'No destacado'}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setFormData({ ...formData, featured: !formData.featured })
                                            }
                                            className={`w-12 h-6 rounded-full transition-colors ${formData.featured ? 'bg-amber-500' : 'bg-gray-300'
                                                }`}
                                        >
                                            <div
                                                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.featured ? 'translate-x-6' : 'translate-x-0.5'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Preview */}
                            <Card className="border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle>Vista Previa</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-gray-100 rounded-lg p-4">
                                        <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-3 overflow-hidden relative">
                                            {formData.image && formData.image !== '/images/placeholder.jpg' ? (
                                                <Image
                                                    src={formData.image}
                                                    alt="Vista previa"
                                                    fill
                                                    className="object-cover"
                                                    unoptimized={formData.image.startsWith('blob:')}
                                                />
                                            ) : (
                                                <ImageIcon className="w-8 h-8 text-gray-500" />
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-gray-900 truncate">
                                            {formData.name || 'Nombre del producto'}
                                        </h3>
                                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                                            {formData.description || 'Descripción del producto'}
                                        </p>
                                        <p className="text-lg font-bold text-green-600 mt-2">
                                            €{formData.price.toFixed(2)}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Actions */}
                            <div className="flex flex-col gap-3">
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full bg-[#505A4A] hover:bg-[#3d5636] text-white"
                                >
                                    {isSaving ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            {viewMode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                    className="w-full"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
