"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { ICategory } from '@/entities/all';
import { CategoryService } from '@/lib/firestore-services';
import { db } from '@/lib/firebase';

const isFirebaseReady = () => {
    return typeof window !== 'undefined' && db !== null;
};

interface CategoryContextType {
    categories: ICategory[];
    activeCategories: ICategory[];
    rootCategories: ICategory[];
    activeRootCategories: ICategory[];
    isLoading: boolean;
    error: string | null;
    refreshCategories: () => Promise<void>;
    createCategory: (category: Omit<ICategory, 'id'>) => Promise<ICategory>;
    updateCategory: (id: string, data: Partial<ICategory>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
    getCategory: (id: string) => ICategory | undefined;
    getChildren: (parentId: string) => ICategory[];
    getActiveChildren: (parentId: string) => ICategory[];
    getCategoryPath: (id: string) => ICategory[];
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children }: { children: ReactNode }) {
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshCategories = useCallback(async () => {
        if (!isFirebaseReady()) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const allData = await CategoryService.getAll('sort_order');
            setCategories(allData);
        } catch {
            setError('Error al cargar las categorías');
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshCategories();
    }, [refreshCategories]);

    const activeCategories = useMemo(() => {
        return categories.filter(c => c.active);
    }, [categories]);

    const rootCategories = useMemo(() => {
        return categories.filter(c => !c.parent_id);
    }, [categories]);

    const activeRootCategories = useMemo(() => {
        return categories.filter(c => c.active && !c.parent_id);
    }, [categories]);

    const getChildren = useCallback((parentId: string): ICategory[] => {
        return categories
            .filter(c => c.parent_id === parentId)
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }, [categories]);

    const getActiveChildren = useCallback((parentId: string): ICategory[] => {
        return categories
            .filter(c => c.parent_id === parentId && c.active)
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }, [categories]);

    const getCategory = useCallback((id: string) => {
        return categories.find(c => c.id === id);
    }, [categories]);

    const getCategoryPath = useCallback((id: string): ICategory[] => {
        const path: ICategory[] = [];
        let current = categories.find(c => c.id === id);
        while (current) {
            path.unshift(current);
            current = current.parent_id
                ? categories.find(c => c.id === current!.parent_id)
                : undefined;
        }
        return path;
    }, [categories]);

    const createCategory = useCallback(async (category: Omit<ICategory, 'id'>) => {
        const newCategory = await CategoryService.create(category);
        await refreshCategories();
        return newCategory;
    }, [refreshCategories]);

    const updateCategory = useCallback(async (id: string, data: Partial<ICategory>) => {
        await CategoryService.update(id, data);
        await refreshCategories();
    }, [refreshCategories]);

    const deleteCategory = useCallback(async (id: string) => {
        // Also delete all children recursively
        const childrenToDelete = categories.filter(c => c.parent_id === id);
        for (const child of childrenToDelete) {
            await deleteCategory(child.id);
        }
        await CategoryService.delete(id);
        await refreshCategories();
    }, [categories, refreshCategories]);

    return (
        <CategoryContext.Provider
            value={{
                categories,
                activeCategories,
                rootCategories,
                activeRootCategories,
                isLoading,
                error,
                refreshCategories,
                createCategory,
                updateCategory,
                deleteCategory,
                getCategory,
                getChildren,
                getActiveChildren,
                getCategoryPath,
            }}
        >
            {children}
        </CategoryContext.Provider>
    );
}

export function useCategories() {
    const context = useContext(CategoryContext);
    if (context === undefined) {
        throw new Error('useCategories must be used within a CategoryProvider');
    }
    return context;
}
