import { apiClient } from '~/services/apiClient'
import type {
  Property,
  PropertyDetailResponse,
  PropertyResponse,
  CreatePropertyPayload,
  UpdatePropertyPayload
} from '~/types/property'

export class PropertyService {
  private basePath = '/v1/sub-category'

  private getAuthHeader() {
    const token = localStorage.getItem('accessToken') || ''
    return { Authorization: `Bearer ${token}` }
  }

  // Fetch paginate properties with pagination
  async getProperties(
    subCategoryId: string,
    search = '',
    page = 1,
    limit = 10
  ): Promise<PropertyResponse> {
    return await apiClient<PropertyResponse>(`${this.basePath}/${subCategoryId}/property`, {
      method: 'GET',
      params: { search, page, limit },
      headers: this.getAuthHeader()
    })
  }

  // Fetch all properties (without pagination, optional all flag)
  async getAllProperties(subCategoryId: string, all = true): Promise<PropertyResponse> {
    return await apiClient<PropertyResponse>(`${this.basePath}/${subCategoryId}/property`, {
      method: 'GET',
      params: { all },
      headers: this.getAuthHeader()
    })
  }

  // Fetch single property by ID
  async getPropertyById(subCategoryId: string, propertyId: string): Promise<PropertyDetailResponse> {
    return await apiClient<PropertyDetailResponse>(`${this.basePath}/${subCategoryId}/property/${propertyId}`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  // Create a new property
  async createProperty(subCategoryId: string, payload: CreatePropertyPayload): Promise<Property> {
    return await apiClient<Property>(`${this.basePath}/${subCategoryId}/property`, {
      method: 'POST',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  // Update existing property
  async updateProperty(
    subCategoryId: string,
    propertyId: string,
    payload: UpdatePropertyPayload
  ): Promise<void> {
    await apiClient(`${this.basePath}/${subCategoryId}/property/${propertyId}`, {
      method: 'PUT',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  // Delete a property
  async deleteProperty(subCategoryId: string, propertyId: string): Promise<void> {
    await apiClient(`${this.basePath}/${subCategoryId}/property/${propertyId}`, {
      method: 'DELETE',
      headers: this.getAuthHeader()
    })
  }
}

export const propertyService = new PropertyService()
