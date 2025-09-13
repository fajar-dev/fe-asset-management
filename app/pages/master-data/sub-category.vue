<script setup lang="ts">
import { ref, onMounted, watch, computed, h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import { useSubCategory } from '~/composables/useSubCategory'

// komponen global
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

// state
const search = ref('')
const isDeleteModalOpen = ref(false)
const deletingSubCategoryId = ref<string | null>(null)
const isUpdateModalOpen = ref(false)
const editingSubCategoryId = ref<string | null>(null)

// composable
const { subCategories, apiPagination, pagination, loading, fetchSubCategories, deleteSubCategory } = useSubCategory()

// fetch wrapper
function loadSubCategories(page = pagination.value.pageIndex + 1) {
  fetchSubCategories(search.value, page, pagination.value.pageSize)
}

// lifecycle
onMounted(() => loadSubCategories())
watch(search, () => loadSubCategories(1))

// pagination
function handlePageChange(newPage: number) {
  loadSubCategories(newPage)
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
  if (!deletingSubCategoryId.value) return
  await deleteSubCategory(deletingSubCategoryId.value)
  deletingSubCategoryId.value = null
  loadSubCategories()
  isDeleteModalOpen.value = false
}

function getRowItems(row: Row<any>) {
  return [
    { type: 'label', label: 'Actions' },
    {
      label: 'Edit',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        editingSubCategoryId.value = row.original.id
        isUpdateModalOpen.value = true
      }
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: () => {
        deletingSubCategoryId.value = row.original.id
        isDeleteModalOpen.value = true
      }
    }
  ]
}

// table columns
const columns: TableColumn<any>[] = [
  { accessorKey: 'name', header: 'Name' },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => row.original.category?.name ?? '-'
  },
  {
    accessorKey: 'assetProperties',
    header: 'Properties',
    cell: ({ row }) => row.original.assetProperties.map((p: any) => p.name).join(', ')
  },
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
  <UDashboardPanel id="sub-categories">
    <!-- Header -->
    <template #header>
      <UDashboardNavbar title="Sub Categories">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <SubCategoryAddModal @created="fetchSubCategories()" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <ConfirmModal
        v-model:open="isDeleteModalOpen"
        title="Delete Sub Category"
        description="Are you sure? This action cannot be undone."
        confirm-label="Delete"
        :on-confirm="confirmDelete"
      />

      <SubCategoryUpdateModal
        v-if="editingSubCategoryId"
        :id="editingSubCategoryId"
        v-model="isUpdateModalOpen"
        @updated="fetchSubCategories()"
      />

      <div class="flex flex-wrap items-center justify-between gap-1.5 mb-2">
        <UInput
          v-model="search"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search sub categories..."
        />
      </div>

      <UTable
        v-model:pagination="pagination"
        :data="subCategories"
        :columns="columns"
        :loading="loading"
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
        class="shrink-0"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default'
        }"
      />

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
          Showing {{ showingFrom }} to {{ showingTo }} of {{ apiPagination.totalItems }} results
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
