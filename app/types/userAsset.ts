import type { Asset } from './asset'
import type { ApiListResponse, Pagination } from './api'

export interface UserAsset {
  id: string
  purpose: string
  assignedAt: string
  returnedAt: string | null
  attachmentPaths: string[] | null
  attachmentUrls: string[] | null
  isRequest: boolean
  asset: Partial<Asset>
}

export type UserAssetResponse = ApiListResponse<UserAsset>
