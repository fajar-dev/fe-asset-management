<script setup lang="ts">
import { h, ref, computed, onMounted, watch } from 'vue'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import { useFeedback } from '~/composables/useFeedback'
import { FeedbackTypeColor, FeedbackStatusColor, type Feedback, type FeedbackStatus, type FeedbackType } from '~/types/feedback'

const search = ref('')
const UBadge = resolveComponent('UBadge')
const { feedbacks, apiPagination, pagination, loading, fetchFeedbacks } = useFeedback()

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

const columns = [
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
  }
]
</script>

<template>
  <UDashboardPanel id="feedbacks">
    <template #header>
      <UDashboardNavbar title="My Feedback">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5 mb-2">
        <UInput
          v-model="search"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search feedbacks..."
        />
      </div>

      <div class="overflow-x-auto">
        <UTable
          v-model:pagination="pagination"
          :data="feedbacks"
          :columns="columns"
          :loading="loading"
          :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
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
    </template>
  </UDashboardPanel>
</template>
