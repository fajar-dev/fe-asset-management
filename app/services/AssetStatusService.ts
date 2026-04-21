import { BaseService } from '~/services/base'
import type { ApiDetailResponse, ApiListResponse } from '~/types/api'

export interface CreateAssetStatusPayload {
  type: 'active' | 'sold' | 'granted' | 'disposed'
  note?: string
}

export interface AssetStatusResponse {
  id: string
  type: string
  note?: string
  createdAt: string
  user: {
    name: string
    employeeId: string
  }
}

export class AssetStatusService extends BaseService {
  private basePath = '/v1/asset'

  async updateStatus(assetUuid: string, payload: CreateAssetStatusPayload): Promise<ApiDetailResponse<AssetStatusResponse>> {
    return await this.api<ApiDetailResponse<AssetStatusResponse>>(`${this.basePath}/${assetUuid}/status`, {
      method: 'POST',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  async getStatuses(assetUuid: string, options: { page?: number, limit?: number, search?: string } = {}): Promise<ApiListResponse<AssetStatusResponse>> {
    const { page = 1, limit = 10, search = '' } = options
    return await this.api<ApiListResponse<AssetStatusResponse>>(`${this.basePath}/${assetUuid}/status`, {
      method: 'GET',
      params: { page, limit, search },
      headers: this.getAuthHeader()
    })
  }
}

export const assetStatusService = new AssetStatusService()
