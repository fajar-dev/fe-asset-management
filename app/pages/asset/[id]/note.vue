<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/table-core'
import { useAsset } from '~/composables/useAsset'
import { useAssetNote } from '~/composables/useAssetNote'
import { useRole } from '~/composables/useRole'

// global komponen
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

// router
const router = useRouter()
const route = useRoute()
const assetId = route.params.id as string

const assetDetail = ref<any>(null)
const loading = ref(false)

// composable asset
const { getAssetById } = useAsset()
const { isAdmin } = useRole()

const {
  notes,
  loading: noteLoading,
  fetchNotes,
  deleteNote,
  pagination,
  apiPagination
} = useAssetNote()

const isDeleteModalOpen = ref(false)
const deletingNoteId = ref<string | null>(null)
const isUpdateModalOpen = ref(false)
const editingNoteId = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  const res = await getAssetById(assetId)
  if (res) {
    assetDetail.value = res.data
    await loadNotes()
  } else {
    await router.push('/asset')
  }
  loading.value = false
})

function loadNotes(page = pagination.value.pageIndex + 1) {
  fetchNotes(assetId, undefined, page, pagination.value.pageSize)
}

function handlePageChange(newPage: number) {
  loadNotes(newPage)
}

const showingFrom = computed(() =>
  apiPagination.value
    ? (apiPagination.value.currentPage - 1) * apiPagination.value.itemsPerPage + 1
    : 0
)

const showingTo = computed(() =>
  apiPagination.value
    ? Math.min(apiPagination.value.currentPage * apiPagination.value.itemsPerPage, apiPagination.value.totalItems)
    : 0
)

async function confirmDelete() {
  if (!deletingNoteId.value) return
  await deleteNote(assetId, deletingNoteId.value)
  deletingNoteId.value = null
  loadNotes()
  isDeleteModalOpen.value = false
}

function getRowItems(row: Row<any>) {
  return [
    { type: 'label', label: 'Actions' },
    {
      label: 'Edit',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        editingNoteId.value = row.original.id
        isUpdateModalOpen.value = true
      }
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: () => {
        deletingNoteId.value = row.original.id
        isDeleteModalOpen.value = true
      }
    }
  ]
}

// columns
const columns: TableColumn<any>[] = [
  { accessorKey: 'occuredAt', header: 'Date' },
  { accessorKey: 'note', header: 'Note' },
  {
    id: 'actions',
    cell: ({ row }) => {
      if (!isAdmin.value) return null
      return h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          { content: { align: 'end' }, items: getRowItems(row) },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto'
            })
        )
      )
    }
  }
]
</script>

<template>
  <UDashboardPanel id="detail">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <RoleWrapper role="admin">
            <AssetNoteAddModal
              :asset-id="assetId"
              @created="loadNotes()"
            />
          </RoleWrapper>
        </template>

        <template #title>
          <AssetDetailHeader
            :asset-detail="assetDetail"
            :loading="loading"
          />
        </template>
      </UDashboardNavbar>

      <AssetDetailTabs
        :asset-id="assetId"
        :asset-detail="assetDetail"
        :loading="loading"
      />
    </template>

    <template #body>
      <!-- Modal Delete & Update -->
      <RoleWrapper role="admin">
        <ConfirmModal
          v-model:open="isDeleteModalOpen"
          title="Delete Note"
          description="Are you sure? This action cannot be undone."
          confirm-label="Delete"
          :on-confirm="confirmDelete"
        />
        <AssetNoteUpdateModal
          v-if="editingNoteId"
          v-model:open="isUpdateModalOpen"
          :asset-id="assetId"
          :note-id="editingNoteId"
          @updated="loadNotes()"
        />
      </RoleWrapper>

      <div class="overflow-x-auto">
        <UTable
          v-model:pagination="pagination"
          :data="notes"
          :columns="columns"
          :loading="noteLoading"
          class="shrink-0"
          :ui="{
            base: 'table-fixed border-separate border-spacing-0',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r whitespace-nowrap',
            td: 'border-b border-default whitespace-nowrap'
          }"
        />
      </div>

      <div
        class="flex flex-col md:flex-row items-center justify-center md:justify-between gap-3 border-t border-default pt-4 mt-auto"
      >
        <UPagination
          v-if="apiPagination"
          :default-page="pagination.pageIndex + 1"
          :items-per-page="pagination.pageSize"
          :total="apiPagination.totalItems"
          @update:page="handlePageChange"
        />

        <div v-if="apiPagination" class="text-sm text-muted mb-2">
          Showing {{ showingFrom }} to {{ showingTo }} of
          {{ apiPagination.totalItems }} results
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
