export class BaseService {
  protected get api() {
    const { $api } = useNuxtApp()
    return $api
  }

  protected getAuthHeader(): { Authorization: string } {
    const token = localStorage.getItem('accessToken') || ''
    return { Authorization: `Bearer ${token}` }
  }
}
