import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import * as categoriesStorage from '@/lib/storage/categories-storage';
import type { Category } from '@/types/category';

interface CategoriesContextValue {
  categories: Category[];
  loading: boolean;
  refreshCategories: () => Promise<void>;
  createCategory: (name: string) => Promise<Category | null>;
  deleteCategory: (id: string) => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshCategories = useCallback(async () => {
    const loaded = await categoriesStorage.getAllCategories();
    setCategories(loaded);
  }, []);

  useEffect(() => {
    refreshCategories().finally(() => setLoading(false));
  }, [refreshCategories]);

  const createCategory = useCallback(async (name: string) => {
    const category = await categoriesStorage.createCategory({ name });
    if (category) {
      setCategories((current) =>
        [...current, category].sort((a, b) => a.name.localeCompare(b.name))
      );
    }
    return category;
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    await categoriesStorage.deleteCategory(id);
    setCategories((current) => current.filter((c) => c.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      categories,
      loading,
      refreshCategories,
      createCategory,
      deleteCategory,
    }),
    [categories, loading, refreshCategories, createCategory, deleteCategory]
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategories must be used within CategoriesProvider');
  }
  return context;
}
