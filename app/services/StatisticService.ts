import type {
  CountResponse,
  AssetByCategoryResponse,
  AssetBySubCategoryResponse
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
}

export const statisticService = new StatisticService()
