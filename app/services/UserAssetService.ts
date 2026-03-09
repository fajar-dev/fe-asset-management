import type { UserAssetResponse } from '~/types/userAsset'

export class UserAssetService {
  private basePath = '/v1/user/my-assets'

  private get api() {
    const { $api } = useNuxtApp()
    return $api
  }

  private getAuthHeader() {
    const token = localStorage.getItem('accessToken') || ''
    return { Authorization: `Bearer ${token}` }
  }

  async getActiveAssets(page = 1, limit = 10): Promise<UserAssetResponse> {
    return await this.api<UserAssetResponse>(`${this.basePath}/active`, {
      method: 'GET',
      params: { page, limit },
      headers: this.getAuthHeader()
    })
  }

  async getHistoryAssets(page = 1, limit = 10): Promise<UserAssetResponse> {
    return await this.api<UserAssetResponse>(`${this.basePath}/history`, {
      method: 'GET',
      params: { page, limit },
      headers: this.getAuthHeader()
    })
  }

  async returnRequest(assetUuid: string, uuid: string, payload: { image: File }): Promise<void> {
    const formData = new FormData()
    formData.append('image', payload.image)

    return await this.api(`/v1/asset/${assetUuid}/holder/${uuid}/return-request`, {
      method: 'POST',
      body: formData as any,
      headers: this.getAuthHeader()
    })
  }
}

export const userAssetService = new UserAssetService()
