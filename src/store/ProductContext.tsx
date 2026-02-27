"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { IProduct } from '@/entities/all';
import { ProductService } from '@/lib/firestore-services';
import { db } from '@/lib/firebase';

// Types
interface ProductState {
    products: IProduct[];
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;
}

type ProductAction =
    | { type: 'SET_PRODUCTS'; payload: IProduct[] }
    | { type: 'ADD_PRODUCT'; payload: IProduct }
    | { type: 'UPDATE_PRODUCT'; payload: IProduct }
    | { type: 'DELETE_PRODUCT'; payload: string }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_INITIALIZED' };

interface ProductContextType {
    products: IProduct[];
    isLoading: boolean;
    error: string | null;
    getProducts: () => IProduct[];
    getProductById: (id: string) => IProduct | undefined;
    getProductsByCategory: (categoryId: string) => IProduct[];
    getFeaturedProducts: () => IProduct[];
    addProduct: (product: Omit<IProduct, 'id' | 'created_date'>) => Promise<IProduct>;
    updateProduct: (id: string, data: Partial<IProduct>) => Promise<IProduct | null>;
    deleteProduct: (id: string) => Promise<boolean>;
    toggleProductActive: (id: string) => Promise<boolean>;
    toggleProductFeatured: (id: string) => Promise<boolean>;
    refreshProducts: () => Promise<void>;
}

// Initial state
const initialState: ProductState = {
    products: [],
    isLoading: true,
    error: null,
    isInitialized: false,
};

// Reducer
function productReducer(state: ProductState, action: ProductAction): ProductState {
    switch (action.type) {
        case 'SET_PRODUCTS':
            return { ...state, products: action.payload, isLoading: false };
        case 'ADD_PRODUCT':
            return { ...state, products: [...state.products, action.payload] };
        case 'UPDATE_PRODUCT':
            return {
                ...state,
                products: state.products.map((p) =>
                    p.id === action.payload.id ? action.payload : p
                ),
            };
        case 'DELETE_PRODUCT':
            return {
                ...state,
                products: state.products.filter((p) => p.id !== action.payload),
            };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, isLoading: false };
        case 'SET_INITIALIZED':
            return { ...state, isInitialized: true };
        default:
            return state;
    }
}

// Context
const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Check if Firebase is configured and available
const isFirebaseReady = () => {
    return typeof window !== 'undefined' && db !== null;
};

// Provider
export function ProductProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(productReducer, initialState);

    // Load products from Firestore
    const loadProducts = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            if (isFirebaseReady()) {
                const products = await ProductService.getAll();
                dispatch({ type: 'SET_PRODUCTS', payload: products });
            } else {
                dispatch({ type: 'SET_PRODUCTS', payload: [] });
            }
            dispatch({ type: 'SET_INITIALIZED' });
        } catch {
            dispatch({ type: 'SET_ERROR', payload: 'Error al cargar productos' });
            dispatch({ type: 'SET_PRODUCTS', payload: [] });
        }
    }, []);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    const refreshProducts = async () => {
        await loadProducts();
    };

    const getProducts = (): IProduct[] => {
        return state.products;
    };

    const getProductById = (id: string): IProduct | undefined => {
        return state.products.find((p) => p.id === id);
    };

    const getProductsByCategory = (categoryId: string): IProduct[] => {
        return state.products.filter((p) => p.category_id === categoryId && p.active);
    };

    const getFeaturedProducts = (): IProduct[] => {
        return state.products.filter((p) => p.featured && p.active);
    };

    const addProduct = async (
        productData: Omit<IProduct, 'id' | 'created_date'>
    ): Promise<IProduct> => {
        const newProduct = await ProductService.create({
            ...productData,
            created_date: new Date().toISOString(),
        });
        dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
        return newProduct;
    };

    const updateProduct = async (
        id: string,
        data: Partial<IProduct>
    ): Promise<IProduct | null> => {
        const existingProduct = state.products.find((p) => p.id === id);
        if (!existingProduct) return null;

        const updatedProduct: IProduct = {
            ...existingProduct,
            ...data,
            id,
        };

        await ProductService.update(id, data);
        dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
        return updatedProduct;
    };

    const deleteProduct = async (id: string): Promise<boolean> => {
        const exists = state.products.some((p) => p.id === id);
        if (!exists) return false;

        await ProductService.delete(id);
        dispatch({ type: 'DELETE_PRODUCT', payload: id });
        return true;
    };

    const toggleProductActive = async (id: string): Promise<boolean> => {
        const product = state.products.find((p) => p.id === id);
        if (!product) return false;

        const updatedProduct = { ...product, active: !product.active };
        await ProductService.update(id, { active: !product.active });
        dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
        return true;
    };

    const toggleProductFeatured = async (id: string): Promise<boolean> => {
        const product = state.products.find((p) => p.id === id);
        if (!product) return false;

        const updatedProduct = { ...product, featured: !product.featured };
        await ProductService.update(id, { featured: !product.featured });
        dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
        return true;
    };

    const value: ProductContextType = {
        products: state.products,
        isLoading: state.isLoading,
        error: state.error,
        getProducts,
        getProductById,
        getProductsByCategory,
        getFeaturedProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductActive,
        toggleProductFeatured,
        refreshProducts,
    };

    return (
        <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
    );
}

// Hook
export function useProducts() {
    const context = useContext(ProductContext);
    if (context === undefined) {
        throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
}
