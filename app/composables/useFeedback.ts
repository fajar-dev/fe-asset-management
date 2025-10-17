import { feedbackService } from '~/services/FeedbackService'
import type {
  Feedback,
  CreateFeedbackPayload,
  FeedbackDetailResponse,
  Pagination,
  UpdateFeedbackPayload
} from '~/types/feedback'
import type { FetchError } from 'ofetch'
import type { ApiError } from '~/types/api'

interface FeedbackState {
  feedbacks: Ref<Feedback[]>
  selectedFeedback: Ref<Feedback | null>
  pagination: Ref<{ pageIndex: number, pageSize: number }>
  apiPagination: Ref<any>
  loading: Ref<boolean>
  error: Ref<string | null>
  fetchFeedbacks: (search?: string, page?: number, limit?: number, byUser?: boolean) => Promise<void>
  refreshFeedbacks: () => Promise<void>
  getFeedbackById: (id: string) => Promise<FeedbackDetailResponse | null>
  createFeedback: (payload: CreateFeedbackPayload) => Promise<Feedback | undefined>
  updateFeedback: (id: string, payload: UpdateFeedbackPayload) => Promise<Feedback | undefined>
}

export const useFeedback = (): FeedbackState => {
  const feedbacks = ref<Feedback[]>([])
  const selectedFeedback = ref<Feedback | null>(null)
  const apiPagination = ref<Pagination | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  const pagination = ref({ pageIndex: 0, pageSize: 10 })

  // 🟢 Tambahkan byUser (default: true)
  async function fetchFeedbacks(search = '', page = 1, limit = 10, byUser = true): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await feedbackService.getFeedbacks(search, page, limit, byUser)
      feedbacks.value = res.data
      apiPagination.value = res.meta?.pagination ?? null
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch feedbacks'
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
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to create feedback'
      toast.add({ title: 'Create failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function getFeedbackById(id: string): Promise<FeedbackDetailResponse | null> {
    loading.value = true
    error.value = null
    selectedFeedback.value = null
    try {
      const res = await feedbackService.getFeedbackById(id)
      selectedFeedback.value = res.data
      return res
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch feedback detail'
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateFeedback(id: string, payload: UpdateFeedbackPayload): Promise<Feedback | undefined> {
    loading.value = true
    error.value = null
    try {
      const res = await feedbackService.updateFeedback(id, payload)
      await refreshFeedbacks()
      toast.add({ title: 'Updated', description: 'Feedback updated successfully', color: 'success' })
      return res
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to update feedback'
      toast.add({ title: 'Update failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  return {
    feedbacks,
    selectedFeedback,
    pagination,
    apiPagination,
    loading,
    error,
    fetchFeedbacks,
    refreshFeedbacks,
    getFeedbackById,
    createFeedback,
    updateFeedback
  }
}
