"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ConfigService, CatalogConfig } from '@/lib/firestore-services';
import { db } from '@/lib/firebase';

interface CatalogConfigContextType {
  groupByCategory: boolean;
  setGroupByCategory: (value: boolean) => Promise<void>;
  isLoading: boolean;
}

const CatalogConfigContext = createContext<CatalogConfigContextType | undefined>(undefined);

const isFirebaseReady = () => typeof window !== 'undefined' && db !== null;

export function CatalogConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<CatalogConfig>({ group_by_category: false });
  const [isLoading, setIsLoading] = useState(true);

  const loadConfig = useCallback(async () => {
    if (!isFirebaseReady()) {
      setIsLoading(false);
      return;
    }
    try {
      const catalogConfig = await ConfigService.getCatalogConfig();
      setConfig(catalogConfig);
    } catch {
      // Use defaults on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const setGroupByCategory = async (value: boolean) => {
    const newConfig = { ...config, group_by_category: value };
    setConfig(newConfig);
    try {
      await ConfigService.setCatalogConfig({ group_by_category: value });
    } catch {
      // Revert on error
      setConfig(config);
    }
  };

  return (
    <CatalogConfigContext.Provider
      value={{
        groupByCategory: config.group_by_category,
        setGroupByCategory,
        isLoading,
      }}
    >
      {children}
    </CatalogConfigContext.Provider>
  );
}

export function useCatalogConfig() {
  const context = useContext(CatalogConfigContext);
  if (context === undefined) {
    throw new Error('useCatalogConfig must be used within a CatalogConfigProvider');
  }
  return context;
}
