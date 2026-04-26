'use client';

import { useEffect } from 'react';
import { LOADING_KEYS, useLoadingActions } from './LoadingContext';
import { useProducts } from './ProductContext';
import { useCategories } from './CategoryContext';
import { useAuth } from './AuthContext';

export default function LoadingBridge() {
    const { startLoading, stopLoading } = useLoadingActions();
    const { isLoading: productsLoading } = useProducts();
    const { isLoading: categoriesLoading } = useCategories();
    const { isLoaded: authLoaded } = useAuth();

    useEffect(() => {
        if (productsLoading) startLoading(LOADING_KEYS.PRODUCTS);
        else stopLoading(LOADING_KEYS.PRODUCTS);
    }, [productsLoading, startLoading, stopLoading]);

    useEffect(() => {
        if (categoriesLoading) startLoading(LOADING_KEYS.CATEGORIES);
        else stopLoading(LOADING_KEYS.CATEGORIES);
    }, [categoriesLoading, startLoading, stopLoading]);

    useEffect(() => {
        if (!authLoaded) startLoading(LOADING_KEYS.AUTH);
        else stopLoading(LOADING_KEYS.AUTH);
    }, [authLoaded, startLoading, stopLoading]);

    return null;
}
