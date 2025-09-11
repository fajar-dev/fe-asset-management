import { categoryService } from '~/services/CategoryService'
import type { Category, Pagination } from '~/types/category'
import type { ApiError } from '~/types/api'
import type { FetchError } from 'ofetch'

interface CategoryState {
  categories: Ref<Category[]>
  pagination: Ref<{ pageIndex: number, pageSize: number }>
  apiPagination: Ref<Pagination | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  fetchCategories: (search?: string, page?: number, limit?: number) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
}

export const useCategory = (): CategoryState => {
  const categories = ref<Category[]>([])
  const apiPagination = ref<Pagination | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  const pagination = ref({
    pageIndex: 0,
    pageSize: 10
  })

  async function fetchCategories(search = '', page = 1, limit = 10) {
    loading.value = true
    error.value = null

    try {
      const res = await categoryService.getCategories(search, page, limit)
      categories.value = res.data
      apiPagination.value = res.meta.pagination
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message || 'Failed to fetch categories'
      toast.add({
        title: 'Fetch failed',
        description: error.value,
        color: 'error'
      })
    } finally {
      loading.value = false
    }
  }

  async function deleteCategory(id: string) {
    loading.value = true
    error.value = null

    try {
      await categoryService.deleteCategory(id)
      // Refresh current page
      await fetchCategories(
        '',
        pagination.value.pageIndex + 1,
        pagination.value.pageSize
      )
      toast.add({
        title: 'Deleted',
        description: 'Category deleted successfully',
        color: 'success'
      })
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message || 'Failed to delete category'
      toast.add({
        title: 'Delete failed',
        description: error.value,
        color: 'error'
      })
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
    apiPagination,
    pagination,
    loading,
    error,
    fetchCategories,
    deleteCategory
  }
}
