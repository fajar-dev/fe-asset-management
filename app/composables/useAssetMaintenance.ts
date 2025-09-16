import { assetMaintenanceService } from '~/services/AssetMaintenanceService'
import type {
  AssetMaintenance,
  CreateAssetMaintenancePayload,
  UpdateAssetMaintenancePayload,
  AssetMaintenanceDetailResponse,
  Pagination
} from '~/types/assetMaintenance'
import type { ApiError } from '~/types/api'
import type { FetchError } from 'ofetch'

interface AssetMaintenanceState {
  maintenances: Ref<AssetMaintenance[]>
  selectedMaintenance: Ref<AssetMaintenance | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  pagination: Ref<{ pageIndex: number, pageSize: number, total: number }>
  apiPagination: Ref<Pagination | null>
  searchTerm: Ref<string>
  fetchMaintenances: (
    assetUuid: string,
    search?: string,
    page?: number,
    limit?: number
  ) => Promise<void>
  refreshMaintenances: (assetUuid: string) => Promise<void>
  getMaintenanceById: (
    assetUuid: string,
    maintenanceId: string
  ) => Promise<AssetMaintenanceDetailResponse | null>
  createMaintenance: (
    assetUuid: string,
    payload: CreateAssetMaintenancePayload
  ) => Promise<void>
  updateMaintenance: (
    assetUuid: string,
    maintenanceId: string,
    payload: UpdateAssetMaintenancePayload
  ) => Promise<void>
  deleteMaintenance: (assetUuid: string, maintenanceId: string) => Promise<void>
}

export function useAssetMaintenance(): AssetMaintenanceState {
  const maintenances = ref<AssetMaintenance[]>([])
  const selectedMaintenance = ref<AssetMaintenance | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  const pagination = ref({ pageIndex: 0, pageSize: 10, total: 0 })
  const apiPagination = ref<Pagination | null>(null)
  const searchTerm = ref('')

  async function fetchMaintenances(
    assetUuid: string,
    search = '',
    page = 1,
    limit = 10
  ): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await assetMaintenanceService.getMaintenances(assetUuid, {
        search,
        page,
        limit
      })
      maintenances.value = res.data
      apiPagination.value = res.meta?.pagination ?? null
      pagination.value = {
        pageIndex: (res.meta?.pagination?.currentPage ?? 1) - 1,
        pageSize: res.meta?.pagination?.itemsPerPage ?? limit,
        total: res.meta?.pagination?.totalItems ?? 0
      }
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch maintenances'
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function refreshMaintenances(assetUuid: string): Promise<void> {
    await fetchMaintenances(
      assetUuid,
      searchTerm.value,
      pagination.value.pageIndex + 1,
      pagination.value.pageSize
    )
  }

  async function getMaintenanceById(
    assetUuid: string,
    maintenanceId: string
  ): Promise<AssetMaintenanceDetailResponse | null> {
    loading.value = true
    error.value = null
    selectedMaintenance.value = null
    try {
      const res = await assetMaintenanceService.getMaintenanceById(
        assetUuid,
        maintenanceId
      )
      selectedMaintenance.value = res.data
      return res
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch maintenance detail'
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
      return null
    } finally {
      loading.value = false
    }
  }

  async function createMaintenance(
    assetUuid: string,
    payload: CreateAssetMaintenancePayload
  ): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await assetMaintenanceService.createMaintenance(assetUuid, payload)
      await refreshMaintenances(assetUuid)
      toast.add({
        title: 'Created',
        description: 'Maintenance created successfully',
        color: 'success'
      })
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to create maintenance'
      toast.add({ title: 'Create failed', description: error.value, color: 'error' })
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateMaintenance(
    assetUuid: string,
    maintenanceId: string,
    payload: UpdateAssetMaintenancePayload
  ): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await assetMaintenanceService.updateMaintenance(assetUuid, maintenanceId, payload)
      await refreshMaintenances(assetUuid)
      toast.add({
        title: 'Updated',
        description: 'Maintenance updated successfully',
        color: 'success'
      })
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to update maintenance'
      toast.add({ title: 'Update failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function deleteMaintenance(
    assetUuid: string,
    maintenanceId: string
  ): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await assetMaintenanceService.deleteMaintenance(assetUuid, maintenanceId)
      await refreshMaintenances(assetUuid)
      toast.add({
        title: 'Deleted',
        description: 'Maintenance deleted successfully',
        color: 'success'
      })
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to delete maintenance'
      toast.add({ title: 'Delete failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  watch(searchTerm, () => {
    pagination.value.pageIndex = 0
    fetchMaintenances('', searchTerm.value, 1, pagination.value.pageSize)
  })

  return {
    maintenances,
    selectedMaintenance,
    loading,
    error,
    pagination,
    apiPagination,
    searchTerm,
    fetchMaintenances,
    refreshMaintenances,
    getMaintenanceById,
    createMaintenance,
    updateMaintenance,
    deleteMaintenance
  }
}
