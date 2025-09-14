import { propertyService } from '~/services/PropertyService'
import type {
  Property,
  CreatePropertyPayload,
  UpdatePropertyPayload,
  PropertyDetailResponse
} from '~/types/property'
import type { ApiError } from '~/types/api'
import type { FetchError } from 'ofetch'

interface PropertyState {
  properties: Ref<Property[]>
  selectedProperty: Ref<Property | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  fetchProperties: (subCategoryId: string) => Promise<void>
  getPropertyById: (subCategoryId: string, propertyId: string) => Promise<PropertyDetailResponse | null>
  createProperty: (subCategoryId: string, payload: CreatePropertyPayload) => Promise<void>
  updateProperty: (subCategoryId: string, propertyId: string, payload: UpdatePropertyPayload) => Promise<void>
  deleteProperty: (subCategoryId: string, propertyId: string) => Promise<void>
}

export const useProperty = (): PropertyState => {
  const properties = ref<Property[]>([])
  const selectedProperty = ref<Property | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  // Fetch all properties for a subcategory (no pagination)
  async function fetchProperties(subCategoryId: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await propertyService.getAllProperties(subCategoryId, true)
      properties.value = res.data
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch properties'
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  // Fetch detail by ID
  async function getPropertyById(subCategoryId: string, propertyId: string): Promise<PropertyDetailResponse | null> {
    loading.value = true
    error.value = null
    selectedProperty.value = null
    try {
      const res = await propertyService.getPropertyById(subCategoryId, propertyId)
      selectedProperty.value = res.data
      return res
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch property detail'
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
      return null
    } finally {
      loading.value = false
    }
  }

  // Create
  async function createProperty(subCategoryId: string, payload: CreatePropertyPayload): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await propertyService.createProperty(subCategoryId, payload)
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to create property'
      toast.add({ title: 'Create failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  // Update
  async function updateProperty(subCategoryId: string, propertyId: string, payload: UpdatePropertyPayload): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await propertyService.updateProperty(subCategoryId, propertyId, payload)
      await fetchProperties(subCategoryId)
      toast.add({ title: 'Updated', description: 'Property updated successfully', color: 'success' })
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to update property'
      toast.add({ title: 'Update failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  // Delete
  async function deleteProperty(subCategoryId: string, propertyId: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await propertyService.deleteProperty(subCategoryId, propertyId)
      await fetchProperties(subCategoryId)
      toast.add({ title: 'Deleted', description: 'Property deleted successfully', color: 'success' })
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to delete property'
      toast.add({ title: 'Delete failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  return {
    properties,
    selectedProperty,
    loading,
    error,
    fetchProperties,
    getPropertyById,
    createProperty,
    updateProperty,
    deleteProperty
  }
}
