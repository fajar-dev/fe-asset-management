import { locationService } from '~/services/LocationService'
import type { Location, CreateLocationPayload, UpdateLocationPayload, Pagination, LocationDetailResponse } from '~/types/location'
import type { ApiError } from '~/types/api'
import type { FetchError } from 'ofetch'
import { ref, watch, type Ref } from 'vue'

interface LocationState {
  locations: Ref<Location[]>
  selectedLocation: Ref<Location | null>
  pagination: Ref<{ pageIndex: number, pageSize: number }>
  apiPagination: Ref<Pagination | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  fetchLocations: (search?: string, page?: number, limit?: number) => Promise<void>
  refreshLocations: () => Promise<void>
  getLocationById: (id: string) => Promise<LocationDetailResponse | null>
  createLocation: (payload: CreateLocationPayload) => Promise<void>
  updateLocation: (id: string, payload: UpdateLocationPayload) => Promise<void>
  deleteLocation: (id: string) => Promise<void>
}

export const useLocation = (): LocationState => {
  const locations = ref<Location[]>([])
  const selectedLocation = ref<Location | null>(null)
  const apiPagination = ref<Pagination | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  const pagination = ref({ pageIndex: 0, pageSize: 10 })

  async function fetchLocations(search = '', page = 1, limit = 10): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await locationService.getLocations(search, page, limit)
      locations.value = res.data
      apiPagination.value = res.meta.pagination
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch locations'
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function refreshLocations(): Promise<void> {
    await fetchLocations('', pagination.value.pageIndex + 1, pagination.value.pageSize)
  }

  async function createLocation(payload: CreateLocationPayload): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await locationService.createLocation(payload)
      await refreshLocations()
      toast.add({ title: 'Created', description: 'Location created successfully', color: 'success' })
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to create location'
      toast.add({ title: 'Create failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function getLocationById(id: string): Promise<LocationDetailResponse | null> {
    loading.value = true
    error.value = null
    selectedLocation.value = null
    try {
      const res: LocationDetailResponse = await locationService.getLocationById(id)
      selectedLocation.value = res.data
      return res
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch location detail'
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateLocation(id: string, payload: UpdateLocationPayload): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await locationService.updateLocation(id, payload)
      await refreshLocations()
      toast.add({ title: 'Updated', description: 'Location updated successfully', color: 'success' })
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to update location'
      toast.add({ title: 'Update failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function deleteLocation(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await locationService.deleteLocation(id)
      await refreshLocations()
      toast.add({ title: 'Deleted', description: 'Location deleted successfully', color: 'success' })
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to delete location'
      toast.add({ title: 'Delete failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  const searchTerm = ref('')
  watch(searchTerm, () => {
    pagination.value.pageIndex = 0
    fetchLocations(searchTerm.value, 1, pagination.value.pageSize)
  })

  return {
    locations,
    selectedLocation,
    apiPagination,
    pagination,
    loading,
    error,
    fetchLocations,
    refreshLocations,
    getLocationById,
    deleteLocation,
    createLocation,
    updateLocation
  }
}
