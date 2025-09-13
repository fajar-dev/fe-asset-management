import { subCategoryService } from '~/services/SubCategoryService'
import type {
  SubCategory,
  CreateSubCategoryPayload,
  UpdateSubCategoryPayload,
  Pagination,
  SubCategoryDetailResponse
} from '~/types/subCategory'
import type { ApiError } from '~/types/api'
import type { FetchError } from 'ofetch'

interface SubCategoryState {
  subCategories: Ref<SubCategory[]>
  selectedSubCategory: Ref<SubCategory | null>
  pagination: Ref<{ pageIndex: number, pageSize: number }>
  apiPagination: Ref<Pagination | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  fetchSubCategories: (search?: string, page?: number, limit?: number) => Promise<void>
  refreshSubCategories: () => Promise<void>
  getSubCategoryById: (id: string) => Promise<SubCategoryDetailResponse | null>
  createSubCategory: (payload: CreateSubCategoryPayload) => Promise<void>
  updateSubCategory: (id: string, payload: UpdateSubCategoryPayload) => Promise<void>
  deleteSubCategory: (id: string) => Promise<void>
}

export const useSubCategory = (): SubCategoryState => {
  const subCategories = ref<SubCategory[]>([])
  const selectedSubCategory = ref<SubCategory | null>(null)
  const apiPagination = ref<Pagination | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  const pagination = ref({ pageIndex: 0, pageSize: 10 })

  async function fetchSubCategories(search = '', page = 1, limit = 10): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await subCategoryService.getSubCategories(search, page, limit)
      subCategories.value = res.data
      apiPagination.value = res.meta.pagination
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch sub-categories'
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function refreshSubCategories(): Promise<void> {
    await fetchSubCategories('', pagination.value.pageIndex + 1, pagination.value.pageSize)
  }

  async function createSubCategory(payload: CreateSubCategoryPayload): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await subCategoryService.createSubCategory(payload)
      await refreshSubCategories()
      toast.add({ title: 'Created', description: 'Sub category created successfully', color: 'success' })
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to create sub category'
      toast.add({ title: 'Create failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function getSubCategoryById(id: string): Promise<SubCategoryDetailResponse | null> {
    loading.value = true
    error.value = null
    selectedSubCategory.value = null
    try {
      const res = await subCategoryService.getSubCategoryById(id)
      selectedSubCategory.value = res.data
      return res
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch sub category detail'
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateSubCategory(id: string, payload: UpdateSubCategoryPayload): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await subCategoryService.updateSubCategory(id, payload)
      await refreshSubCategories()
      toast.add({ title: 'Updated', description: 'Sub category updated successfully', color: 'success' })
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to update sub category'
      toast.add({ title: 'Update failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function deleteSubCategory(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await subCategoryService.deleteSubCategory(id)
      await refreshSubCategories()
      toast.add({ title: 'Deleted', description: 'Sub category deleted successfully', color: 'success' })
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to delete sub category'
      toast.add({ title: 'Delete failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  const searchTerm = ref('')
  watch(searchTerm, () => {
    pagination.value.pageIndex = 0
    fetchSubCategories(searchTerm.value, 1, pagination.value.pageSize)
  })

  return {
    subCategories,
    selectedSubCategory,
    apiPagination,
    pagination,
    loading,
    error,
    fetchSubCategories,
    refreshSubCategories,
    getSubCategoryById,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory
  }
}
