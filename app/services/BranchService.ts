import type { BranchResponse } from '~/types/branch'

export class BranchService {
  private basePath = '/v1/branch'

  private get api() {
    const { $api } = useNuxtApp()
    return $api
  }

  private getAuthHeader() {
    const token = localStorage.getItem('accessToken') || ''
    return { Authorization: `Bearer ${token}` }
  }

  async getAllCategories(search = ''): Promise<BranchResponse> {
    return await this.api<BranchResponse>(this.basePath, {
      method: 'GET',
      params: { search },
      headers: this.getAuthHeader()
    })
  }
}

export const branchService = new BranchService()
