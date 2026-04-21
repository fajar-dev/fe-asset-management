import { BaseService } from '~/services/base'
import type { BranchResponse } from '~/types/branch'

export class BranchService extends BaseService {
  private basePath = '/v1/branch'

  async getAllBranches(search = ''): Promise<BranchResponse> {
    return await this.api<BranchResponse>(this.basePath, {
      method: 'GET',
      params: { search },
      headers: this.getAuthHeader()
    })
  }
}

export const branchService = new BranchService()
