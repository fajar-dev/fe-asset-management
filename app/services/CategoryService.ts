import { apiClient } from '~/services/apiClient'
import type { Category, CategoryDetailResponse, CategoryResponse, CreateCategoryPayload, UpdateCategoryPayload } from '~/types/category'

export class CategoryService {
  private basePath = '/v1/category'

  private getAuthHeader() {
    const token = localStorage.getItem('accessToken') || ''
    return { Authorization: `Bearer ${token}` }
  }

  // Fetch paginate categories with pagination
  async getCategories(search = '', page = 1, limit = 10): Promise<CategoryResponse> {
    return await apiClient<CategoryResponse>(this.basePath, {
      method: 'GET',
      params: { search, page, limit },
      headers: this.getAuthHeader()
    })
  }

  // Fetch all categories with pagination
  async getAllCategories(all = true): Promise<CategoryResponse> {
    return await apiClient<CategoryResponse>(this.basePath, {
      method: 'GET',
      params: { all },
      headers: this.getAuthHeader()
    })
  }

  // Fetch single category by ID
  async getCategoryById(id: string): Promise<CategoryDetailResponse> {
    return await apiClient<CategoryDetailResponse>(`${this.basePath}/${id}`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  // Create a new category
  async createCategory(payload: CreateCategoryPayload): Promise<Category> {
    return await apiClient<Category>(this.basePath, {
      method: 'POST',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  // Update existing category
  async updateCategory(id: string, payload: UpdateCategoryPayload): Promise<void> {
    await apiClient(`${this.basePath}/${id}`, {
      method: 'PUT',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  // Delete a category
  async deleteCategory(id: string): Promise<void> {
    await apiClient(`${this.basePath}/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeader()
    })
  }
}

export const categoryService = new CategoryService()
