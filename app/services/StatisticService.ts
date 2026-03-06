import type {
  CountResponse,
  AssetByCategoryResponse,
  AssetByLocationResponse,
  AssetBySubCategoryResponse,
  CategoryPriceResponse,
  LocationPriceResponse,
  AssetAgingResponse,
  DataQualityResponse
} from '~/types/statistic'

export class StatisticService {
  private basePath = '/v1/statistic'

  private get api() {
    const { $api } = useNuxtApp()
    return $api
  }

  private getAuthHeader() {
    const token = localStorage.getItem('accessToken') || ''
    return { Authorization: `Bearer ${token}` }
  }

  // Get total counts
  async getCount(): Promise<CountResponse> {
    return await this.api<CountResponse>(`${this.basePath}/count`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  // Get assets grouped by category
  async getAssetsByCategory(): Promise<AssetByCategoryResponse> {
    return await this.api<AssetByCategoryResponse>(`${this.basePath}/assets-by-category`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  // Get assets grouped by sub-category
  async getAssetsBySubCategory(): Promise<AssetBySubCategoryResponse> {
    return await this.api<AssetBySubCategoryResponse>(`${this.basePath}/assets-by-sub-category`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  // Get assets grouped by location
  async getAssetsByLocation(): Promise<AssetByLocationResponse> {
    return await this.api<AssetByLocationResponse>(`${this.basePath}/assets-by-location`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  // Get price by category
  async getPriceByCategory(): Promise<CategoryPriceResponse> {
    return await this.api<CategoryPriceResponse>(`${this.basePath}/price-by-category`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  // Get price by location
  async getPriceByLocation(): Promise<LocationPriceResponse> {
    return await this.api<LocationPriceResponse>(`${this.basePath}/price-by-location`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  // Get asset aging
  async getAssetAging(): Promise<AssetAgingResponse> {
    return await this.api<AssetAgingResponse>(`${this.basePath}/asset-aging`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  // Get data quality
  async getDataQuality(): Promise<DataQualityResponse> {
    return await this.api<DataQualityResponse>(`${this.basePath}/data-quality`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }
}

export const statisticService = new StatisticService()
