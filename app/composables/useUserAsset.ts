import { userAssetService } from '~/services/UserAssetService'
import type { UserAsset, UserAssetResponse } from '~/types/userAsset'
import type { Pagination } from '~/types/api'

export function useUserAsset() {
  const assets = ref<UserAsset[]>([])
  const loading = ref(false)
  const apiPagination = ref<Pagination | null>(null)
  const pagination = ref({
    pageIndex: 0,
    pageSize: 10
  })

  async function fetchActiveAssets(page = pagination.value.pageIndex + 1, limit = pagination.value.pageSize) {
    loading.value = true
    try {
      const res = await userAssetService.getActiveAssets(page, limit)
      assets.value = res.data
      apiPagination.value = res.meta?.pagination ?? null
      pagination.value.pageIndex = (res.meta?.pagination?.currentPage ?? 1) - 1
    } catch (error) {
      // Handled globally
    } finally {
      loading.value = false
    }
  }

  async function fetchHistoryAssets(page = pagination.value.pageIndex + 1, limit = pagination.value.pageSize) {
    loading.value = true
    try {
      const res = await userAssetService.getHistoryAssets(page, limit)
      assets.value = res.data
      apiPagination.value = res.meta?.pagination ?? null
      pagination.value.pageIndex = (res.meta?.pagination?.currentPage ?? 1) - 1
    } catch (error) {
      // Handled globally
    } finally {
      loading.value = false
    }
  }

  async function returnAsset(assetUuid: string, uuid: string, payload: { image: File }) {
    loading.value = true
    try {
      await userAssetService.returnRequest(assetUuid, uuid, payload)
      await fetchActiveAssets()
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    assets,
    loading,
    apiPagination,
    pagination,
    fetchActiveAssets,
    fetchHistoryAssets,
    returnAsset
  }
}
