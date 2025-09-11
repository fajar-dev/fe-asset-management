<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { Row } from '@tanstack/table-core'
import { useCategory } from '~/composables/useCategory'

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const toast = useToast()

const search = ref('')

const { categories, apiPagination, pagination, loading, fetchCategories, deleteCategory }
  = useCategory()

onMounted(() => {
  fetchCategories(search.value, pagination.value.pageIndex + 1, pagination.value.pageSize)
})

watch(search, () => {
  pagination.value.pageIndex = 0
  fetchCategories(search.value, 1, pagination.value.pageSize)
})

function handlePageChange(newPage: number) {
  fetchCategories(search.value, newPage, pagination.value.pageSize)
}

function getRowItems(row: Row<any>) {
  return [
    { type: 'label', label: 'Actions' },
    { label: 'Edit', icon: 'i-lucide-pencil' },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        deleteCategory(row.original.id)
        toast.add({
          title: 'Category deleted',
          description: 'The category has been deleted.'
        })
        fetchCategories(search.value, pagination.value.pageIndex + 1, pagination.value.pageSize)
      }
    }
  ]
}

const columns: TableColumn<any>[] = [
  { accessorKey: 'name', header: 'Name' },
  {
    accessorKey: 'hasLocation',
    header: 'Has Location',
    cell: ({ row }) => (row.original.hasLocation ? 'Yes' : 'No')
  },
  {
    accessorKey: 'hasMaintenance',
    header: 'Has Maintenance',
    cell: ({ row }) => (row.original.hasMaintenance ? 'Yes' : 'No')
  },
  {
    accessorKey: 'hasHolder',
    header: 'Has Holder',
    cell: ({ row }) => (row.original.hasHolder ? 'Yes' : 'No')
  },
  {
    id: 'actions',
    cell: ({ row }) => {
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
  <UDashboardPanel id="categories">
    <template #header>
      <UDashboardNavbar title="Categories">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <AssetAddModal />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Search -->
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="search"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search categories..."
        />
      </div>

      <!-- Table -->
      <UTable
        ref="table"
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
          td: 'border-b border-default'
        }"
      />

      <!-- Pagination -->
      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="flex items-center gap-1.5">
          <UPagination
            v-if="apiPagination"
            :default-page="pagination.pageIndex + 1"
            :items-per-page="pagination.pageSize"
            :total="apiPagination.totalItems"
            @update:page="handlePageChange"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
