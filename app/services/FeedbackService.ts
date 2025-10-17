import type {
  Feedback,
  FeedbackDetailResponse,
  FeedbackResponse,
  CreateFeedbackPayload,
  UpdateFeedbackPayload
} from '~/types/feedback'

export class FeedbackService {
  private basePath = '/feedback'

  private get api() {
    const { $api } = useNuxtApp()
    return $api
  }

  private getAuthHeader() {
    const token = localStorage.getItem('accessToken') || ''
    return { Authorization: `Bearer ${token}` }
  }

  /**
   * Get paginated feedbacks (by user or all)
   * @param search optional search keyword
   * @param page page number (default: 1)
   * @param limit items per page (default: 10)
   * @param byUser filter feedback by current user (default: true)
   */
  async getFeedbacks(
    search = '',
    page = 1,
    limit = 10,
    byUser = true
  ): Promise<FeedbackResponse> {
    return await this.api<FeedbackResponse>(this.basePath, {
      method: 'GET',
      params: { search, page, limit, 'by-user': byUser },
      headers: this.getAuthHeader()
    })
  }

  async getFeedbackById(id: string): Promise<FeedbackDetailResponse> {
    return await this.api<FeedbackDetailResponse>(`${this.basePath}/${id}`, {
      method: 'GET',
      headers: this.getAuthHeader()
    })
  }

  async updateFeedback(id: string, payload: UpdateFeedbackPayload): Promise<Feedback> {
    return await this.api<Feedback>(`${this.basePath}/${id}`, {
      method: 'PUT',
      body: payload,
      headers: this.getAuthHeader()
    })
  }

  async createFeedback(payload: CreateFeedbackPayload): Promise<Feedback> {
    const formData = new FormData()
    formData.append('type', payload.type)
    formData.append('description', payload.description)
    payload.images?.forEach(file => formData.append('images', file))

    return await this.api<Feedback>(this.basePath, {
      method: 'POST',
      body: formData,
      headers: this.getAuthHeader()
    })
  }
}

export const feedbackService = new FeedbackService()
