import type { Location, LocationDetailResponse, LocationResponse, CreateLocationPayload, UpdateLocationPayload } from '~/types/location'

export class LocationService {
  private basePath = '/v1/location'

  private get api() {
    const { $api } = useNuxtApp()
    return $api
  }

  private getAuthHeader() {
    const token = localStorage.getItem('accessToken') || ''
    return { Authorization: `Bearer ${token}` }
  }

  async getLocations(search = '', page = 1, limit = 10): Promise<LocationResponse> {
    return await this.api<LocationResponse>(this.basePath, {
      method: 'GET',
      params: { search, page, limit },
      headers: this.getAuthHeader()
    })
  }

  async getAllLocations(all = true): Promise<LocationResponse> {
    return await this.api<LocationResponse>(this.basePath, {
      method: 'GET',
      params: { all },
      headers: this.getAuthHeader()
    })
  }

  async getLocationById(id: string): Promise<LocationDetailResponse> {
    return await this.api<LocationDetailResponse>(`${this.basePath}/${id}`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  async createLocation(payload: CreateLocationPayload): Promise<Location> {
    return await this.api<Location>(this.basePath, {
      method: 'POST',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  async updateLocation(id: string, payload: UpdateLocationPayload): Promise<void> {
    await this.api(`${this.basePath}/${id}`, {
      method: 'PUT',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  async deleteLocation(id: string): Promise<void> {
    await this.api(`${this.basePath}/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeader()
    })
  }
}

export const locationService = new LocationService()
