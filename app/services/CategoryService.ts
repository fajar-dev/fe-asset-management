import { apiClient } from '~/services/apiClient'
import type { CategoryResponse } from '~/types/category'

export class CategoryService {
  private basePath = '/v1/category'

  private getAuthHeader() {
    const token = localStorage.getItem('accessToken') || ''
    return { Authorization: `Bearer ${token}` }
  }

  async getCategories(search = '', page = 1, limit = 10): Promise<CategoryResponse> {
    return await apiClient<CategoryResponse>(this.basePath, {
      method: 'GET',
      params: { search, page, limit },
      headers: this.getAuthHeader()
    })
  }

  async deleteCategory(id: string) {
    return await apiClient(`${this.basePath}/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeader()
    })
  }
}

export const categoryService = new CategoryService()
