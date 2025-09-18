import { apiClient } from '~/services/apiClient'
import type {
  CountResponse,
  AssetByCategoryResponse,
  AssetBySubCategoryResponse,
  AssetByLocationResponse
} from '~/types/statistic'

export class StatisticService {
  private basePath = '/v1/statistic'

  private getAuthHeader() {
    const token = localStorage.getItem('accessToken') || ''
    return { Authorization: `Bearer ${token}` }
  }

  // Get total counts
  async getCount(): Promise<CountResponse> {
    return await apiClient<CountResponse>(`${this.basePath}/count`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  // Get assets grouped by category
  async getAssetsByCategory(): Promise<AssetByCategoryResponse> {
    return await apiClient<AssetByCategoryResponse>(`${this.basePath}/assets-by-category`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  // Get assets grouped by sub-category
  async getAssetsBySubCategory(): Promise<AssetBySubCategoryResponse> {
    return await apiClient<AssetBySubCategoryResponse>(`${this.basePath}/assets-by-sub-category`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  // Get assets grouped by location
  async getAssetsByLocation(): Promise<AssetByLocationResponse> {
    return await apiClient<AssetByLocationResponse>(`${this.basePath}/assets-by-location`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }
}

export const statisticService = new StatisticService()
