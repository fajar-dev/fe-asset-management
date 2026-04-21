import { BaseService } from '~/services/base'
import type { BookResponse, LoanListResponse } from '~/types/book'

export class BookService extends BaseService {
  private basePath = '/v2/book'

  async getBookByCode(code: string): Promise<BookResponse> {
    return await this.api<BookResponse>(`${this.basePath}/${code}`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  async assignLoan(assetId: string, image: File): Promise<any> {
    const formData = new FormData()
    formData.append('assetId', assetId)
    formData.append('image', image)
    return await this.api<any>(`${this.basePath}/loan/assign`, {
      method: 'POST',
      body: formData,
      headers: this.getAuthHeader()
    })
  }

  async getUserLoans(): Promise<LoanListResponse> {
    return await this.api<LoanListResponse>(`${this.basePath}/loan/by-user`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  async returnLoan(assetHolderId: string, purpose: string, image: File): Promise<any> {
    const formData = new FormData()
    formData.append('assetHolderId', assetHolderId)
    formData.append('purpose', purpose)
    formData.append('image', image)
    return await this.api<any>(`${this.basePath}/loan/return`, {
      method: 'POST',
      body: formData,
      headers: this.getAuthHeader()
    })
  }
}

export const bookService = new BookService()
