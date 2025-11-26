import { assetNoteService } from '~/services/AssetNoteService'
import type {
  AssetNote,
  CreateAssetNotePayload,
  UpdateAssetNotePayload,
  AssetNoteDetailResponse,
  Pagination
} from '~/types/assetNote'
import type { ApiError } from '~/types/api'
import type { FetchError } from 'ofetch'

interface AssetNoteState {
  notes: Ref<AssetNote[]>
  selectedNote: Ref<AssetNote | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  pagination: Ref<{ pageIndex: number, pageSize: number, total: number }>
  apiPagination: Ref<Pagination | null>
  searchTerm: Ref<string>
  fetchNotes: (
    assetUuid: string,
    search?: string,
    page?: number,
    limit?: number
  ) => Promise<void>
  refreshNotes: (assetUuid: string) => Promise<void>
  getNoteById: (
    assetUuid: string,
    noteId: string
  ) => Promise<AssetNoteDetailResponse | null>
  createNote: (
    assetUuid: string,
    payload: CreateAssetNotePayload
  ) => Promise<void>
  updateNote: (
    assetUuid: string,
    noteId: string,
    payload: UpdateAssetNotePayload
  ) => Promise<void>
  deleteNote: (assetUuid: string, noteId: string) => Promise<void>
}

export function useAssetNote(): AssetNoteState {
  const notes = ref<AssetNote[]>([])
  const selectedNote = ref<AssetNote | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  const pagination = ref({ pageIndex: 0, pageSize: 10, total: 0 })
  const apiPagination = ref<Pagination | null>(null)
  const searchTerm = ref('')

  async function fetchNotes(
    assetUuid: string,
    search = '',
    page = 1,
    limit = 10
  ): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await assetNoteService.getNotes(assetUuid, {
        search,
        page,
        limit
      })
      notes.value = res.data
      apiPagination.value = res.meta?.pagination ?? null
      pagination.value = {
        pageIndex: (res.meta?.pagination?.currentPage ?? 1) - 1,
        pageSize: res.meta?.pagination?.itemsPerPage ?? limit,
        total: res.meta?.pagination?.totalItems ?? 0
      }
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch maintenances'
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function refreshNotes(assetUuid: string): Promise<void> {
    await fetchNotes(
      assetUuid,
      searchTerm.value,
      pagination.value.pageIndex + 1,
      pagination.value.pageSize
    )
  }

  async function getNoteById(
    assetUuid: string,
    noteId: string
  ): Promise<AssetNoteDetailResponse | null> {
    loading.value = true
    error.value = null
    selectedNote.value = null
    try {
      const res = await assetNoteService.getNoteById(
        assetUuid,
        noteId
      )
      selectedNote.value = res.data
      return res
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to fetch note detail'
      toast.add({ title: 'Fetch failed', description: error.value, color: 'error' })
      return null
    } finally {
      loading.value = false
    }
  }

  async function createNote(
    assetUuid: string,
    payload: CreateAssetNotePayload
  ): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await assetNoteService.createNote(assetUuid, payload)
      await refreshNotes(assetUuid)
      toast.add({
        title: 'Created',
        description: 'Note created successfully',
        color: 'success'
      })
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to create maintenance'
      toast.add({ title: 'Create failed', description: error.value, color: 'error' })
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateNote(
    assetUuid: string,
    noteId: string,
    payload: UpdateAssetNotePayload
  ): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await assetNoteService.updateNote(assetUuid, noteId, payload)
      await refreshNotes(assetUuid)
      toast.add({
        title: 'Updated',
        description: 'Note updated successfully',
        color: 'success'
      })
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to update maintenance'
      toast.add({ title: 'Update failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function deleteNote(
    assetUuid: string,
    noteId: string
  ): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await assetNoteService.deleteNote(assetUuid, noteId)
      await refreshNotes(assetUuid)
      toast.add({
        title: 'Deleted',
        description: 'Note deleted successfully',
        color: 'success'
      })
    } catch (err: unknown) {
      const fetchError = err as FetchError<ApiError>
      error.value = fetchError.data?.message ?? 'Failed to delete maintenance'
      toast.add({ title: 'Delete failed', description: error.value, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  watch(searchTerm, () => {
    pagination.value.pageIndex = 0
    fetchNotes('', searchTerm.value, 1, pagination.value.pageSize)
  })

  return {
    notes,
    selectedNote,
    loading,
    error,
    pagination,
    apiPagination,
    searchTerm,
    fetchNotes,
    refreshNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote
  }
}
