export interface BookData {
  id: string
  code: string
  name: string
  imageUrl: string
  imagePath: string
  description: string
  brand: string
  model: string
  user: string
  price: string
  purchaseDate: string
  status: string
  isLendable: boolean
  subCategory: {
    id: string
    name: string
  }
}

import type { ApiListResponse, ApiDetailResponse } from './api'

export type BookResponse = ApiDetailResponse<BookData>

export interface LoanData {
  id: string
  purpose: string
  assignedAt: string
  returnedAt: string | null
  attachmentPaths: string[]
  attachmentUrls: string[]
  isRequest: boolean
  asset: BookData
}

export type LoanListResponse = ApiListResponse<LoanData>
