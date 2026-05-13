import type { Category, MenuItem } from '../domain';

// --- Customer ---

export interface CustomerMenuResponse {
  categories: (Category & { items: MenuItem[] })[];
}

// --- Admin Category ---

export interface CreateCategoryRequest {
  name: string;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  sortOrder?: number;
}

export interface ReorderCategoriesRequest {
  orderedIds: number[];
}

export interface CategoryListResponse {
  categories: Category[];
}

export interface CategoryResponse {
  category: Category;
}

// --- Admin Menu ---

export interface CreateMenuItemRequest {
  categoryId: number;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
}

export interface UpdateMenuItemRequest {
  categoryId?: number;
  name?: string;
  price?: number;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
}

export interface ReorderMenuItemsRequest {
  categoryId: number;
  orderedIds: number[];
}

export interface MenuItemListResponse {
  menuItems: MenuItem[];
}

export interface MenuItemResponse {
  menuItem: MenuItem;
}
