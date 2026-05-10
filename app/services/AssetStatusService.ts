import { BaseService } from '~/services/base'
import type { ApiDetailResponse, ApiListResponse } from '~/types/api'

export interface CreateAssetStatusPayload {
  type: 'active' | 'inactive'
  note?: string
  isTransferred?: boolean
  attachments?: File[]
}

export interface AssetStatusResponse {
  id: string
  type: string
  note?: string
  isTransferred?: boolean
  attachmentPaths?: string[] | null
  attachmentUrls?: string[] | null
  createdAt: string
  user: {
    name: string
    employeeId: string
  }
}

export class AssetStatusService extends BaseService {
  private basePath = '/v1/asset'

  async updateStatus(assetUuid: string, payload: CreateAssetStatusPayload): Promise<ApiDetailResponse<AssetStatusResponse>> {
    const formData = new FormData()
    formData.append('type', payload.type)
    if (payload.note) formData.append('note', payload.note)
    if (payload.isTransferred !== undefined) formData.append('isTransferred', String(payload.isTransferred))
    if (payload.attachments) {
      payload.attachments.forEach(file => formData.append('attachments', file))
    }
    return await this.api<ApiDetailResponse<AssetStatusResponse>>(`${this.basePath}/${assetUuid}/status`, {
      method: 'POST',
      body: formData as any,
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
