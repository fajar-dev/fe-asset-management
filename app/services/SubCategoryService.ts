import type {
  SubCategory,
  SubCategoryDetailResponse,
  SubCategoryResponse,
  CreateSubCategoryPayload,
  UpdateSubCategoryPayload
} from '~/types/subCategory'

export class SubCategoryService {
  private basePath = '/v1/sub-category'

  private get api() {
    const { $api } = useNuxtApp()
    return $api
  }

  private getAuthHeader() {
    const token = localStorage.getItem('accessToken') || ''
    return { Authorization: `Bearer ${token}` }
  }

  // Fetch all sub-categories with pagination
  async getSubCategories(search = '', page = 1, limit = 10): Promise<SubCategoryResponse> {
    return await this.api<SubCategoryResponse>(this.basePath, {
      method: 'GET',
      params: { search, page, limit },
      headers: this.getAuthHeader()
    })
  }

  // Fetch single sub-category by ID
  async getSubCategoryById(id: string): Promise<SubCategoryDetailResponse> {
    return await this.api<SubCategoryDetailResponse>(`${this.basePath}/${id}`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  // Create a new sub-category
  async createSubCategory(payload: CreateSubCategoryPayload): Promise<SubCategory> {
    return await this.api<SubCategory>(this.basePath, {
      method: 'POST',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  // Update existing sub-category
  async updateSubCategory(id: string, payload: UpdateSubCategoryPayload): Promise<void> {
    await this.api(`${this.basePath}/${id}`, {
      method: 'PUT',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  // Delete a sub-category
  async deleteSubCategory(id: string): Promise<void> {
    await this.api(`${this.basePath}/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeader()
    })
  }
}

export const subCategoryService = new SubCategoryService()
