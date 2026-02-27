"use client";

import { useEffect, useState } from 'react';
import { useAuth, useProducts, useCategories } from '@/store';
import { IProduct } from '@/entities/all';
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
    FileText,
    Check,
    AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type ViewMode = 'list' | 'create' | 'edit';

const PLACEHOLDER_IMAGE = "/images/no-image.svg";

const emptyProduct: Omit<IProduct, 'id' | 'created_date'> = {
    name: '',
    description: '',
    price: 0,
    category_id: '',
    image: '',
    rating: 0,
    reviews_count: 0,
    tags: [],
    ingredients: [],
    active: true,
    featured: false,
};

function ProductListItem({
    product,
    categoryName,
    onEdit,
    onDelete,
    onToggleActive,
    onToggleFeatured,
    deleteConfirm,
    setDeleteConfirm,
}: {
    product: IProduct;
    categoryName: string;
    onEdit: () => void;
    onDelete: () => void;
    onToggleActive: () => void;
    onToggleFeatured: () => void;
    deleteConfirm: boolean;
    setDeleteConfirm: (id: string | null) => void;
}) {
    const [imgError, setImgError] = useState(false);
    const productImage = imgError || !product.image ? PLACEHOLDER_IMAGE : product.image;

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex gap-3 p-3 sm:p-4">
                {/* Image */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                        src={productImage}
                        alt={product.name}
                        fill
                        className="object-cover"
                        onError={() => setImgError(true)}
                        unoptimized={productImage === PLACEHOLDER_IMAGE}
                    />
                    {product.featured && (
                        <div className="absolute top-1 left-1 bg-[#C4B590] rounded-full p-1">
                            <Star className="w-2.5 h-2.5 text-white fill-current" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                {product.name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">{categoryName}</p>
                        </div>
                        <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                            product.active
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-gray-100 text-gray-500'
                        }`}>
                            {product.active ? 'Activo' : 'Oculto'}
                        </span>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-1">
                        {product.description}
                    </p>

                    {/* Price + Actions */}
                    <div className="flex items-center justify-between mt-2 sm:mt-3">
                        <span className="text-base sm:text-lg font-bold text-gray-900">
                            €{product.price.toFixed(2)}
                        </span>

                        <div className="flex items-center gap-1">
                            {deleteConfirm ? (
                                <div className="flex items-center gap-1 bg-red-50 rounded-lg px-2 py-1">
                                    <span className="text-xs text-red-600 mr-1">¿Eliminar?</span>
                                    <button
                                        onClick={onDelete}
                                        className="text-red-600 hover:bg-red-100 rounded p-1 transition-colors"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(null)}
                                        className="text-gray-500 hover:bg-gray-100 rounded p-1 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={onToggleFeatured}
                                        className={`p-1.5 rounded-lg transition-colors ${
                                            product.featured
                                                ? 'text-[#C4B590] bg-[#C4B590]/10'
                                                : 'text-gray-400 hover:text-[#C4B590] hover:bg-gray-100'
                                        }`}
                                        title={product.featured ? 'Quitar destacado' : 'Destacar'}
                                    >
                                        <Star className={`w-4 h-4 ${product.featured ? 'fill-current' : ''}`} />
                                    </button>
                                    <button
                                        onClick={onToggleActive}
                                        className={`p-1.5 rounded-lg transition-colors ${
                                            product.active
                                                ? 'text-emerald-600 hover:bg-emerald-50'
                                                : 'text-gray-400 hover:bg-gray-100'
                                        }`}
                                        title={product.active ? 'Ocultar' : 'Activar'}
                                    >
                                        {product.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={onEdit}
                                        className="p-1.5 rounded-lg text-[#505A4A] hover:bg-[#505A4A]/10 transition-colors"
                                        title="Editar"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(product.id)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

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
    const { categories, isLoading: categoriesLoading, getCategoryPath } = useCategories();

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
    const [formImgError, setFormImgError] = useState(false);

    useEffect(() => {
        if (isLoaded && (!isAuthenticated || !isAdmin)) {
            router.push('/auth');
        }
    }, [isLoaded, isAuthenticated, isAdmin, router]);

    if (!isLoaded || isLoading || categoriesLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#505A4A] border-t-transparent" />
            </div>
        );
    }

    if (!isAdmin) return null;

    const filteredProducts = products.filter((p) => {
        const matchesSearch =
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
            categoryFilter === 'all' || p.category_id === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const stats = {
        total: products.length,
        active: products.filter((p) => p.active).length,
        featured: products.filter((p) => p.featured).length,
        inactive: products.filter((p) => !p.active).length,
    };

    const handleCreateNew = () => {
        setFormData(emptyProduct);
        setTagsInput('');
        setIngredientsInput('');
        setEditingProduct(null);
        setUploadError(null);
        setFormImgError(false);
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
        setUploadError(null);
        setFormImgError(false);
        setViewMode('edit');
    };

    const handleDelete = async (id: string) => {
        await deleteProduct(id);
        setDeleteConfirm(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.image || formData.image === '/images/placeholder.jpg') {
            setUploadError('La imagen del producto es requerida');
            return;
        }

        setIsSaving(true);
        try {
            const productData = {
                ...formData,
                tags: tagsInput.split(',').map((t) => t.trim()).filter((t) => t),
                ingredients: ingredientsInput.split(',').map((i) => i.trim()).filter((i) => i),
            };

            if (viewMode === 'create') {
                await addProduct(productData);
            } else if (editingProduct) {
                await updateProduct(editingProduct.id, productData);
            }

            setViewMode('list');
            setFormData(emptyProduct);
            setEditingProduct(null);
        } catch {
            // Error handled by context
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
        setUploadError(null);
    };

    const handleFileUpload = async (file: File) => {
        const localPreviewUrl = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, image: localPreviewUrl }));
        setFormImgError(false);
        setIsUploading(true);
        setUploadProgress(10);
        setUploadError(null);

        try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            uploadFormData.append('folder', 'products');
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

            URL.revokeObjectURL(localPreviewUrl);
            setFormData(prev => ({ ...prev, image: result.url }));
            setUploadProgress(100);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'No se pudo subir la imagen';
            setUploadError(msg);
        } finally {
            setIsUploading(false);
        }
    };

    const getCategoryName = (categoryId: string) => {
        const path = getCategoryPath(categoryId);
        if (path.length === 0) return 'Sin categoría';
        return path.map(c => c.name).join(' › ');
    };

    // Build hierarchical category options for selectors
    const buildCategoryOptions = () => {
        const options: { id: string; label: string; depth: number }[] = [];
        const addCategory = (cat: { id: string; name: string; parent_id?: string }, depth: number) => {
            const prefix = depth > 0 ? '  '.repeat(depth) + '↳ ' : '';
            options.push({ id: cat.id, label: `${prefix}${cat.name}`, depth });
            const children = categories
                .filter(c => c.parent_id === cat.id)
                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            children.forEach(child => addCategory(child, depth + 1));
        };
        categories
            .filter(c => !c.parent_id)
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            .forEach(cat => addCategory(cat, 0));
        return options;
    };

    const categoryOptions = buildCategoryOptions();

    // ─── LIST VIEW ───────────────────────────────────────────────
    if (viewMode === 'list') {
        return (
            <div className="min-h-screen bg-gray-50 pt-20">
                <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Productos</h1>
                            </div>
                            <p className="text-sm text-gray-500 ml-7">{stats.total} productos en catálogo</p>
                        </div>
                        <button
                            onClick={handleCreateNew}
                            className="flex items-center gap-2 bg-[#505A4A] text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-medium hover:bg-[#414A3C] transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Nuevo Producto</span>
                            <span className="sm:hidden">Nuevo</span>
                        </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-5">
                        {[
                            { label: 'Total', value: stats.total, icon: Package },
                            { label: 'Activos', value: stats.active, icon: Eye },
                            { label: 'Destacados', value: stats.featured, icon: Star },
                            { label: 'Ocultos', value: stats.inactive, icon: EyeOff },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                                <stat.icon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                                <p className="text-lg sm:text-xl font-bold text-gray-900">{stat.value}</p>
                                <p className="text-[10px] sm:text-xs text-gray-500">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Search + Filter */}
                    <div className="flex gap-2 mb-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar productos..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#505A4A]/30 focus:border-[#505A4A] transition-all"
                            />
                        </div>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#505A4A]/30 focus:border-[#505A4A] min-w-[120px] sm:min-w-[160px]"
                        >
                            <option value="all">Todas</option>
                            {categoryOptions.map((opt) => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Products List */}
                    <div className="space-y-2 sm:space-y-3">
                        {filteredProducts.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No se encontraron productos</p>
                                <p className="text-sm text-gray-400 mt-1">Prueba con otros filtros</p>
                            </div>
                        ) : (
                            filteredProducts.map((product) => (
                                <ProductListItem
                                    key={product.id}
                                    product={product}
                                    categoryName={getCategoryName(product.category_id)}
                                    onEdit={() => handleEdit(product)}
                                    onDelete={() => handleDelete(product.id)}
                                    onToggleActive={() => toggleProductActive(product.id)}
                                    onToggleFeatured={() => toggleProductFeatured(product.id)}
                                    deleteConfirm={deleteConfirm === product.id}
                                    setDeleteConfirm={setDeleteConfirm}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ─── CREATE / EDIT FORM ──────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={handleCancel}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-3"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver
                    </button>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                        {viewMode === 'create' ? 'Nuevo Producto' : 'Editar Producto'}
                    </h1>
                    {viewMode === 'edit' && editingProduct && (
                        <p className="text-sm text-gray-500 mt-1">Editando: {editingProduct.name}</p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Image Upload */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
                        <label className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                            <ImageIcon className="w-4 h-4 text-gray-500" />
                            Imagen del producto <span className="text-red-500">*</span>
                        </label>

                        <div className="relative w-full h-48 sm:h-56 bg-gray-100 rounded-xl overflow-hidden mb-3">
                            {formData.image && formData.image !== '/images/placeholder.jpg' && formData.image !== '' && !formImgError ? (
                                <Image
                                    src={formData.image}
                                    alt="Vista previa"
                                    fill
                                    className="object-cover"
                                    onError={() => setFormImgError(true)}
                                    unoptimized
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <ImageIcon className="w-10 h-10 mb-2" />
                                    <span className="text-sm">{formImgError ? 'Imagen no disponible' : 'Sin imagen'}</span>
                                    {formImgError && formData.image && (
                                        <span className="text-xs text-gray-400 mt-1 px-4 text-center truncate max-w-full">
                                            {formData.image}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file);
                            }}
                            className="w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#505A4A] file:text-white hover:file:bg-[#414A3C] file:cursor-pointer cursor-pointer"
                            disabled={isUploading}
                        />

                        {isUploading && (
                            <div className="mt-3">
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#505A4A] transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Subiendo... {Math.round(uploadProgress)}%</p>
                            </div>
                        )}

                        {uploadError && (
                            <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <p className="text-sm text-red-700">{uploadError}</p>
                            </div>
                        )}
                    </div>

                    {/* Basic Info */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            Información Básica
                        </h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Crema Hidratante Natural"
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#505A4A]/30 focus:border-[#505A4A] focus:bg-white transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción *</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe el producto..."
                                rows={3}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#505A4A]/30 focus:border-[#505A4A] focus:bg-white transition-all resize-none"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio (€) *</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={formData.price === 0 ? '' : formData.price.toString()}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                            setFormData({ ...formData, price: value === '' ? 0 : parseFloat(value) || 0 });
                                        }
                                    }}
                                    placeholder="0.00"
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#505A4A]/30 focus:border-[#505A4A] focus:bg-white transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoría *</label>
                                <select
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#505A4A]/30 focus:border-[#505A4A] focus:bg-white transition-all"
                                    required
                                >
                                    <option value="">Seleccionar</option>
                                    {categoryOptions.map((opt) => (
                                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Tags & Ingredients */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <Tag className="w-4 h-4 text-gray-500" />
                            Etiquetas e Ingredientes
                        </h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Etiquetas (separadas por coma)</label>
                            <input
                                type="text"
                                value={tagsInput}
                                onChange={(e) => setTagsInput(e.target.value)}
                                placeholder="natural, hidratante, orgánico"
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#505A4A]/30 focus:border-[#505A4A] focus:bg-white transition-all"
                            />
                            {tagsInput && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {tagsInput.split(',').map((t) => t.trim()).filter((t) => t).map((tag, i) => (
                                        <span key={i} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-lg">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ingredientes (separados por coma)</label>
                            <textarea
                                value={ingredientsInput}
                                onChange={(e) => setIngredientsInput(e.target.value)}
                                placeholder="aloe vera, aceite de jojoba, manteca de karité"
                                rows={2}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#505A4A]/30 focus:border-[#505A4A] focus:bg-white transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Status toggles */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-3">
                        <h2 className="text-sm font-semibold text-gray-900 mb-1">Estado</h2>

                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-2.5">
                                {formData.active ? (
                                    <Eye className="w-4 h-4 text-emerald-600" />
                                ) : (
                                    <EyeOff className="w-4 h-4 text-gray-400" />
                                )}
                                <p className="text-sm font-medium text-gray-900">
                                    {formData.active ? 'Visible en catálogo' : 'Oculto del catálogo'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, active: !formData.active })}
                                className={`relative w-11 h-6 rounded-full transition-colors ${formData.active ? 'bg-[#505A4A]' : 'bg-gray-300'}`}
                            >
                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.active ? 'left-[22px]' : 'left-0.5'}`} />
                            </button>
                        </div>

                        <div className="border-t border-gray-100" />

                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-2.5">
                                <Star className={`w-4 h-4 ${formData.featured ? 'text-[#C4B590] fill-current' : 'text-gray-400'}`} />
                                <p className="text-sm font-medium text-gray-900">
                                    {formData.featured ? 'Producto destacado' : 'No destacado'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, featured: !formData.featured })}
                                className={`relative w-11 h-6 rounded-full transition-colors ${formData.featured ? 'bg-[#505A4A]' : 'bg-gray-300'}`}
                            >
                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.featured ? 'left-[22px]' : 'left-0.5'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2 pb-8">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#505A4A] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#414A3C] disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {isSaving ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {viewMode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
