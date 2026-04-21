import type { ApiListResponse } from './api'

export interface Branch {
  branchId: string
  name: string
}

export type BranchResponse = ApiListResponse<Branch>
