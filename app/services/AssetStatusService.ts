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

export class AssetStatusService {
  private basePath = '/v1/asset'

  private get api() {
    const { $api } = useNuxtApp()
    return $api
  }

  private getAuthHeader() {
    const token = localStorage.getItem('accessToken') || ''
    return { Authorization: `Bearer ${token}` }
  }

  async updateStatus(assetUuid: string, payload: CreateAssetStatusPayload): Promise<{ data: AssetStatusResponse }> {
    return await this.api<{ data: AssetStatusResponse }>(`${this.basePath}/${assetUuid}/status`, {
      method: 'POST',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  async getStatuses(assetUuid: string, page: number = 1, limit: number = 10, search: string = ''): Promise<{ data: AssetStatusResponse[], meta?: any }> {
    return await this.api<{ data: AssetStatusResponse[], meta?: any }>(`${this.basePath}/${assetUuid}/status`, {
      method: 'GET',
      params: { page, limit, search },
      headers: this.getAuthHeader()
    })
  }
}

export const assetStatusService = new AssetStatusService()
