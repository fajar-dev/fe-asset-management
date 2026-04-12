import { assetStatusService, type CreateAssetStatusPayload, type AssetStatusResponse } from '~/services/AssetStatusService'
import type { ApiError } from '~/types/api'
import type { FetchError } from 'ofetch'

export const useAssetStatus = () => {
  const statuses = ref<AssetStatusResponse[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  async function updateAssetStatus(assetUuid: string, payload: CreateAssetStatusPayload) {
    loading.value = true
    error.value = null
    try {
      const res = await assetStatusService.updateStatus(assetUuid, payload)
      toast.add({
        title: 'Status Updated',
        description: 'Asset status has been updated successfully',
        color: 'success'
      })
      return res.data
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to update status'
      toast.add({
        title: 'Update Failed',
        description: error.value,
        color: 'error'
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchAssetStatuses(assetUuid: string, page: number = 1, limit: number = 10, search: string = '') {
    loading.value = true
    error.value = null
    try {
      const res = await assetStatusService.getStatuses(assetUuid, page, limit, search)
      statuses.value = res.data
      return res
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch statuses'
      toast.add({
        title: 'Fetch Failed',
        description: error.value,
        color: 'error'
      })
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    statuses,
    loading,
    error,
    updateAssetStatus,
    fetchAssetStatuses
  }
}
