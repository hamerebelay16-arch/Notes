import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Category, CreateCategoryInput } from '@/types/category';

const STORAGE_KEY = '@mynotes/categories';

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

async function readCategories(): Promise<Category[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as Category[];
}

async function writeCategories(categories: Category[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
}

export async function getAllCategories(): Promise<Category[]> {
  const categories = await readCategories();
  return categories.sort((a, b) => a.name.localeCompare(b.name));
}

export async function createCategory(input: CreateCategoryInput): Promise<Category | null> {
  const name = input.name.trim();
  if (!name) return null;

  const categories = await readCategories();
  const exists = categories.some((c) => c.name.toLowerCase() === name.toLowerCase());
  if (exists) return null;

  const category: Category = {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
  };

  categories.push(category);
  await writeCategories(categories);
  return category;
}

export async function deleteCategory(id: string): Promise<void> {
  const categories = await readCategories();
  await writeCategories(categories.filter((c) => c.id !== id));
}

export async function renameCategory(id: string, name: string): Promise<Category | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const categories = await readCategories();
  const index = categories.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const duplicate = categories.some(
    (c) => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) return null;

  categories[index] = { ...categories[index], name: trimmed };
  await writeCategories(categories);
  return categories[index];
}
