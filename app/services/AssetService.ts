import type {
  AssetDetailResponse,
  AssetResponse,
  CreateAssetPayload,
  ImportAssetPayload,
  UpdateAssetPayload
} from '~/types/asset'

export class AssetService {
  private basePath = '/v1/asset'

  private get api() {
    const { $api } = useNuxtApp()
    return $api
  }

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
    status: string | null = null,
    employeeId: string | null = null,
    locationId: string | null = null,
    branchId: string | null = null,
    startDate: string | null = null,
    endDate: string | null = null,
    hasHolder: boolean | null = false
  ): Promise<AssetResponse> {
    const params: Record<string, any> = { search, page, limit }

    if (categoryId) params.categoryId = categoryId
    if (subCategoryId) params.subCategoryId = subCategoryId
    if (status) params.status = status
    if (employeeId) params.employeeId = employeeId
    if (locationId) params.locationId = locationId
    if (branchId) params.branchId = branchId
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (hasHolder !== null) params.hasHolder = hasHolder

    return await this.api<AssetResponse>(this.basePath, {
      method: 'GET',
      params,
      headers: this.getAuthHeader()
    })
  }

  async getAllAssets(all = true): Promise<AssetResponse> {
    return await this.api<AssetResponse>(this.basePath, {
      method: 'GET',
      params: { all },
      headers: this.getAuthHeader()
    })
  }

  async getAssetById(id: string): Promise<AssetDetailResponse> {
    return await this.api<AssetDetailResponse>(`${this.basePath}/${id}`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  async getAssetByCode(code: string): Promise<AssetDetailResponse> {
    return await this.api<AssetDetailResponse>(`${this.basePath}/${code}/by-code`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  async createAsset(payload: CreateAssetPayload | FormData): Promise<AssetDetailResponse> {
    return await this.api<AssetDetailResponse>(this.basePath, {
      method: 'POST',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  async importAsset(payload: FormData): Promise<any> {
    return await this.api<any>(`${this.basePath}/import`, {
      method: 'POST',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  async updateAsset(id: string, payload: UpdateAssetPayload | FormData): Promise<AssetDetailResponse> {
    return await this.api<AssetDetailResponse>(`${this.basePath}/${id}`, {
      method: 'PUT',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  async deleteAsset(id: string): Promise<void> {
    await this.api(`${this.basePath}/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeader()
    })
  }

  async exportAssets(
    categoryId: string | null = null,
    subCategoryId: string | null = null,
    status: string | null = null,
    employeeId: string | null = null,
    locationId: string | null = null,
    branchId: string | null = null,
    startDate: string | null = null,
    endDate: string | null = null
  ): Promise<{ blob: Blob, filename: string }> {
    const config = useRuntimeConfig()

    const params: Record<string, string> = {}

    if (categoryId) params.categoryId = categoryId
    if (subCategoryId) params.subCategoryId = subCategoryId
    if (status) params.status = status
    if (employeeId) params.employeeId = employeeId
    if (locationId) params.locationId = locationId
    if (branchId) params.branchId = branchId
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate

    const queryString = new URLSearchParams(params).toString()
    const url = `${config.public.apiUrl}${this.basePath}/export${queryString ? `?${queryString}` : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeader()
    })

    const blob = await response.blob()

    const contentDisposition = response.headers.get('content-disposition')
    let filename = ''

    if (contentDisposition) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition)
      if (matches?.[1]) {
        filename = matches[1].replace(/['"]/g, '')
      }
    }

    if (!filename) {
      const today = new Date()
      const dateStr = today.toISOString().split('T')[0]
      filename = `export-assets-${dateStr}.xlsx`
    }

    return { blob, filename }
  }
}

export const assetService = new AssetService()
