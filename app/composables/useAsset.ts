import { assetService } from '~/services/AssetService'
import type {
  Asset,
  CreateAssetPayload,
  UpdateAssetPayload,
  Pagination,
  AssetDetailResponse
} from '~/types/asset'
import type { ApiError } from '~/types/api'
import type { FetchError } from 'ofetch'

interface AssetState {
  assets: Ref<Asset[]>
  selectedAsset: Ref<Asset | null>
  pagination: Ref<{ pageIndex: number, pageSize: number }>
  apiPagination: Ref<Pagination | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  fetchAssets: (options?: {
    search?: string
    page?: number
    limit?: number
    categoryId?: string | null
    subCategoryId?: string | null
    status?: string | null
    employeeId?: string | null
    locationId?: string | null
    startDate?: string | null
    endDate?: string | null
    hasHolder?: boolean | null
  }) => Promise<void>
  refreshAssets: () => Promise<void>
  getAssetById: (id: string) => Promise<AssetDetailResponse | null>
  getAssetByCode: (code: string, silent?: boolean) => Promise<AssetDetailResponse | null>
  createAsset: (payload: CreateAssetPayload | FormData) => Promise<Asset>
  importAsset: (payload: FormData) => Promise<any>
  updateAsset: (id: string, payload: UpdateAssetPayload | FormData) => Promise<void>
  deleteAsset: (id: string) => Promise<void>
  exportAssets: (filters: {
    categoryId?: string | undefined
    subCategoryId?: string | undefined
    status?: string | undefined
    employeeId?: string | undefined
    locationId?: string | undefined
    startDate?: string | null
    endDate?: string | null
    hasHolder?: boolean | null
  }) => Promise<void>
}

export const useAsset = (): AssetState => {
  const assets = ref<Asset[]>([])
  const selectedAsset = ref<Asset | null>(null)
  const apiPagination = ref<Pagination | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  const pagination = ref({ pageIndex: 0, pageSize: 10 })
  const searchTerm = ref('')

  async function fetchAssets(options?: {
    search?: string
    page?: number
    limit?: number
    categoryId?: string | null
    subCategoryId?: string | null
    status?: string | null
    employeeId?: string | null
    locationId?: string | null
    startDate?: string | null
    endDate?: string | null
    hasHolder?: boolean | null
  }): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const {
        search = searchTerm.value,
        page = pagination.value.pageIndex + 1,
        limit = pagination.value.pageSize,
        categoryId = null,
        subCategoryId = null,
        status = null,
        employeeId = null,
        locationId = null,
        startDate = null,
        endDate = null,
        hasHolder = null
      } = options || {}

      const res = await assetService.getAssets(
        search,
        page,
        limit,
        categoryId,
        subCategoryId,
        status,
        employeeId,
        locationId,
        startDate,
        endDate,
        hasHolder
      )

      assets.value = res.data
      apiPagination.value = res.meta?.pagination ?? null
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch assets'
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function refreshAssets(): Promise<void> {
    await fetchAssets({ page: pagination.value.pageIndex + 1 })
  }

  async function getAssetById(id: string): Promise<AssetDetailResponse | null> {
    loading.value = true
    error.value = null
    selectedAsset.value = null
    try {
      const res = await assetService.getAssetById(id)
      selectedAsset.value = res.data
      return res
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch asset detail'
      toast.add({ title: 'Failed', description: error.value, color: 'error' })
      return null
    } finally {
      loading.value = false
    }
  }

  async function getAssetByCode(code: string, silent: boolean = false): Promise<AssetDetailResponse | null> {
    loading.value = true
    error.value = null
    selectedAsset.value = null
    try {
      const res = await assetService.getAssetByCode(code)
      selectedAsset.value = res.data
      return res
    } catch (err: unknown) {
      if (!silent) {
        const fetchError = err as FetchError<ApiError>
        error.value = fetchError.data?.message ?? 'Failed to fetch asset detail'
        toast.add({ title: 'Failed', description: error.value, color: 'error' })
      }
      return null
    } finally {
      loading.value = false
    }
  }

  async function createAsset(payload: CreateAssetPayload | FormData): Promise<Asset> {
    loading.value = true
    error.value = null
    try {
      const res = await assetService.createAsset(payload)
      toast.add({ title: 'Created', description: 'Asset created successfully', color: 'success' })
      await refreshAssets()
      return res.data
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to create asset'
      toast.add({ title: 'Create failed', description: error.value, color: 'error' })
      throw err
    } finally {
      loading.value = false
    }
  }

  async function importAsset(payload: FormData): Promise<any> {
    loading.value = true
    error.value = null
    try {
      const res = await assetService.importAsset(payload)
      toast.add({ title: 'Created', description: 'Asset created successfully', color: 'success' })
      await refreshAssets()
      return res.data
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to create asset'
      toast.add({ title: 'Create failed', description: error.value, color: 'error' })
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateAsset(id: string, payload: UpdateAssetPayload | FormData): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await assetService.updateAsset(id, payload)
      toast.add({ title: 'Updated', description: 'Asset updated successfully', color: 'success' })
      await refreshAssets()
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to update asset'
      toast.add({ title: 'Update failed', description: error.value, color: 'error' })
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteAsset(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await assetService.deleteAsset(id)
      toast.add({ title: 'Deleted', description: 'Asset deleted successfully', color: 'success' })
      await refreshAssets()
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to delete asset'
      toast.add({ title: 'Delete failed', description: error.value, color: 'error' })
      throw err
    } finally {
      loading.value = false
    }
  }

  async function exportAssets(filters: {
    categoryId?: string | undefined
    subCategoryId?: string | undefined
    status?: string | undefined
    employeeId?: string | undefined
    locationId?: string | undefined
    startDate?: string | null
    endDate?: string | null
  }): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const { blob, filename } = await assetService.exportAssets(
        filters.categoryId || null,
        filters.subCategoryId || null,
        filters.status || null,
        filters.employeeId || null,
        filters.locationId || null,
        filters.startDate || null,
        filters.endDate || null
      )

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename

      document.body.appendChild(link)
      link.click()

      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.add({
        title: 'Success',
        description: 'Assets exported successfully',
        color: 'success'
      })
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      console.log(fetchError)
      error.value = fetchError.data?.message ?? 'Failed to export assets'
      toast.add({
        title: 'Export failed',
        description: error.value,
        color: 'error'
      })
    } finally {
      loading.value = false
    }
  }

  watch(searchTerm, () => {
    pagination.value.pageIndex = 0
    fetchAssets({ search: searchTerm.value, page: 1 })
  })

  return {
    assets,
    selectedAsset,
    apiPagination,
    pagination,
    loading,
    error,
    fetchAssets,
    refreshAssets,
    getAssetById,
    getAssetByCode,
    createAsset,
    importAsset,
    updateAsset,
    deleteAsset,
    exportAssets
  }
}
