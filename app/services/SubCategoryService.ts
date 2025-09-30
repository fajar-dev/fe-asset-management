import type {
  SubCategory,
  SubCategoryDetailResponse,
  SubCategoryResponse,
  SubCategoryHierarchyResponse,
  SubCategoryPathResponse,
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
  async getSubCategories(search = '', page = 1, limit = 10, categoryUuid?: string): Promise<SubCategoryResponse> {
    const params: Record<string, any> = { search, page, limit }
    if (categoryUuid) {
      params.categoryUuid = categoryUuid
    }

    return await this.api<SubCategoryResponse>(this.basePath, {
      method: 'GET',
      params,
      headers: this.getAuthHeader()
    })
  }

  // Fetch hierarchy tree for a category
  async getHierarchyTree(categoryUuid: string): Promise<SubCategoryHierarchyResponse> {
    return await this.api<SubCategoryHierarchyResponse>(
      `${this.basePath}/category/${categoryUuid}/hierarchy`,
      {
        method: 'GET',
        headers: this.getAuthHeader()
      }
    )
  }

  // Fetch all sub-categories by category (flat list)
  async getSubCategoriesByCategory(categoryUuid: string): Promise<SubCategoryHierarchyResponse> {
    return await this.api<SubCategoryHierarchyResponse>(
      `${this.basePath}/category/${categoryUuid}`,
      {
        method: 'GET',
        headers: this.getAuthHeader()
      }
    )
  }

  // Fetch single sub-category by ID
  async getSubCategoryById(id: string): Promise<SubCategoryDetailResponse> {
    return await this.api<SubCategoryDetailResponse>(`${this.basePath}/${id}`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  // Get path (breadcrumb) from root to node
  async getSubCategoryPath(id: string): Promise<SubCategoryPathResponse> {
    return await this.api<SubCategoryPathResponse>(`${this.basePath}/${id}/path`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  // Create a new sub-category
  async createSubCategory(payload: CreateSubCategoryPayload): Promise<SubCategoryDetailResponse> {
    return await this.api<SubCategoryDetailResponse>(this.basePath, {
      method: 'POST',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  // Update existing sub-category
  async updateSubCategory(id: string, payload: UpdateSubCategoryPayload): Promise<SubCategoryDetailResponse> {
    return await this.api<SubCategoryDetailResponse>(`${this.basePath}/${id}`, {
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
