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

export interface BookResponse {
  success: boolean
  statusCode: number
  message: string
  data: BookData
}

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

export interface LoanListResponse {
  success: boolean
  statusCode: number
  message: string
  data: LoanData[]
}
