import { BaseService } from '~/services/base'
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

export class StatisticService extends BaseService {
  private basePath = '/v1/statistic'

  async getCount(): Promise<CountResponse> {
    return await this.api<CountResponse>(`${this.basePath}/count`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  async getAssetsByCategory(): Promise<AssetByCategoryResponse> {
    return await this.api<AssetByCategoryResponse>(`${this.basePath}/assets-by-category`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  async getAssetsBySubCategory(): Promise<AssetBySubCategoryResponse> {
    return await this.api<AssetBySubCategoryResponse>(`${this.basePath}/assets-by-sub-category`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  async getAssetsByLocation(): Promise<AssetByLocationResponse> {
    return await this.api<AssetByLocationResponse>(`${this.basePath}/assets-by-location`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  async getPriceByCategory(): Promise<CategoryPriceResponse> {
    return await this.api<CategoryPriceResponse>(`${this.basePath}/price-by-category`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  async getPriceByLocation(): Promise<LocationPriceResponse> {
    return await this.api<LocationPriceResponse>(`${this.basePath}/price-by-location`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  async getAssetAging(): Promise<AssetAgingResponse> {
    return await this.api<AssetAgingResponse>(`${this.basePath}/asset-aging`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  async getDataQuality(): Promise<DataQualityResponse> {
    return await this.api<DataQualityResponse>(`${this.basePath}/data-quality`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }
}

export const statisticService = new StatisticService()
