// ~/services/assetLocation.ts
import { apiClient } from '~/services/apiClient'
import type {
  AssetLocation,
  AssetLocationResponse,
  CreateAssetLocationPayload
} from '~/types/assetLocation'

export class AssetLocationService {
  private basePath = '/v1/asset'

  private getAuthHeader() {
    const token = localStorage.getItem('accessToken') || ''
    return { Authorization: `Bearer ${token}` }
  }

  async getLocations(
    assetUuid: string,
    params: {
      all?: boolean
      search?: string
      page?: number
      limit?: number
    } = {}
  ): Promise<AssetLocationResponse> {
    return await apiClient<AssetLocationResponse>(
      `${this.basePath}/${assetUuid}/location`,
      {
        method: 'GET',
        params,
        headers: this.getAuthHeader()
      }
    )
  }

  // Create new location
  async createLocation(
    assetUuid: string,
    payload: CreateAssetLocationPayload
  ): Promise<AssetLocation> {
    return await apiClient<AssetLocation>(
      `${this.basePath}/${assetUuid}/location`,
      {
        method: 'POST',
        body: payload,
        headers: this.getAuthHeader()
      }
    )
  }
}

export const assetLocationService = new AssetLocationService()
