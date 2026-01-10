"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ICategory } from '@/entities/all';
import { CategoryService } from '@/lib/firestore-services';

interface CategoryContextType {
    categories: ICategory[];
    activeCategories: ICategory[];
    isLoading: boolean;
    error: string | null;
    refreshCategories: () => Promise<void>;
    createCategory: (category: Omit<ICategory, 'id'>) => Promise<ICategory>;
    updateCategory: (id: string, data: Partial<ICategory>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
    getCategory: (id: string) => ICategory | undefined;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children }: { children: ReactNode }) {
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [activeCategories, setActiveCategories] = useState<ICategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshCategories = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Get all categories ordered by sort_order
            const allData = await CategoryService.getAll('sort_order');
            setCategories(allData);

            // Filter active ones
            const activeData = allData.filter(c => c.active);
            setActiveCategories(activeData);
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError('Error al cargar las categorías');
            // Fallback to empty if error, don't break app
            setCategories([]);
            setActiveCategories([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        refreshCategories();
    }, [refreshCategories]);

    const createCategory = async (category: Omit<ICategory, 'id'>) => {
        try {
            const newCategory = await CategoryService.create(category);
            await refreshCategories(); // Reload to ensure sync
            return newCategory;
        } catch (err) {
            console.error('Error creating category:', err);
            throw err;
        }
    };

    const updateCategory = async (id: string, data: Partial<ICategory>) => {
        try {
            await CategoryService.update(id, data);
            await refreshCategories();
        } catch (err) {
            console.error('Error updating category:', err);
            throw err;
        }
    };

    const deleteCategory = async (id: string) => {
        try {
            await CategoryService.delete(id);
            await refreshCategories();
        } catch (err) {
            console.error('Error deleting category:', err);
            throw err;
        }
    };

    const getCategory = (id: string) => {
        return categories.find(c => c.id === id);
    };

    return (
        <CategoryContext.Provider
            value={{
                categories,
                activeCategories,
                isLoading,
                error,
                refreshCategories,
                createCategory,
                updateCategory,
                deleteCategory,
                getCategory,
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
