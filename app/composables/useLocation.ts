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
  createLocation: (payload: CreateLocationPayload) => Promise<LocationDetailResponse | null>
  updateLocation: (id: string, payload: UpdateLocationPayload) => Promise<void>
  deleteLocation: (id: string) => Promise<void>
  getAllLocations: (branchId?: string) => Promise<void>
}

export const useLocation = (): LocationState => {
  const locations = ref<Location[]>([])
  const selectedLocation = ref<Location | null>(null)
  const apiPagination = ref<Pagination | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  const pagination = ref({ pageIndex: 0, pageSize: 10 })
  const searchTerm = ref('')

  const handleError = (err: unknown, defaultMessage: string) => {
    const fetchError = err as FetchError<ApiError>
    const msg = fetchError?.data?.message ?? defaultMessage
    error.value = msg
    toast.add({ title: 'Error', description: msg, color: 'error' })
  }

  const getAllLocations = async (branchId = ''): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      const res = await locationService.getAllLocations(true, branchId)
      locations.value = res.data
    } catch (err) {
      handleError(err, 'Failed to fetch locations')
    } finally {
      loading.value = false
    }
  }

  const fetchLocations = async (search = '', page = 1, limit = 10): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      const res = await locationService.getLocations(search, page, limit)
      locations.value = res.data
      apiPagination.value = res.meta.pagination
      pagination.value.pageIndex = page - 1
    } catch (err) {
      handleError(err, 'Failed to fetch locations')
    } finally {
      loading.value = false
    }
  }

  const refreshLocations = async (): Promise<void> => {
    await fetchLocations(searchTerm.value, pagination.value.pageIndex + 1, pagination.value.pageSize)
  }

  const createLocation = async (payload: CreateLocationPayload): Promise<LocationDetailResponse | null> => {
    loading.value = true
    error.value = null
    try {
      const res = await locationService.createLocation(payload)
      await refreshLocations()
      toast.add({ title: 'Created', description: 'Location created successfully', color: 'success' })
      return res
    } catch (err) {
      handleError(err, 'Failed to create location')
      return null
    } finally {
      loading.value = false
    }
  }

  const getLocationById = async (id: string): Promise<LocationDetailResponse | null> => {
    loading.value = true
    error.value = null
    selectedLocation.value = null
    try {
      const res = await locationService.getLocationById(id)
      selectedLocation.value = res.data
      return res
    } catch (err) {
      handleError(err, 'Failed to fetch location detail')
      return null
    } finally {
      loading.value = false
    }
  }

  const updateLocation = async (id: string, payload: UpdateLocationPayload): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      await locationService.updateLocation(id, payload)
      await refreshLocations()
      toast.add({ title: 'Updated', description: 'Location updated successfully', color: 'success' })
    } catch (err) {
      handleError(err, 'Failed to update location')
    } finally {
      loading.value = false
    }
  }

  const deleteLocation = async (id: string): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      await locationService.deleteLocation(id)
      await refreshLocations()
      toast.add({ title: 'Deleted', description: 'Location deleted successfully', color: 'success' })
    } catch (err) {
      handleError(err, 'Failed to delete location')
    } finally {
      loading.value = false
    }
  }

  // Watch searchTerm and fetch locations
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
    createLocation,
    updateLocation,
    deleteLocation,
    getAllLocations
  }
}
