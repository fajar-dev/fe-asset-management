<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import { useLocation } from '~/composables/useLocation'
import { useRole } from '~/composables/useRole'

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const search = ref('')
const isDeleteModalOpen = ref(false)
const deletingLocationId = ref<string | null>(null)
const isUpdateModalOpen = ref(false)
const editingLocationId = ref<string | null>(null)

const { locations, apiPagination, pagination, loading, fetchLocations, deleteLocation } = useLocation()
const { isAdmin } = useRole()

function loadLocations(page = pagination.value.pageIndex + 1) {
  fetchLocations(search.value, page, pagination.value.pageSize)
}

onMounted(() => loadLocations())
watch(search, () => loadLocations(1))

function handlePageChange(newPage: number) {
  loadLocations(newPage)
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
  if (!deletingLocationId.value) return
  await deleteLocation(deletingLocationId.value)
  deletingLocationId.value = null
  loadLocations()
  isDeleteModalOpen.value = false
}

function getRowItems(row: Row<any>) {
  return [
    { type: 'label', label: 'Actions' },
    {
      label: 'Edit',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        editingLocationId.value = row.original.id
        isUpdateModalOpen.value = true
      }
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: () => {
        deletingLocationId.value = row.original.id
        isDeleteModalOpen.value = true
      }
    }
  ]
}

const columns: TableColumn<any>[] = [
  { accessorKey: 'name', header: 'Name' },
  {
    header: 'Branch',
    cell: ({ row }) => {
      const branch = row.original.branch
      return `${branch.branchId} - ${branch.name}`
    }
  },
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
  <UDashboardPanel id="locations">
    <template #header>
      <UDashboardNavbar title="Locations">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <RoleWrapper role="admin">
            <LocationAddModal @created="fetchLocations()" />
          </RoleWrapper>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <RoleWrapper role="admin">
        <ConfirmModal
          v-model:open="isDeleteModalOpen"
          title="Delete Location"
          description="Are you sure? This action cannot be undone."
          confirm-label="Delete"
          :on-confirm="confirmDelete"
        />
        <LocationUpdateModal
          :id="editingLocationId"
          v-model:open="isUpdateModalOpen"
          @updated="fetchLocations()"
        />
      </RoleWrapper>
      <div class="flex flex-wrap items-center justify-between gap-1.5 mb-2">
        <UInput
          v-model="search"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search locations..."
        />
      </div>

      <div class="overflow-x-auto">
        <UTable
          v-model:pagination="pagination"
          :data="locations"
          :columns="columns"
          :loading="loading"
          :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
          class="min-w-full"
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
