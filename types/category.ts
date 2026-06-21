export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export type CreateCategoryInput = Pick<Category, 'name'>;
