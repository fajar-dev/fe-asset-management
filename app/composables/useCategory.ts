import { categoryService } from '~/services/CategoryService'
import type { Category, CreateCategoryPayload, UpdateCategoryPayload, Pagination, CategoryDetailResponse } from '~/types/category'
import type { SubCategory } from '~/types/subCategory'

import type { ApiError } from '~/types/api'
import type { FetchError } from 'ofetch'

interface CategoryState {
  categories: Ref<Category[]>
  selectedCategory: Ref<Category | null>
  subCategories: Ref<SubCategory[]>
  pagination: Ref<{ pageIndex: number, pageSize: number }>
  apiPagination: Ref<Pagination | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  fetchCategories: (search?: string, page?: number, limit?: number) => Promise<void>
  refreshCategories: () => Promise<void>
  getCategoryById: (id: string) => Promise<CategoryDetailResponse | null>
  getSubCategoriesByCategory: (id: string) => Promise<void>
  createCategory: (payload: CreateCategoryPayload) => Promise<Category | undefined>
  updateCategory: (id: string, payload: UpdateCategoryPayload) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  getAllCategories: () => Promise<void>
}

export const useCategory = (): CategoryState => {
  const categories = ref<Category[]>([])
  const selectedCategory = ref<Category | null>(null)
  const subCategories = ref<SubCategory[]>([])
  const apiPagination = ref<Pagination | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  const pagination = ref({ pageIndex: 0, pageSize: 10 })

  async function getAllCategories(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await categoryService.getAllCategories(true)
      categories.value = res.data
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch categories'
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function fetchCategories(search = '', page = 1, limit = 10): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await categoryService.getCategories(search, page, limit)
      categories.value = res.data
      apiPagination.value = res.meta.pagination
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch categories'
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function refreshCategories(): Promise<void> {
    await fetchCategories('', pagination.value.pageIndex + 1, pagination.value.pageSize)
  }

  async function createCategory(payload: CreateCategoryPayload): Promise<Category | undefined> {
    loading.value = true
    error.value = null
    try {
      const res = await categoryService.createCategory(payload)
      await refreshCategories()
      toast.add({ title: 'Created', description: 'Category created successfully', color: 'success' })
      return res.data
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to create category'
      toast.add({ title: 'Create failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function getCategoryById(id: string): Promise<CategoryDetailResponse | null> {
    loading.value = true
    error.value = null
    selectedCategory.value = null
    try {
      const res: CategoryDetailResponse = await categoryService.getCategoryById(id)
      selectedCategory.value = res.data
      return res
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch category detail'
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
      return null
    } finally {
      loading.value = false
    }
  }

  async function getSubCategoriesByCategory(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await categoryService.getSubCategoriesByCategory(id)
      subCategories.value = res.data
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch sub-categories'
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function updateCategory(id: string, payload: UpdateCategoryPayload): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await categoryService.updateCategory(id, payload)
      await refreshCategories()
      toast.add({ title: 'Updated', description: 'Category updated successfully', color: 'success' })
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to update category'
      toast.add({ title: 'Update failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function deleteCategory(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await categoryService.deleteCategory(id)
      await refreshCategories()
      toast.add({ title: 'Deleted', description: 'Category deleted successfully', color: 'success' })
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to delete category'
      toast.add({ title: 'Delete failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  const searchTerm = ref('')
  watch(searchTerm, () => {
    pagination.value.pageIndex = 0
    fetchCategories(searchTerm.value, 1, pagination.value.pageSize)
  })

  return {
    categories,
    selectedCategory,
    subCategories,
    apiPagination,
    pagination,
    loading,
    error,
    fetchCategories,
    refreshCategories,
    getCategoryById,
    getSubCategoriesByCategory,
    deleteCategory,
    createCategory,
    updateCategory,
    getAllCategories
  }
}
