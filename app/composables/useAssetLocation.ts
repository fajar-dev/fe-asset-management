// ~/composables/useAssetLocation.ts
import { assetLocationService } from '~/services/AssetLocationService'
import type {
  AssetLocation,
  AssetLocationResponse,
  CreateAssetLocationPayload,
  Pagination
} from '~/types/assetLocation'
import type { ApiError } from '~/types/api'
import type { FetchError } from 'ofetch'

interface AssetLocationState {
  locations: Ref<AssetLocation[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  pagination: Ref<{ pageIndex: number, pageSize: number, total: number }>
  apiPagination: Ref<Pagination | null>
  searchTerm: Ref<string>
  fetchLocations: (
    assetUuid: string,
    search?: string,
    page?: number,
    limit?: number
  ) => Promise<void>
  refreshLocations: (assetUuid: string) => Promise<void>
  createLocation: (
    assetUuid: string,
    payload: CreateAssetLocationPayload
  ) => Promise<void>
}

export function useAssetLocation(): AssetLocationState {
  const locations = ref<AssetLocation[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  const pagination = ref({ pageIndex: 0, pageSize: 10, total: 0 })
  const apiPagination = ref<Pagination | null>(null)
  const searchTerm = ref('')

  async function fetchLocations(
    assetUuid: string,
    search = '',
    page = 1,
    limit = 10
  ): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res: AssetLocationResponse = await assetLocationService.getLocations(assetUuid, {
        search,
        page,
        limit
      })
      locations.value = res.data
      apiPagination.value = res.meta?.pagination ?? null
      pagination.value = {
        pageIndex: (res.meta?.pagination?.currentPage ?? 1) - 1,
        pageSize: res.meta?.pagination?.itemsPerPage ?? limit,
        total: res.meta?.pagination?.totalItems ?? 0
      }
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch locations'
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function refreshLocations(assetUuid: string): Promise<void> {
    await fetchLocations(
      assetUuid,
      searchTerm.value,
      pagination.value.pageIndex + 1,
      pagination.value.pageSize
    )
  }

  async function createLocation(
    assetUuid: string,
    payload: CreateAssetLocationPayload
  ): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await assetLocationService.createLocation(assetUuid, payload)
      await refreshLocations(assetUuid)
      toast.add({
        title: 'Created',
        description: 'Location added successfully',
        color: 'success'
      })
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to create location'
      toast.add({ title: 'Create failed', description: error.value, color: 'error' })
      throw err
    } finally {
      loading.value = false
    }
  }

  watch(searchTerm, () => {
    pagination.value.pageIndex = 0
    fetchLocations('', searchTerm.value, 1, pagination.value.pageSize)
  })

  return {
    locations,
    loading,
    error,
    pagination,
    apiPagination,
    searchTerm,
    fetchLocations,
    refreshLocations,
    createLocation
  }
}
