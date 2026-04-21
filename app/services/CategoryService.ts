import { BaseService } from '~/services/base'
import type { Category, CategoryDetailResponse, CategoryFilterOptions, CategoryResponse, CreateCategoryPayload, UpdateCategoryPayload } from '~/types/category'
import type { SubCategoryResponse } from '~/types/subCategory'

export class CategoryService extends BaseService {
  private basePath = '/v1/category'

  async getCategories(options: CategoryFilterOptions = {}): Promise<CategoryResponse> {
    const { search = '', page = 1, limit = 10 } = options
    return await this.api<CategoryResponse>(this.basePath, {
      method: 'GET',
      params: { search, page, limit },
      headers: this.getAuthHeader()
    })
  }

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

  async getCategoryById(id: string): Promise<CategoryDetailResponse> {
    return await this.api<CategoryDetailResponse>(`${this.basePath}/${id}`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  async createCategory(payload: CreateCategoryPayload): Promise<Category> {
    return await this.api<Category>(this.basePath, {
      method: 'POST',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  async updateCategory(id: string, payload: UpdateCategoryPayload): Promise<void> {
    await this.api(`${this.basePath}/${id}`, {
      method: 'PUT',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  async deleteCategory(id: string): Promise<void> {
    await this.api(`${this.basePath}/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeader()
    })
  }
}

export const categoryService = new CategoryService()
