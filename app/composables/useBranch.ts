// ~/composables/useBranch.ts
import { branchService } from '~/services/BranchService'
import type { Branch } from '~/types/branch'
import { extractErrorMessage } from '~/utils/errorHandler'

interface BranchState {
  branches: Ref<Branch[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  fetchBranches: (search?: string) => Promise<void>
  refreshBranches: () => Promise<void>
}

export function useBranch(): BranchState {
  const branches = ref<Branch[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  async function fetchBranches(search = ''): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await branchService.getAllBranches(search)
      branches.value = res.data
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Failed to fetch branches')
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
