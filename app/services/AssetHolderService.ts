// ~/services/assetHolder.ts
import { apiClient } from '~/services/apiClient'
import type {
  AssetHolder,
  AssetHolderResponse,
  AssetHolderDetailResponse,
  AssignAssetHolderPayload,
  ReturnAssetHolderPayload
} from '~/types/assetHolder'

export class AssetHolderService {
  private basePath = '/v1/asset'

  private getAuthHeader() {
    const token = localStorage.getItem('accessToken') || ''
    return { Authorization: `Bearer ${token}` }
  }

  /**
   * Get holders
   * - Support pagination (page, limit)
   * - Support search
   * - If all = true, ignore pagination
   */
  async getHolders(
    assetUuid: string,
    params: {
      all?: boolean
      search?: string
      page?: number
      limit?: number
    } = {}
  ): Promise<AssetHolderResponse> {
    return await apiClient<AssetHolderResponse>(
      `${this.basePath}/${assetUuid}/holder`,
      {
        method: 'GET',
        params,
        headers: this.getAuthHeader()
      }
    )
  }

  // Get single holder by ID
  async getHolderById(
    assetUuid: string,
    holderId: string
  ): Promise<AssetHolderDetailResponse> {
    return await apiClient<AssetHolderDetailResponse>(
      `${this.basePath}/${assetUuid}/holder/${holderId}`,
      {
        method: 'GET',
        headers: this.getAuthHeader()
      }
    )
  }

  // Assign new holder
  async assignHolder(
    assetUuid: string,
    payload: AssignAssetHolderPayload
  ): Promise<AssetHolder> {
    return await apiClient<AssetHolder>(
      `${this.basePath}/${assetUuid}/holder`,
      {
        method: 'POST',
        body: payload,
        headers: this.getAuthHeader()
      }
    )
  }

  // Return holder
  async returnHolder(
    assetUuid: string,
    holderId: string,
    payload: ReturnAssetHolderPayload
  ): Promise<void> {
    await apiClient(
      `${this.basePath}/${assetUuid}/holder/${holderId}`,
      {
        method: 'POST',
        body: payload,
        headers: this.getAuthHeader()
      }
    )
  }
}

export const assetHolderService = new AssetHolderService()
