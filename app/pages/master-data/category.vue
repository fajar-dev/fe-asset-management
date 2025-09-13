<script setup lang="ts">
import { ref, onMounted, watch, computed, h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import { useCategory } from '~/composables/useCategory'

// komponen global
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

// state
const search = ref('')
const isDeleteModalOpen = ref(false)
const deletingCategoryId = ref<string | null>(null)
const isUpdateModalOpen = ref(false)
const editingCategoryId = ref<string | null>(null)

// composable
const { categories, apiPagination, pagination, loading, fetchCategories, deleteCategory } = useCategory()

// fetch wrapper
function loadCategories(page = pagination.value.pageIndex + 1) {
  fetchCategories(search.value, page, pagination.value.pageSize)
}

// lifecycle
onMounted(() => loadCategories())
watch(search, () => loadCategories(1))

// pagination
function handlePageChange(newPage: number) {
  loadCategories(newPage)
}

// info showing
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

// actions
async function confirmDelete() {
  if (!deletingCategoryId.value) return
  await deleteCategory(deletingCategoryId.value)
  deletingCategoryId.value = null
  loadCategories()
  isDeleteModalOpen.value = false
}

function getRowItems(row: Row<any>) {
  return [
    { type: 'label', label: 'Actions' },
    {
      label: 'Edit',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        editingCategoryId.value = row.original.id
        isUpdateModalOpen.value = true
      }
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: () => {
        deletingCategoryId.value = row.original.id
        isDeleteModalOpen.value = true
      }
    }
  ]
}

// table columns
const yesNo = (val: boolean) => (val ? 'Yes' : 'No')

const columns: TableColumn<any>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'hasLocation', header: 'Has Location', cell: ({ row }) => yesNo(row.original.hasLocation) },
  { accessorKey: 'hasMaintenance', header: 'Has Maintenance', cell: ({ row }) => yesNo(row.original.hasMaintenance) },
  { accessorKey: 'hasHolder', header: 'Has Holder', cell: ({ row }) => yesNo(row.original.hasHolder) },
  {
    id: 'actions',
    cell: ({ row }) =>
      h(
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
]
</script>

<template>
  <UDashboardPanel id="categories">
    <!-- Header -->
    <template #header>
      <UDashboardNavbar title="Categories">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <CategoryAddModal @created="fetchCategories()" />
        </template>
      </UDashboardNavbar>
    </template>

    <!-- Body -->
    <template #body>
      <!-- Confirm Delete Modal -->
      <ConfirmModal
        v-model:open="isDeleteModalOpen"
        title="Delete Category"
        description="Are you sure? This action cannot be undone."
        confirm-label="Delete"
        :on-confirm="confirmDelete"
      />

      <!-- Update Modal -->
      <CategoryUpdateModal
        :id="editingCategoryId"
        v-model:open="isUpdateModalOpen"
        @updated="fetchCategories()"
      />

      <!-- Search -->
      <div class="flex flex-wrap items-center justify-between gap-1.5 mb-2">
        <UInput
          v-model="search"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search categories..."
        />
      </div>

      <!-- Table -->
      <UTable
        v-model:pagination="pagination"
        :data="categories"
        :columns="columns"
        :loading="loading"
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
        class="shrink-0"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          tr: 'data-[expanded=true]:bg-elevated/50'
        }"
      />

      <!-- Pagination & Info -->
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
