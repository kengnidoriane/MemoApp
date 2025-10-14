export interface Category {
  id: string;
  name: string;
  color: string;
  userId: string;
  memoCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryRequest {
  name: string;
  color?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  color?: string;
}

export interface CategoryWithMemos extends Category {
  memos: Array<{
    id: string;
    title: string;
    createdAt: Date;
  }>;
}