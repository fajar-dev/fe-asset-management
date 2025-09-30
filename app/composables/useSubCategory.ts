// ~/composables/useSubCategory.ts

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
  hierarchyTree: Ref<SubCategory[]>
  selectedSubCategory: Ref<SubCategory | null>
  breadcrumbPath: Ref<SubCategory[]>
  pagination: Ref<{ pageIndex: number, pageSize: number }>
  apiPagination: Ref<Pagination | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  fetchSubCategories: (search?: string, page?: number, limit?: number, categoryUuid?: string) => Promise<void>
  getHierarchyTree: (categoryUuid: string) => Promise<void>
  getSubCategoriesByCategory: (categoryUuid: string) => Promise<void>
  refreshSubCategories: () => Promise<void>
  getSubCategoryById: (id: string) => Promise<SubCategoryDetailResponse | null>
  getSubCategoryPath: (id: string) => Promise<void>
  createSubCategory: (payload: CreateSubCategoryPayload) => Promise<SubCategory>
  updateSubCategory: (id: string, payload: UpdateSubCategoryPayload) => Promise<void>
  deleteSubCategory: (id: string) => Promise<void>
  getAvailableParents: (categoryUuid: string, currentId?: string) => SubCategory[]
  getFlattenedTree: (tree: SubCategory[], level?: number) => Array<SubCategory & { indent: string }>
}

export const useSubCategory = (): SubCategoryState => {
  const subCategories = ref<SubCategory[]>([])
  const hierarchyTree = ref<SubCategory[]>([])
  const selectedSubCategory = ref<SubCategory | null>(null)
  const breadcrumbPath = ref<SubCategory[]>([])
  const apiPagination = ref<Pagination | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  const pagination = ref({ pageIndex: 0, pageSize: 10 })

  async function fetchSubCategories(
    search = '',
    page = 1,
    limit = 10,
    categoryUuid?: string
  ): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await subCategoryService.getSubCategories(search, page, limit, categoryUuid)
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

  async function getHierarchyTree(categoryUuid: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await subCategoryService.getHierarchyTree(categoryUuid)
      hierarchyTree.value = res.data
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch hierarchy tree'
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function getSubCategoriesByCategory(categoryUuid: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await subCategoryService.getSubCategoriesByCategory(categoryUuid)
      subCategories.value = res.data
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

  async function createSubCategory(payload: CreateSubCategoryPayload): Promise<SubCategory> {
    loading.value = true
    error.value = null
    try {
      const res = await subCategoryService.createSubCategory(payload)
      toast.add({
        title: 'Created',
        description: 'Sub category created successfully',
        color: 'success'
      })
      await refreshSubCategories()
      return res.data
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to create sub category'
      toast.add({ title: 'Create failed', description: error.value, color: 'error' })
      throw err
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

  async function getSubCategoryPath(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await subCategoryService.getSubCategoryPath(id)
      breadcrumbPath.value = res.data
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch sub category path'
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
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
      toast.add({
        title: 'Updated',
        description: 'Sub category updated successfully',
        color: 'success'
      })
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
      toast.add({
        title: 'Deleted',
        description: 'Sub category deleted successfully',
        color: 'success'
      })
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to delete sub category'
      toast.add({ title: 'Delete failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  // Helper: Get available parents (exclude self and descendants)
  function getAvailableParents(categoryUuid: string, currentId?: string): SubCategory[] {
    if (!currentId) return subCategories.value

    const excludedIds = new Set<string>([currentId])

    // Recursively collect all descendant IDs
    function collectDescendants(subCat: SubCategory) {
      if (subCat.children) {
        for (const child of subCat.children) {
          excludedIds.add(child.id)
          collectDescendants(child)
        }
      }
    }

    const current = subCategories.value.find(s => s.id === currentId)
    if (current) {
      collectDescendants(current)
    }

    return subCategories.value.filter(s => !excludedIds.has(s.id))
  }

  // Helper: Flatten tree for dropdown display with indentation
  function getFlattenedTree(
    tree: SubCategory[],
    level = 0
  ): Array<SubCategory & { indent: string }> {
    const result: Array<SubCategory & { indent: string }> = []

    for (const node of tree) {
      result.push({
        ...node,
        indent: '  '.repeat(level)
      })

      if (node.children && node.children.length > 0) {
        result.push(...getFlattenedTree(node.children, level + 1))
      }
    }

    return result
  }

  const searchTerm = ref('')
  watch(searchTerm, () => {
    pagination.value.pageIndex = 0
    fetchSubCategories(searchTerm.value, 1, pagination.value.pageSize)
  })

  return {
    subCategories,
    hierarchyTree,
    selectedSubCategory,
    breadcrumbPath,
    apiPagination,
    pagination,
    loading,
    error,
    fetchSubCategories,
    getHierarchyTree,
    getSubCategoriesByCategory,
    refreshSubCategories,
    getSubCategoryById,
    getSubCategoryPath,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory,
    getAvailableParents,
    getFlattenedTree
  }
}
