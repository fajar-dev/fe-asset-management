import { ref } from 'vue'
import type {
  CountResponse,
  AssetByCategoryResponse,
  AssetBySubCategoryResponse,
  ApiResponse
} from '~/types/statistic'
import type { FetchError } from 'ofetch'
import { statisticService } from '~/services/StatisticService'

export function useStatistic() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  const count = ref<CountResponse['data'] | null>(null)
  const assetsByCategory = ref<AssetByCategoryResponse['data']>([])
  const assetsBySubCategory = ref<AssetBySubCategoryResponse['data']>([])

  async function getCount(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await statisticService.getCount()
      count.value = res.data
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiResponse<unknown>>
      error.value = fetchError.data?.message ?? 'Failed to fetch count data'
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
      const fetchError = err as FetchError<ApiResponse<unknown>>
      error.value = fetchError.data?.message ?? 'Failed to fetch assets by category'
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
      const fetchError = err as FetchError<ApiResponse<unknown>>
      error.value = fetchError.data?.message ?? 'Failed to fetch assets by sub-category'
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
    getCount,
    getAssetsByCategory,
    getAssetsBySubCategory
  }
}
