import { BaseService } from '~/services/base'
import type {
  AssetLocation,
  AssetLocationResponse,
  CreateAssetLocationPayload
} from '~/types/assetLocation'

export class AssetLocationService extends BaseService {
  private basePath = '/v1/asset'

  async getLocations(
    assetUuid: string,
    params: { all?: boolean, search?: string, page?: number, limit?: number } = {}
  ): Promise<AssetLocationResponse> {
    return await this.api<AssetLocationResponse>(`${this.basePath}/${assetUuid}/location`, {
      method: 'GET',
      params,
      headers: this.getAuthHeader()
    })
  }

  async createLocation(assetUuid: string, payload: CreateAssetLocationPayload): Promise<AssetLocation> {
    return await this.api<AssetLocation>(`${this.basePath}/${assetUuid}/location`, {
      method: 'POST',
      body: payload,
      headers: this.getAuthHeader()
    })
  }
}

export const assetLocationService = new AssetLocationService()
