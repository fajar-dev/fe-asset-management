<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { NuxtLink } from '#components'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import { useAsset } from '~/composables/useAsset'
import { useCategory } from '~/composables/useCategory'
import { useEmployee } from '~/composables/useEmployee'
import { useLocation } from '~/composables/useLocation'

// global components
const UAvatar = resolveComponent('UAvatar')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UBadge = resolveComponent('UBadge')
const ConfirmModal = resolveComponent('ConfirmModal')
const AssetAddModal = resolveComponent('AssetAddModal')
const AssetUpdateModal = resolveComponent('AssetUpdateModal')

// state
const search = ref('')
const isDeleteModalOpen = ref(false)
const deletingAssetId = ref<string | null>(null)
const isUpdateModalOpen = ref(false)
const editingAssetId = ref<string | null>(null)

// expanded rows
const expanded = ref<Record<number | string, boolean>>({})

// composables
const { assets, apiPagination, pagination, loading, fetchAssets, deleteAsset } = useAsset()
const { categories, subCategories, getAllCategories, getSubCategoriesByCategory } = useCategory()
const { employees, fetchEmployees } = useEmployee()
const { locations: allLocations, getAllLocations } = useLocation()

// filters
const selectedCategoryId = ref<string | undefined>(undefined)
const selectedSubCategoryId = ref<string | undefined>(undefined)
const selectedStatus = ref<string | undefined>(undefined)
const selectedEmployee = ref<string | undefined>(undefined)
const selectedLocation = ref<string | undefined>(undefined)
const statusOptions = ['active', 'in repair', 'disposed']

// fetch categories, employees, locations on mount
onMounted(async () => {
  await getAllCategories()
  await fetchEmployees()
  await getAllLocations()
  allLocations.value = allLocations.value.map(l => ({
    ...l,
    id: String(l.id)
  }))
  loadAssets()
})

// watch category to fetch sub-categories
watch(selectedCategoryId, async (newId) => {
  if (newId) {
    await getSubCategoriesByCategory(newId)
    selectedSubCategoryId.value = undefined
  } else {
    subCategories.value = []
  }
  loadAssets(1)
})

// watch other filters
watch([selectedSubCategoryId, selectedStatus, selectedEmployee, selectedLocation, search], () => loadAssets(1))

// fetch wrapper with filters
function loadAssets(page = pagination.value.pageIndex + 1) {
  fetchAssets({
    search: search.value,
    page,
    limit: pagination.value.pageSize,
    categoryId: selectedCategoryId.value,
    subCategoryId: selectedSubCategoryId.value,
    status: selectedStatus.value,
    employeeId: selectedEmployee.value,
    locationId: selectedLocation.value
  })
}

// reset filters
function resetFilters() {
  selectedCategoryId.value = undefined
  selectedSubCategoryId.value = undefined
  selectedStatus.value = undefined
  selectedEmployee.value = undefined
  selectedLocation.value = undefined
  search.value = ''
  subCategories.value = []
  loadAssets(1)
}

// pagination handler
function handlePageChange(newPage: number) {
  loadAssets(newPage)
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

// confirm delete
async function confirmDelete() {
  if (!deletingAssetId.value) return
  await deleteAsset(deletingAssetId.value)
  deletingAssetId.value = null
  loadAssets()
  isDeleteModalOpen.value = false
}

// action menu items
function getRowItems(row: Row<any>) {
  const category = row.original.subCategory?.category
  if (!category) return []

  const items: any[] = [{ type: 'label', label: 'Actions' }]

  if (category.hasMaintenance) {
    items.push({
      label: 'Maintenance',
      icon: 'i-lucide-calendar-cog',
      to: `/asset/${row.original.id}/maintenance`
    })
  }

  if (category.hasHolder) {
    items.push({
      label: 'Holder',
      icon: 'i-lucide-users',
      to: `/asset/${row.original.id}/holder`
    })
  }

  if (category.hasLocation) {
    items.push({
      label: 'Location',
      icon: 'i-lucide-map-pin',
      to: `/asset/${row.original.id}/location`
    })
  }

  items.push(
    {
      label: 'Detail',
      icon: 'i-lucide-notebook-pen',
      to: `/asset/${row.original.id}/detail`
    },
    { type: 'separator' },
    {
      label: 'Edit',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        editingAssetId.value = row.original.id
        isUpdateModalOpen.value = true
      }
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: () => {
        deletingAssetId.value = row.original.id
        isDeleteModalOpen.value = true
      }
    }
  )

  return items
}

// table columns
const columns: TableColumn<any>[] = [
  {
    id: 'expand',
    cell: ({ row }) =>
      h(UButton, {
        'color': 'neutral',
        'variant': 'ghost',
        'icon': 'i-lucide-chevron-right',
        'square': true,
        'aria-label': 'Expand',
        'ui': { leadingIcon: [row.getIsExpanded() ? 'rotate-90 duration-200' : 'duration-200'] },
        'onClick': () => row.toggleExpanded()
      })
  },
  {
    accessorKey: 'name',
    header: 'Asset',
    cell: ({ row }) =>
      h(
        NuxtLink,
        {
          to: `/asset/${row.original.id}/detail`,
          class: 'flex flex-col hover:underline'
        },
        () => [
          h('p', { class: 'font-medium text-highlighted' }, row.original.name),
          h('p', { class: 'text-xs text-muted' }, row.original.code)
        ]
      )
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => row.original.subCategory?.category.name ?? '-'
  },
  {
    accessorKey: 'subCategory',
    header: 'Sub Category',
    cell: ({ row }) => row.original.subCategory?.name ?? '-'
  },
  {
    accessorKey: 'brand',
    header: 'Brand',
    cell: ({ row }) => row.original.brand ?? '-'
  },
  {
    accessorKey: 'model',
    header: 'Model',
    cell: ({ row }) => row.original.model ?? '-'
  },
  {
    accessorKey: 'lastLocation',
    header: 'Last Location',
    cell: ({ row }) => {
      const loc = row.original.lastLocation
      if (!loc) return h('span', { class: 'text-xs text-muted' }, '-')

      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'text-highlighted font-medium text-xs' }, loc.name),
        h('span', { class: 'text-xs' }, loc.branch?.name ?? '-')
      ])
    }
  },
  {
    accessorKey: 'employee',
    header: 'Active Holder',
    cell: ({ row }) => {
      const holder = row.original.activeHolder
      if (!holder) return h('span', '-')
      return h('div', { class: 'flex items-center gap-3' }, [
        h(UAvatar, {
          src: holder.employee.photoProfile,
          size: 'lg'
        }),
        h('div', undefined, [
          h('p', { class: 'font-medium text-highlighted text-xs' }, holder.employee.fullName),
          h('p', { class: 'text-xs' }, holder.employee.employeeId)
        ])
      ])
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    filterFn: 'equals',
    cell: ({ row }) => {
      type AssetStatus = 'active' | 'disposed' | 'in repair'
      const status = row.original.status as AssetStatus
      const colorMap: Record<AssetStatus, 'success' | 'error' | 'warning'> = {
        'active': 'success',
        'disposed': 'error',
        'in repair': 'warning'
      }
      const displayStatus = status.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
      return h(UBadge, { class: 'capitalize', variant: 'subtle', color: colorMap[status] }, () => displayStatus)
    }
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
          () => h(UButton, { icon: 'i-lucide-ellipsis-vertical', color: 'neutral', variant: 'ghost', class: 'ml-auto' })
        )
      )
  }
]
</script>

<template>
  <UDashboardPanel id="assets">
    <template #header>
      <UDashboardNavbar title="Assets">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <AssetAddModal @created="loadAssets()" />
          <AssetScanModal />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <ConfirmModal
        v-model:open="isDeleteModalOpen"
        title="Delete Asset"
        description="Are you sure? This action cannot be undone."
        confirm-label="Delete"
        :on-confirm="confirmDelete"
      />

      <AssetUpdateModal
        v-if="editingAssetId"
        :id="editingAssetId"
        v-model="isUpdateModalOpen"
        @updated="loadAssets()"
      />

      <!-- Search + Filters -->
      <div class="flex flex-col md:flex-row md:justify-between md:align-center gap-2 mb-2">
        <UInput
          v-model="search"
          class="max-w-lg"
          icon="i-lucide-search"
          placeholder="Search assets..."
        />

        <div class="flex flex-col md:flex-row gap-2">
          <div>
            <div class="flex flex-col md:flex-row gap-2">
              <USelect
                v-model="selectedCategoryId"
                placeholder="Filter by Category"
                clearable
                searchable
                searchable-placeholder="Cari kategori..."
                class="lg:w-48 md:w-20 w-full"
                :items="categories.map(c => ({ label: c.name, value: c.id }))"
              />

              <USelect
                v-model="selectedSubCategoryId"
                placeholder="Filter by Sub Category"
                clearable
                searchable
                searchable-placeholder="Cari sub kategori..."
                class="lg:w-48 md:w-20 w-full"
                :items="subCategories.map(sc => ({ label: sc.name, value: sc.id }))"
                :disabled="!selectedCategoryId"
              />

              <USelect
                v-model="selectedStatus"
                placeholder="Filter by Status"
                clearable
                searchable
                class="lg:w-48 md:w-20 w-full"
                :items="statusOptions.map(s => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))"
              />
            </div>
            <div class="flex flex-col md:flex-row gap-2 pt-2">
              <USelect
                v-model="selectedEmployee"
                :items="employees.map(e => ({ label: e.fullName, value: e.employeeId }))"
                placeholder="Filter by Active Holder"
                clearable
                searchable
                class="lg:w-73 md:w-31 w-full"
              />

              <USelect
                :key="allLocations.length"
                v-model="selectedLocation"
                :items="allLocations.map(l => ({ label: `${l.name} - ${l.branch.name}`, value: l.id }))"
                placeholder="Filter by Last Location"
                clearable
                searchable
                class="lg:w-73 md:w-31 w-full"
              />
            </div>
          </div>

          <UButton
            color="error"
            variant="link"
            icon="i-lucide-x-circle"
            class="justify-end"
            @click="resetFilters"
          >
            Reset Filter
          </UButton>
        </div>
      </div>

      <!-- Table -->
      <UTable
        v-model:pagination="pagination"
        v-model:expanded="expanded"
        :data="assets"
        :columns="columns"
        :loading="loading"
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
        :ui="{ base: 'table-fixed border-separate border-spacing-0', thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none', tbody: '[&>tr]:last:[&>td]:border-b-0', th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r', td: 'border-b border-default', tr: 'data-[expanded=true]:bg-elevated/30' }"
      >
        <template #expanded="{ row }">
          <div class="p-0">
            <div v-if="row.original.properties?.length">
              <table class="w-full text-sm border border-default rounded-lg overflow-hidden bg-muted">
                <tbody>
                  <tr v-for="prop in row.original.properties" :key="prop.id" class="border-t border-default hover:bg-muted/30">
                    <td class="px-3 py-2 font-medium text-highlighted">
                      {{ prop.property.name }}
                    </td>
                    <td class="px-3 py-2">
                      :
                    </td>
                    <td class="px-3 py-2 capitalize">
                      {{ prop.value }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-sm text-muted italic">
              No properties for this asset.
            </div>
          </div>
        </template>
      </UTable>

      <!-- Pagination -->
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
