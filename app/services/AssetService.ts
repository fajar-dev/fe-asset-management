import { apiClient } from '~/services/apiClient'
import type {
  Asset,
  AssetDetailResponse,
  AssetResponse,
  CreateAssetPayload,
  UpdateAssetPayload
} from '~/types/asset'

export class AssetService {
  private basePath = '/v1/asset'

  private getAuthHeader() {
    const token = localStorage.getItem('accessToken') || ''
    return { Authorization: `Bearer ${token}` }
  }

  async getAssets(
    search = '',
    page = 1,
    limit = 10,
    categoryId: string | null = null,
    subCategoryId: string | null = null,
    status: string | null = null
  ): Promise<AssetResponse> {
    const params: Record<string, any> = { search, page, limit }
    if (categoryId) params.categoryId = categoryId
    if (subCategoryId) params.subCategoryId = subCategoryId
    if (status) params.status = status

    return await apiClient<AssetResponse>(this.basePath, {
      method: 'GET',
      params,
      headers: this.getAuthHeader()
    })
  }

  async getAllAssets(all = true): Promise<AssetResponse> {
    return await apiClient<AssetResponse>(this.basePath, {
      method: 'GET',
      params: { all },
      headers: this.getAuthHeader()
    })
  }

  async getAssetById(id: string): Promise<AssetDetailResponse> {
    return await apiClient<AssetDetailResponse>(`${this.basePath}/${id}`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  async createAsset(payload: CreateAssetPayload): Promise<Asset> {
    return await apiClient<Asset>(this.basePath, {
      method: 'POST',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  async updateAsset(id: string, payload: UpdateAssetPayload): Promise<void> {
    await apiClient(`${this.basePath}/${id}`, {
      method: 'PUT',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  async deleteAsset(id: string): Promise<void> {
    await apiClient(`${this.basePath}/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeader()
    })
  }
}

export const assetService = new AssetService()
