import type { Asset } from './asset'
import type { Pagination } from './api'

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

export interface UserAssetResponse {
  success: boolean
  statusCode: number
  message: string
  data: UserAsset[]
  meta: {
    pagination: Pagination
  }
}
