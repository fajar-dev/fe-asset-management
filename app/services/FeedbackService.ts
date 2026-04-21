import { BaseService } from '~/services/base'
import type {
  Feedback,
  FeedbackDetailResponse,
  FeedbackFilterOptions,
  FeedbackResponse,
  CreateFeedbackPayload,
  UpdateFeedbackPayload
} from '~/types/feedback'

export class FeedbackService extends BaseService {
  private basePath = '/feedback'

  async getFeedbacks(options: FeedbackFilterOptions = {}): Promise<FeedbackResponse> {
    const { search = '', page = 1, limit = 10, byUser = true } = options
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
    formData.append('url', payload.url)
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
