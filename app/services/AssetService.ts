import { BaseService } from '~/services/base'
import type {
  AssetDetailResponse,
  AssetResponse,
  AssetFilterOptions,
  AssetExportOptions,
  CreateAssetPayload,
  UpdateAssetPayload
} from '~/types/asset'

export class AssetService extends BaseService {
  private basePath = '/v1/asset'

  async getAssets(options: AssetFilterOptions = {}): Promise<AssetResponse> {
    const {
      search = '',
      page = 1,
      limit = 10,
      user,
      categoryId,
      subCategoryId,
      status,
      employeeId,
      locationId,
      branchId,
      startDate,
      endDate,
      hasHolder,
      isLendable,
      labels,
      sort,
      order
    } = options

    const params: Record<string, any> = { search, page, limit }
    if (user) params.user = user
    if (categoryId) params.categoryId = categoryId
    if (subCategoryId) params.subCategoryId = subCategoryId
    if (status) params.status = status
    if (employeeId) params.employeeId = employeeId
    if (locationId) params.locationId = locationId
    if (branchId) params.branchId = branchId
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (hasHolder !== null && hasHolder !== undefined) params.hasHolder = hasHolder
    if (isLendable !== null && isLendable !== undefined) params.isLendable = isLendable
    if (labels) params.labels = labels
    if (sort) params.sort = sort
    if (order) params.order = order

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

  async getAssetLogs(id: string): Promise<any> {
    return await this.api<any>(`${this.basePath}/${id}/log`, {
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

  async getAssetByImage(image: File): Promise<AssetDetailResponse> {
    const formData = new FormData()
    formData.append('image', image)
    return await this.api<AssetDetailResponse>(`${this.basePath}/scan-image`, {
      method: 'POST',
      body: formData,
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

  async exportAssets(options: AssetExportOptions = {}): Promise<{ blob: Blob, filename: string }> {
    const config = useRuntimeConfig()
    const params: Record<string, any> = {}

    if (options.user) params.user = options.user
    if (options.categoryId) params.categoryId = options.categoryId
    if (options.subCategoryId) params.subCategoryId = options.subCategoryId
    if (options.status) params.status = options.status
    if (options.employeeId) params.employeeId = options.employeeId
    if (options.locationId) params.locationId = options.locationId
    if (options.branchId) params.branchId = options.branchId
    if (options.startDate) params.startDate = options.startDate
    if (options.endDate) params.endDate = options.endDate
    if (options.isLendable !== null && options.isLendable !== undefined) params.isLendable = options.isLendable
    if (options.labels) params.labels = options.labels

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

  async getLabels(search?: string): Promise<{ data: Array<{ key: string, value: string }> }> {
    return await this.api<{ data: Array<{ key: string, value: string }> }>('/v1/label', {
      method: 'GET',
      params: { search },
      headers: this.getAuthHeader()
    })
  }
}

export const assetService = new AssetService()
