<script setup lang="ts">
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import { useFeedback } from '~/composables/useFeedback'
import {
  FeedbackTypeColor,
  FeedbackStatusColor,
  type Feedback,
  type FeedbackStatus,
  type FeedbackType
} from '~/types/feedback'

const search = ref('')
const isUpdateModalOpen = ref(false)
const editingFeedbackId = ref<string | null>(null)
const expanded = ref<Record<number | string, boolean>>({})
const { feedbacks, apiPagination, pagination, loading, fetchFeedbacks } = useFeedback()
const { isAdmin } = useRole()
const UDropdownMenu = resolveComponent('UDropdownMenu')

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UInput = resolveComponent('UInput')
const UPagination = resolveComponent('UPagination')
const UIcon = resolveComponent('UIcon')
const UAvatar = resolveComponent('UAvatar')

const previewImage = ref<string | null>(null)
function openImageModal(url: string) {
  previewImage.value = url
}
function closeImageModal() {
  previewImage.value = null
}

function loadFeedbacks(page = pagination.value.pageIndex + 1) {
  fetchFeedbacks(search.value, page, pagination.value.pageSize)
}

onMounted(() => loadFeedbacks())
watch(search, () => loadFeedbacks(1))

function handlePageChange(newPage: number) {
  loadFeedbacks(newPage)
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

function getRowItems(row: Row<any>) {
  return [
    { type: 'label', label: 'Actions' },
    {
      label: 'Reply',
      icon: 'i-lucide-reply',
      onSelect: () => {
        editingFeedbackId.value = row.original.id
        isUpdateModalOpen.value = true
      }
    }
  ]
}

const columns = [
  {
    id: 'expand',
    cell: ({ row }: { row: Row<Feedback> }) =>
      h(UButton, {
        'color': 'neutral',
        'variant': 'ghost',
        'icon': 'i-lucide-chevron-right',
        'square': true,
        'aria-label': 'Expand',
        'ui': {
          leadingIcon: [
            'transition-transform',
            row.getIsExpanded() ? 'rotate-90 duration-200' : 'duration-200'
          ]
        },
        'onClick': () => row.toggleExpanded()
      })
  },
  {
    accessorKey: 'user',
    header: 'User',
    cell: ({ row }: { row: Row<Feedback> }) => {
      const holder = row.original.user
      return h('div', { class: 'flex items-center gap-3' }, [
        h(UAvatar, {
          src: holder.avatar,
          size: 'lg'
        }),
        h('div', undefined, [
          h('p', { class: 'font-medium text-highlighted text-xs' }, holder.name),
          h('p', { class: 'text-xs' }, holder.employeeId)
        ])
      ])
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }: { row: Row<Feedback> }) => {
      const date = new Date(row.original.createdAt)
      const gmt7 = new Date(date.getTime() + 7 * 60 * 60 * 1000)
      return gmt7.toISOString().replace('T', ' ').substring(0, 19)
    }
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }: { row: Row<Feedback> }) => {
      const type = row.original.type as FeedbackType
      return h(UBadge, {
        color: FeedbackTypeColor[type],
        variant: 'soft',
        size: 'sm'
      }, () => type)
    }
  },
  { accessorKey: 'description', header: 'Description' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }: { row: Row<Feedback> }) => {
      const status = row.original.status as FeedbackStatus
      if (!status) return null
      return h(UBadge, {
        color: FeedbackStatusColor[status],
        variant: 'outline',
        size: 'sm'
      }, () => status)
    }
  },
  {
    id: 'actions',
    cell: ({ row }: { row: Row<Feedback> }) => {
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
  <UDashboardPanel id="feedbacks">
    <template #header>
      <UDashboardNavbar title="List Feedback">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <RoleWrapper role="admin">
        <FeedbackReplyModal
          :id="editingFeedbackId"
          v-model:open="isUpdateModalOpen"
          @updated="fetchFeedbacks()"
        />
      </RoleWrapper>
      <div class="flex flex-wrap items-center justify-between gap-1.5 mb-2">
        <UInput
          v-model="search"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search feedbacks..."
        />
      </div>

      <UTable
        v-model:pagination="pagination"
        v-model:expanded="expanded"
        :data="feedbacks"
        :columns="columns"
        :loading="loading"
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          tr: 'data-[expanded=true]:bg-elevated/30'
        }"
      >
        <template #expanded="{ row }">
          <div class="p-6 bg-muted border-t border-default">
            <div class="mb-4">
              <div class="flex items-start gap-2 mb-2">
                <UIcon name="i-lucide-message-square" class="w-4 h-4 text-gray-500 mt-0.5" />
                <div class="flex-1">
                  <p class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Reply
                  </p>
                  <div v-if="row.original.reply" class="space-y-2">
                    <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <p class="text-sm text-gray-800 dark:text-gray-200">
                        {{ row.original.reply }}
                      </p>
                    </div>
                    <div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <UIcon name="i-lucide-clock" class="w-3.5 h-3.5" />
                      <span>Updated: {{ new Date(row.original.updatedAt).toLocaleString() }}</span>
                    </div>
                  </div>
                  <div v-else class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-md text-sm">
                    <UIcon name="i-lucide-alert-circle" class="w-4 h-4" />
                    <span>No reply yet</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="row.original.imageUrls && row.original.imageUrls.length" class="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div class="flex items-center gap-2 mb-3">
                <UIcon name="i-lucide-image" class="w-4 h-4 text-gray-500" />
                <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Attachments ({{ row.original.imageUrls.length }})
                </p>
              </div>
              <div class="flex flex-wrap gap-4">
                <div
                  v-for="(img, index) in row.original.imageUrls"
                  :key="index"
                  class="group relative w-24 h-24 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 transition-colors cursor-pointer"
                  @click="openImageModal(img)"
                >
                  <img
                    :src="img"
                    :alt="`Feedback image ${index + 1}`"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  >
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <UIcon name="i-lucide-maximize-2" class="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </UTable>

      <div class="flex flex-col md:flex-row items-center justify-center md:justify-between gap-3 border-t border-default pt-4 mt-auto">
        <UPagination
          v-if="apiPagination"
          :default-page="pagination.pageIndex + 1"
          :items-per-page="pagination.pageSize"
          :total="apiPagination.totalItems"
          @update:page="handlePageChange"
        />
        <div v-if="apiPagination" class="text-sm text-muted mb-2">
          Showing {{ showingFrom }} to {{ showingTo }} of {{ apiPagination.totalItems }} results
        </div>
      </div>

      <div
        v-if="previewImage"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
        @click.self="closeImageModal"
      >
        <img :src="previewImage" class="max-h-[90%] max-w-[90%] rounded-lg shadow-lg">
        <button class="absolute top-5 right-5 text-white text-2xl" @click="closeImageModal">
          &times;
        </button>
      </div>
    </template>
  </UDashboardPanel>
</template>
