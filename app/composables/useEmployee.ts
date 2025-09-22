// ~/composables/useEmployee.ts
import { employeeService } from '~/services/EmployeeService'
import type { Employee } from '~/types/employee'
import type { ApiError } from '~/types/api'
import type { FetchError } from 'ofetch'

interface EmployeeState {
  employees: Ref<Employee[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  fetchEmployees: (search?: string) => Promise<void>
  refreshEmployees: () => Promise<void>
}

export const useEmployee = (): EmployeeState => {
  const employees = ref<Employee[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  async function fetchEmployees(search = ''): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await employeeService.getAllEmployees(search)
      employees.value = res.data
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch employees'
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function refreshEmployees(): Promise<void> {
    await fetchEmployees()
  }

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    refreshEmployees
  }
}
