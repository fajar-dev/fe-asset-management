import type { Category, CategoryDetailResponse, CategoryResponse, CreateCategoryPayload, UpdateCategoryPayload } from '~/types/category'
import type { SubCategoryResponse } from '~/types/subCategory'

export class CategoryService {
  private basePath = '/v1/category'

  private get api() {
    const { $api } = useNuxtApp()
    return $api
  }

  private getAuthHeader() {
    const token = localStorage.getItem('accessToken') || ''
    return { Authorization: `Bearer ${token}` }
  }

  // Fetch paginate categories with pagination
  async getCategories(search = '', page = 1, limit = 10): Promise<CategoryResponse> {
    return await this.api<CategoryResponse>(this.basePath, {
      method: 'GET',
      params: { search, page, limit },
      headers: this.getAuthHeader()
    })
  }

  // Fetch all categories with pagination
  async getAllCategories(all = true): Promise<CategoryResponse> {
    return await this.api<CategoryResponse>(this.basePath, {
      method: 'GET',
      params: { all },
      headers: this.getAuthHeader()
    })
  }

  async getSubCategoriesByCategory(id: string): Promise<SubCategoryResponse> {
    return await this.api<SubCategoryResponse>(`${this.basePath}/${id}/sub-category`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  // Fetch single category by ID
  async getCategoryById(id: string): Promise<CategoryDetailResponse> {
    return await this.api<CategoryDetailResponse>(`${this.basePath}/${id}`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  // Create a new category
  async createCategory(payload: CreateCategoryPayload): Promise<Category> {
    return await this.api<Category>(this.basePath, {
      method: 'POST',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  // Update existing category
  async updateCategory(id: string, payload: UpdateCategoryPayload): Promise<void> {
    await this.api(`${this.basePath}/${id}`, {
      method: 'PUT',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  // Delete a category
  async deleteCategory(id: string): Promise<void> {
    await this.api(`${this.basePath}/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeader()
    })
  }
}

export const categoryService = new CategoryService()
