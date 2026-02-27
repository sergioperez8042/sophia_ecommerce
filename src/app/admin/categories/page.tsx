"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth, useCategories } from '@/store';
import { ICategory } from '@/entities/all';
import {
    Plus,
    Pencil,
    Trash2,
    Layers,
    ArrowLeft,
    Save,
    ImageIcon,
    Eye,
    EyeOff,
    Check,
    X,
    AlertTriangle,
    ChevronRight,
    ChevronDown,
    FolderPlus,
    CornerDownRight,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProductImage from '@/components/ui/product-image';

type ViewMode = 'list' | 'create' | 'edit';

const emptyCategory: Omit<ICategory, 'id'> = {
    name: '',
    description: '',
    image: '',
    active: true,
    sort_order: 0,
    product_count: 0,
    parent_id: '',
};

function CategoryTreeItem({
    category,
    children: childCategories,
    level,
    onEdit,
    onDelete,
    onToggleActive,
    onAddSubcategory,
    deleteConfirm,
    setDeleteConfirm,
    expandedIds,
    toggleExpand,
    allCategories,
}: {
    category: ICategory;
    children: ICategory[];
    level: number;
    onEdit: (cat: ICategory) => void;
    onDelete: (id: string) => void;
    onToggleActive: (cat: ICategory) => void;
    onAddSubcategory: (parentId: string) => void;
    deleteConfirm: string | null;
    setDeleteConfirm: (id: string | null) => void;
    expandedIds: Set<string>;
    toggleExpand: (id: string) => void;
    allCategories: ICategory[];
}) {
    const hasChildren = childCategories.length > 0;
    const isExpanded = expandedIds.has(category.id);

    const getChildrenOf = (parentId: string) =>
        allCategories
            .filter(c => c.parent_id === parentId)
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    return (
        <div>
            <div
                className={`bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${
                    level > 0 ? 'ml-4 sm:ml-8 border-l-4 border-l-[#505A4A]/20' : ''
                }`}
            >
                <div className="flex gap-3 p-3 sm:p-4">
                    {/* Expand/collapse + Image */}
                    <div className="flex items-center gap-1.5">
                        {hasChildren ? (
                            <button
                                onClick={() => toggleExpand(category.id)}
                                className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                ) : (
                                    <ChevronRight className="w-4 h-4" />
                                )}
                            </button>
                        ) : (
                            <div className="w-6" />
                        )}

                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                            <ProductImage
                                src={category.image}
                                alt={category.name}
                                className="object-cover"
                            />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    {level > 0 && (
                                        <CornerDownRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                    )}
                                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                                        {category.name}
                                    </h3>
                                </div>
                                {category.description && (
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                        {category.description}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-[10px] font-mono text-gray-400">#{category.sort_order}</span>
                                <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${
                                    category.active
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {category.active ? 'Activa' : 'Oculta'}
                                </span>
                            </div>
                        </div>

                        {/* Stats + Actions */}
                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                <span>{category.product_count || 0} productos</span>
                                {hasChildren && (
                                    <span>{childCategories.length} subcategorías</span>
                                )}
                            </div>

                            <div className="flex items-center gap-0.5">
                                {deleteConfirm === category.id ? (
                                    <div className="flex items-center gap-1 bg-red-50 rounded-lg px-2 py-1">
                                        <span className="text-xs text-red-600 mr-1">
                                            {hasChildren ? '¿Eliminar con subcategorías?' : '¿Eliminar?'}
                                        </span>
                                        <button
                                            onClick={() => onDelete(category.id)}
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
                                            onClick={() => onAddSubcategory(category.id)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#505A4A] hover:bg-gray-100 transition-colors"
                                            title="Agregar subcategoría"
                                        >
                                            <FolderPlus className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onToggleActive(category)}
                                            className={`p-1.5 rounded-lg transition-colors ${
                                                category.active
                                                    ? 'text-emerald-600 hover:bg-emerald-50'
                                                    : 'text-gray-400 hover:bg-gray-100'
                                            }`}
                                            title={category.active ? 'Ocultar' : 'Activar'}
                                        >
                                            {category.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => onEdit(category)}
                                            className="p-1.5 rounded-lg text-[#505A4A] hover:bg-[#505A4A]/10 transition-colors"
                                            title="Editar"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(category.id)}
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

            {/* Children */}
            {hasChildren && isExpanded && (
                <div className="mt-2 space-y-2">
                    {childCategories.map((child) => (
                        <CategoryTreeItem
                            key={child.id}
                            category={child}
                            children={getChildrenOf(child.id)}
                            level={level + 1}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onToggleActive={onToggleActive}
                            onAddSubcategory={onAddSubcategory}
                            deleteConfirm={deleteConfirm}
                            setDeleteConfirm={setDeleteConfirm}
                            expandedIds={expandedIds}
                            toggleExpand={toggleExpand}
                            allCategories={allCategories}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AdminCategoriesPage() {
    const router = useRouter();
    const { isAdmin, isLoaded, isAuthenticated } = useAuth();
    const {
        categories,
        isLoading,
        createCategory,
        updateCategory,
        deleteCategory,
        refreshCategories,
        getChildren,
        getCategoryPath,
    } = useCategories();

    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
    const [formData, setFormData] = useState<Omit<ICategory, 'id'>>(emptyCategory);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [formImgError, setFormImgError] = useState(false);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isLoaded && (!isAuthenticated || !isAdmin)) {
            router.push('/auth');
        }
    }, [isLoaded, isAuthenticated, isAdmin, router]);

    const rootCategories = useMemo(() => {
        return categories
            .filter(c => !c.parent_id)
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }, [categories]);

    const getChildrenOf = useCallback((parentId: string) => {
        return categories
            .filter(c => c.parent_id === parentId)
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }, [categories]);

    const toggleExpand = useCallback((id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    if (!isLoaded || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#505A4A] border-t-transparent" />
            </div>
        );
    }

    if (!isAdmin) return null;

    const resetForm = () => {
        setFormData(emptyCategory);
        setEditingCategory(null);
        setViewMode('list');
        setDeleteConfirm(null);
        setUploadError(null);
        setFormImgError(false);
    };

    const handleCreate = (parentId?: string) => {
        const siblings = parentId
            ? categories.filter(c => c.parent_id === parentId)
            : rootCategories;
        const maxOrder = Math.max(...siblings.map(c => c.sort_order || 0), 0);

        setFormData({
            ...emptyCategory,
            sort_order: maxOrder + 1,
            parent_id: parentId || '',
        });
        setUploadError(null);
        setFormImgError(false);
        setViewMode('create');

        if (parentId) {
            setExpandedIds(prev => new Set([...prev, parentId]));
        }
    };

    const handleEdit = (category: ICategory) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description,
            image: category.image || '',
            active: category.active,
            sort_order: category.sort_order || 0,
            product_count: category.product_count || 0,
            parent_id: category.parent_id || '',
        });
        setUploadError(null);
        setFormImgError(false);
        setViewMode('edit');
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteCategory(id);
            setDeleteConfirm(null);
        } catch {
            // Error handled by context
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
        } catch {
            // Error handled by context
        } finally {
            setIsSaving(false);
        }
    };

    const toggleActive = async (category: ICategory) => {
        try {
            await updateCategory(category.id, { active: !category.active });
        } catch {
            // Error handled by context
        }
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
            uploadFormData.append('folder', 'categories');
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

    // Get parent category name for breadcrumb
    const getParentName = (parentId: string): string => {
        const parent = categories.find(c => c.id === parentId);
        return parent?.name || '';
    };

    // Build flat list of categories for parent selector (exclude self and descendants)
    const getAvailableParents = (): ICategory[] => {
        if (!editingCategory) return categories;

        const descendantIds = new Set<string>();
        const findDescendants = (id: string) => {
            descendantIds.add(id);
            categories.filter(c => c.parent_id === id).forEach(c => findDescendants(c.id));
        };
        findDescendants(editingCategory.id);

        return categories.filter(c => !descendantIds.has(c.id));
    };

    const stats = {
        total: categories.length,
        root: rootCategories.length,
        active: categories.filter(c => c.active).length,
        hidden: categories.filter(c => !c.active).length,
    };

    // ─── LIST VIEW ───────────────────────────────────────────────
    if (viewMode === 'list') {
        return (
            <div className="min-h-screen bg-gray-50 pt-20">
                <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Categorías</h1>
                            </div>
                            <p className="text-sm text-gray-500 ml-7">
                                {stats.total} categorías · {stats.root} principales
                            </p>
                        </div>
                        <button
                            onClick={() => handleCreate()}
                            className="flex items-center gap-2 bg-[#505A4A] text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-medium hover:bg-[#414A3C] transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Nueva Categoría</span>
                            <span className="sm:hidden">Nueva</span>
                        </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-5">
                        {[
                            { label: 'Total', value: stats.total, icon: Layers },
                            { label: 'Principales', value: stats.root, icon: Layers },
                            { label: 'Activas', value: stats.active, icon: Eye },
                            { label: 'Ocultas', value: stats.hidden, icon: EyeOff },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                                <stat.icon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                                <p className="text-lg sm:text-xl font-bold text-gray-900">{stat.value}</p>
                                <p className="text-[10px] sm:text-xs text-gray-500">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Categories Tree */}
                    <div className="space-y-2 sm:space-y-3">
                        {rootCategories.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No hay categorías creadas</p>
                                <button
                                    onClick={() => handleCreate()}
                                    className="text-sm text-[#505A4A] font-medium mt-2 hover:underline"
                                >
                                    Crear la primera categoría
                                </button>
                            </div>
                        ) : (
                            rootCategories.map((category) => (
                                <CategoryTreeItem
                                    key={category.id}
                                    category={category}
                                    children={getChildrenOf(category.id)}
                                    level={0}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onToggleActive={toggleActive}
                                    onAddSubcategory={(parentId) => handleCreate(parentId)}
                                    deleteConfirm={deleteConfirm}
                                    setDeleteConfirm={setDeleteConfirm}
                                    expandedIds={expandedIds}
                                    toggleExpand={toggleExpand}
                                    allCategories={categories}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ─── CREATE / EDIT FORM ──────────────────────────────────────
    const parentBreadcrumb = formData.parent_id ? getCategoryPath(formData.parent_id) : [];
    const availableParents = getAvailableParents();

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={resetForm}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-3"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver
                    </button>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                        {viewMode === 'create'
                            ? (formData.parent_id ? 'Nueva Subcategoría' : 'Nueva Categoría')
                            : 'Editar Categoría'
                        }
                    </h1>
                    {viewMode === 'create' && formData.parent_id && (
                        <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500">
                            <span>Dentro de:</span>
                            {parentBreadcrumb.map((p, i) => (
                                <span key={p.id} className="flex items-center gap-1">
                                    {i > 0 && <ChevronRight className="w-3 h-3" />}
                                    <span className="font-medium text-[#505A4A]">{p.name}</span>
                                </span>
                            ))}
                        </div>
                    )}
                    {viewMode === 'edit' && editingCategory && (
                        <p className="text-sm text-gray-500 mt-1">Editando: {editingCategory.name}</p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Image */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
                        <label className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                            <ImageIcon className="w-4 h-4 text-gray-500" />
                            Imagen
                        </label>

                        <div className="relative w-full h-40 sm:h-48 bg-gray-100 rounded-xl overflow-hidden mb-3">
                            {formData.image && formData.image !== '' && !formImgError ? (
                                <ProductImage
                                    src={formData.image}
                                    alt="Vista previa"
                                    className="object-cover"
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
                            <Layers className="w-4 h-4 text-gray-500" />
                            Información
                        </h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder={formData.parent_id ? 'Ej: Cremas Hidratantes' : 'Ej: Cuidado Facial'}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#505A4A]/30 focus:border-[#505A4A] focus:bg-white transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Breve descripción..."
                                rows={3}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#505A4A]/30 focus:border-[#505A4A] focus:bg-white transition-all resize-none"
                            />
                        </div>

                        {/* Parent Category Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Categoría padre
                            </label>
                            <select
                                value={formData.parent_id || ''}
                                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#505A4A]/30 focus:border-[#505A4A] focus:bg-white transition-all"
                            >
                                <option value="">— Ninguna (categoría principal) —</option>
                                {availableParents.map((cat) => {
                                    const path = getCategoryPath(cat.id);
                                    const indent = path.length > 1
                                        ? '  '.repeat(path.length - 1) + '↳ '
                                        : '';
                                    return (
                                        <option key={cat.id} value={cat.id}>
                                            {indent}{cat.name}
                                        </option>
                                    );
                                })}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">
                                Déjalo vacío para crear una categoría principal
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Orden</label>
                            <input
                                type="number"
                                value={formData.sort_order}
                                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                                min="0"
                                className="w-24 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#505A4A]/30 focus:border-[#505A4A] focus:bg-white transition-all"
                            />
                            <p className="text-xs text-gray-400 mt-1">Número más bajo aparece primero</p>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                {formData.active ? (
                                    <Eye className="w-4 h-4 text-emerald-600" />
                                ) : (
                                    <EyeOff className="w-4 h-4 text-gray-400" />
                                )}
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {formData.active ? 'Visible en catálogo' : 'Oculta del catálogo'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Los clientes {formData.active ? 'pueden' : 'no pueden'} ver esta categoría
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, active: !formData.active })}
                                className={`relative w-11 h-6 rounded-full transition-colors ${formData.active ? 'bg-[#505A4A]' : 'bg-gray-300'}`}
                            >
                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.active ? 'left-[22px]' : 'left-0.5'}`} />
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
                                    {viewMode === 'create'
                                        ? (formData.parent_id ? 'Crear Subcategoría' : 'Crear Categoría')
                                        : 'Guardar Cambios'
                                    }
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
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
