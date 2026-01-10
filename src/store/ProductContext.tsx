"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { IProduct } from '@/entities/all';
import { ProductService } from '@/lib/firestore-services';
import { db } from '@/lib/firebase';
import ProductsData from '@/entities/Product.json';

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
    seedProducts: () => Promise<void>;
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

    // Load products from Firestore or fallback to local JSON
    const loadProducts = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            if (isFirebaseReady()) {
                // Load from Firestore
                const products = await ProductService.getAll();
                dispatch({ type: 'SET_PRODUCTS', payload: products });
            } else {
                // Fallback to local JSON
                console.warn('Firebase not configured. Using local JSON data.');
                dispatch({ type: 'SET_PRODUCTS', payload: ProductsData as IProduct[] });
            }
            dispatch({ type: 'SET_INITIALIZED' });
        } catch (error) {
            console.error('Error loading products:', error);
            dispatch({ type: 'SET_ERROR', payload: 'Error al cargar productos' });
            // Fallback to local data on error
            dispatch({ type: 'SET_PRODUCTS', payload: ProductsData as IProduct[] });
        }
    }, []);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    // Refresh products from Firestore
    const refreshProducts = async () => {
        await loadProducts();
    };

    // Seed products to Firestore
    const seedProducts = async () => {
        if (!isFirebaseReady()) {
            console.error('Firebase not configured');
            return;
        }

        try {
            await ProductService.seedFromJSON(ProductsData as IProduct[]);
            await loadProducts();
        } catch (error) {
            console.error('Error seeding products:', error);
        }
    };

    // Get all products
    const getProducts = (): IProduct[] => {
        return state.products;
    };

    // Get product by ID
    const getProductById = (id: string): IProduct | undefined => {
        return state.products.find((p) => p.id === id);
    };

    // Get products by category
    const getProductsByCategory = (categoryId: string): IProduct[] => {
        return state.products.filter((p) => p.category_id === categoryId && p.active);
    };

    // Get featured products
    const getFeaturedProducts = (): IProduct[] => {
        return state.products.filter((p) => p.featured && p.active);
    };

    // Add product
    const addProduct = async (
        productData: Omit<IProduct, 'id' | 'created_date'>
    ): Promise<IProduct> => {
        if (isFirebaseReady()) {
            const newProduct = await ProductService.create({
                ...productData,
                created_date: new Date().toISOString(),
            });
            dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
            return newProduct;
        } else {
            // Fallback for local mode
            const maxId = state.products.reduce((max, p) => {
                const numId = parseInt(p.id, 10);
                return isNaN(numId) ? max : Math.max(max, numId);
            }, 0);

            const newProduct: IProduct = {
                ...productData,
                id: String(maxId + 1),
                created_date: new Date().toISOString(),
            };
            dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
            return newProduct;
        }
    };

    // Update product
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

        if (isFirebaseReady()) {
            await ProductService.update(id, data);
        }

        dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
        return updatedProduct;
    };

    // Delete product
    const deleteProduct = async (id: string): Promise<boolean> => {
        const exists = state.products.some((p) => p.id === id);
        if (!exists) return false;

        if (isFirebaseReady()) {
            await ProductService.delete(id);
        }

        dispatch({ type: 'DELETE_PRODUCT', payload: id });
        return true;
    };

    // Toggle product active status
    const toggleProductActive = async (id: string): Promise<boolean> => {
        const product = state.products.find((p) => p.id === id);
        if (!product) return false;

        const updatedProduct = { ...product, active: !product.active };

        if (isFirebaseReady()) {
            await ProductService.update(id, { active: !product.active });
        }

        dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
        return true;
    };

    // Toggle product featured status
    const toggleProductFeatured = async (id: string): Promise<boolean> => {
        const product = state.products.find((p) => p.id === id);
        if (!product) return false;

        const updatedProduct = { ...product, featured: !product.featured };

        if (isFirebaseReady()) {
            await ProductService.update(id, { featured: !product.featured });
        }

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
        seedProducts,
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
