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
  }) => Promise<void>
  refreshAssets: () => Promise<void>
  getAssetById: (id: string) => Promise<AssetDetailResponse | null>
  createAsset: (payload: CreateAssetPayload) => Promise<Asset>
  updateAsset: (id: string, payload: UpdateAssetPayload) => Promise<void>
  deleteAsset: (id: string) => Promise<void>
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

  // Fetch assets with filters
  async function fetchAssets(options?: {
    search?: string
    page?: number
    limit?: number
    categoryId?: string | null
    subCategoryId?: string | null
    status?: string | null
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
        status = null
      } = options || {}

      const res = await assetService.getAssets(search, page, limit, categoryId, subCategoryId, status)
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
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
      return null
    } finally {
      loading.value = false
    }
  }

  async function createAsset(payload: CreateAssetPayload): Promise<Asset> {
    loading.value = true
    error.value = null
    try {
      const res = await assetService.createAsset(payload)
      toast.add({ title: 'Created', description: 'Asset created successfully', color: 'success' })
      await refreshAssets()
      return res
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to create asset'
      toast.add({ title: 'Create failed', description: error.value, color: 'error' })
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateAsset(id: string, payload: UpdateAssetPayload): Promise<void> {
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
    } finally {
      loading.value = false
    }
  }

  // Watch search term
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
    createAsset,
    updateAsset,
    deleteAsset
  }
}
