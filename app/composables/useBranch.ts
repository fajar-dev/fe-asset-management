// ~/composables/useBranch.ts
import { branchService } from '~/services/BranchService'
import type { Branch } from '~/types/branch'
import type { ApiError } from '~/types/api'
import type { FetchError } from 'ofetch'

interface BranchState {
  branches: Ref<Branch[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  fetchBranches: (search?: string) => Promise<void>
  refreshBranches: () => Promise<void>
}

export const useBranch = (): BranchState => {
  const branches = ref<Branch[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  async function fetchBranches(search = ''): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await branchService.getAllCategories(search)
      branches.value = res.data
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch branches'
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function refreshBranches(): Promise<void> {
    await fetchBranches()
  }

  return {
    branches,
    loading,
    error,
    fetchBranches,
    refreshBranches
  }
}
