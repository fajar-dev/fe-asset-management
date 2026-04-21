import { feedbackService } from '~/services/FeedbackService'
import type {
  Feedback,
  FeedbackRaw,
  CreateFeedbackPayload,
  Pagination,
} from '~/types/feedback'
import { extractErrorMessage } from '~/utils/errorHandler'

interface FeedbackState {
  feedbacks: Ref<Feedback[]>
  pagination: Ref<{ pageIndex: number, pageSize: number }>
  apiPagination: Ref<any>
  loading: Ref<boolean>
  error: Ref<string | null>
  fetchFeedbacks: (search?: string, page?: number, limit?: number, byUser?: boolean) => Promise<void>
  refreshFeedbacks: () => Promise<void>
  createFeedback: (payload: CreateFeedbackPayload) => Promise<Feedback | undefined>
}

export function useFeedback(): FeedbackState {
  const feedbacks = ref<Feedback[]>([])
  const apiPagination = ref<Pagination | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  const pagination = ref({ pageIndex: 0, pageSize: 10 })

  async function fetchFeedbacks(search = '', page = 1, limit = 10, byUser = true): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await feedbackService.getFeedbacks({ search, page, limit, byUser })
      feedbacks.value = res.data.map((raw: FeedbackRaw): Feedback => ({
        type: raw.category,
        description: raw.message,
        createdAt: raw.timestamp,
        imageUrls: raw.imageUrls,
        reply: raw.reply,
        status: raw.status,
        email: raw.email,
        url: raw.url
      }))
      apiPagination.value = res.meta?.pagination ?? null
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Failed to fetch feedbacks')
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function refreshFeedbacks(): Promise<void> {
    await fetchFeedbacks('', pagination.value.pageIndex + 1, pagination.value.pageSize)
  }

  async function createFeedback(payload: CreateFeedbackPayload): Promise<Feedback | undefined> {
    loading.value = true
    error.value = null
    try {
      const res = await feedbackService.createFeedback(payload)
      await refreshFeedbacks()
      toast.add({ title: 'Created', description: 'Feedback created successfully', color: 'success' })
      return res
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Failed to create feedback')
      toast.add({ title: 'Create failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  return {
    feedbacks,
    pagination,
    apiPagination,
    loading,
    error,
    fetchFeedbacks,
    refreshFeedbacks,
    createFeedback,
  }
}
