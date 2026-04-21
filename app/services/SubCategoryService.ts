import { BaseService } from '~/services/base'
import type {
  SubCategory,
  SubCategoryDetailResponse,
  SubCategoryResponse,
  SubCategoryHierarchyResponse,
  SubCategoryPathResponse,
  CreateSubCategoryPayload,
  UpdateSubCategoryPayload
} from '~/types/subCategory'

export class SubCategoryService extends BaseService {
  private basePath = '/v1/sub-category'

  async getSubCategories(search = '', page = 1, limit = 10, categoryUuid?: string): Promise<SubCategoryResponse> {
    const params: Record<string, any> = { search, page, limit }
    if (categoryUuid) params.categoryUuid = categoryUuid
    return await this.api<SubCategoryResponse>(this.basePath, {
      method: 'GET',
      params,
      headers: this.getAuthHeader()
    })
  }

  async getHierarchyTree(categoryUuid: string): Promise<SubCategoryHierarchyResponse> {
    return await this.api<SubCategoryHierarchyResponse>(`${this.basePath}/category/${categoryUuid}/hierarchy`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  async getSubCategoriesByCategory(categoryUuid: string): Promise<SubCategoryHierarchyResponse> {
    return await this.api<SubCategoryHierarchyResponse>(`${this.basePath}/category/${categoryUuid}`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  async getSubCategoryById(id: string): Promise<SubCategoryDetailResponse> {
    return await this.api<SubCategoryDetailResponse>(`${this.basePath}/${id}`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  async getSubCategoryPath(id: string): Promise<SubCategoryPathResponse> {
    return await this.api<SubCategoryPathResponse>(`${this.basePath}/${id}/path`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  async createSubCategory(payload: CreateSubCategoryPayload): Promise<SubCategoryDetailResponse> {
    return await this.api<SubCategoryDetailResponse>(this.basePath, {
      method: 'POST',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  async updateSubCategory(id: string, payload: UpdateSubCategoryPayload): Promise<SubCategoryDetailResponse> {
    return await this.api<SubCategoryDetailResponse>(`${this.basePath}/${id}`, {
      method: 'PUT',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  async deleteSubCategory(id: string): Promise<void> {
    await this.api(`${this.basePath}/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeader()
    })
  }
}

export const subCategoryService = new SubCategoryService()
