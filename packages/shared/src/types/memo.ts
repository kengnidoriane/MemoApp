export interface Memo {
  id: string;
  title: string;
  content: string;
  tags: string[];
  categoryId?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  lastReviewedAt?: Date;
  reviewCount: number;
  difficultyLevel: number; // 1-5 for spaced repetition
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt?: Date;
}

export interface CreateMemoRequest {
  title: string;
  content: string;
  tags?: string[];
  categoryId?: string;
}

export interface UpdateMemoRequest {
  title?: string;
  content?: string;
  tags?: string[];
  categoryId?: string;
}

export interface MemoFilters {
  categoryId?: string;
  tags?: string[];
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'nextReviewAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedMemos {
  memos: Memo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MemoSearchResult {
  memo: Memo;
  relevanceScore: number;
  matchedFields: string[];
}