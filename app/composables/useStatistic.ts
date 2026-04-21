import { ref } from 'vue'
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
import { extractErrorMessage } from '~/utils/errorHandler'
import { statisticService } from '~/services/StatisticService'

export function useStatistic() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  const count = ref<CountResponse['data'] | null>(null)
  const assetsByCategory = ref<AssetByCategoryResponse['data']>([])
  const assetsBySubCategory = ref<AssetBySubCategoryResponse['data']>([])
  const assetsByLocation = ref<AssetByLocationResponse['data']>([])
  const priceByCategory = ref<CategoryPriceResponse['data']>([])
  const priceByLocation = ref<LocationPriceResponse['data']>([])
  const assetAging = ref<AssetAgingResponse['data']>([])
  const dataQuality = ref<DataQualityResponse['data']>([])

  async function getCount(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await statisticService.getCount()
      count.value = res.data
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Failed to fetch count data')
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function getAssetsByCategory(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await statisticService.getAssetsByCategory()
      assetsByCategory.value = res.data
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Failed to fetch assets by category')
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function getAssetsBySubCategory(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await statisticService.getAssetsBySubCategory()
      assetsBySubCategory.value = res.data
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Failed to fetch assets by sub-category')
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function getAssetsByLocation(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await statisticService.getAssetsByLocation()
      assetsByLocation.value = res.data
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Failed to fetch assets by location')
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function getPriceByCategory(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await statisticService.getPriceByCategory()
      priceByCategory.value = res.data
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Failed to fetch price by category')
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function getPriceByLocation(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await statisticService.getPriceByLocation()
      priceByLocation.value = res.data
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Failed to fetch price by location')
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function getAssetAging(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await statisticService.getAssetAging()
      assetAging.value = res.data
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Failed to fetch asset aging')
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function getDataQuality(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await statisticService.getDataQuality()
      dataQuality.value = res.data
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Failed to fetch data quality')
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    count,
    assetsByCategory,
    assetsBySubCategory,
    assetsByLocation,
    priceByCategory,
    priceByLocation,
    assetAging,
    dataQuality,
    getCount,
    getAssetsByCategory,
    getAssetsBySubCategory,
    getAssetsByLocation,
    getPriceByCategory,
    getPriceByLocation,
    getAssetAging,
    getDataQuality
  }
}
