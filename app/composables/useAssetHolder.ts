// ~/composables/useAssetHolder.ts
import { assetHolderService } from '~/services/AssetHolderService'
import type {
  AssetHolder,
  AssignAssetHolderPayload,
  ReturnAssetHolderPayload,
  AssetHolderDetailResponse,
  Pagination
} from '~/types/assetHolder'
import type { ApiError } from '~/types/api'
import type { FetchError } from 'ofetch'

interface AssetHolderState {
  holders: Ref<AssetHolder[]>
  selectedHolder: Ref<AssetHolder | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  pagination: Ref<{ pageIndex: number, pageSize: number, total: number }>
  apiPagination: Ref<Pagination | null>
  searchTerm: Ref<string>
  fetchHolders: (
    assetUuid: string,
    search?: string,
    page?: number,
    limit?: number
  ) => Promise<void>
  refreshHolders: (assetUuid: string) => Promise<void>
  getHolderById: (
    assetUuid: string,
    holderId: string
  ) => Promise<AssetHolderDetailResponse | null>
  assignHolder: (
    assetUuid: string,
    payload: AssignAssetHolderPayload
  ) => Promise<void>
  returnHolder: (
    assetUuid: string,
    holderId: string,
    payload: ReturnAssetHolderPayload
  ) => Promise<void>
}

export function useAssetHolder(): AssetHolderState {
  const holders = ref<AssetHolder[]>([])
  const selectedHolder = ref<AssetHolder | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  const pagination = ref({ pageIndex: 0, pageSize: 10, total: 0 })
  const apiPagination = ref<Pagination | null>(null)
  const searchTerm = ref('')

  async function fetchHolders(
    assetUuid: string,
    search = '',
    page = 1,
    limit = 10
  ): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await assetHolderService.getHolders(assetUuid, {
        search,
        page,
        limit
      })
      holders.value = res.data
      apiPagination.value = res.meta?.pagination ?? null
      pagination.value = {
        pageIndex: (res.meta?.pagination?.currentPage ?? 1) - 1,
        pageSize: res.meta?.pagination?.itemsPerPage ?? limit,
        total: res.meta?.pagination?.totalItems ?? 0
      }
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch holders'
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function refreshHolders(assetUuid: string): Promise<void> {
    await fetchHolders(
      assetUuid,
      searchTerm.value,
      pagination.value.pageIndex + 1,
      pagination.value.pageSize
    )
  }

  async function getHolderById(
    assetUuid: string,
    holderId: string
  ): Promise<AssetHolderDetailResponse | null> {
    loading.value = true
    error.value = null
    selectedHolder.value = null
    try {
      const res = await assetHolderService.getHolderById(assetUuid, holderId)
      selectedHolder.value = res.data
      return res
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch holder detail'
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
      return null
    } finally {
      loading.value = false
    }
  }

  async function assignHolder(
    assetUuid: string,
    payload: AssignAssetHolderPayload
  ): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await assetHolderService.assignHolder(assetUuid, payload)
      await refreshHolders(assetUuid)
      toast.add({
        title: 'Assigned',
        description: 'Holder assigned successfully',
        color: 'success'
      })
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to assign holder'
      toast.add({ title: 'Assign failed', description: error.value, color: 'error' })
      throw err
    } finally {
      loading.value = false
    }
  }

  async function returnHolder(
    assetUuid: string,
    holderId: string,
    payload: ReturnAssetHolderPayload
  ): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await assetHolderService.returnHolder(assetUuid, holderId, payload)
      await refreshHolders(assetUuid)
      toast.add({
        title: 'Returned',
        description: 'Holder returned successfully',
        color: 'success'
      })
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to return holder'
      toast.add({ title: 'Return failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  watch(searchTerm, () => {
    pagination.value.pageIndex = 0
    fetchHolders('', searchTerm.value, 1, pagination.value.pageSize)
  })

  return {
    holders,
    selectedHolder,
    loading,
    error,
    pagination,
    apiPagination,
    searchTerm,
    fetchHolders,
    refreshHolders,
    getHolderById,
    assignHolder,
    returnHolder
  }
}
