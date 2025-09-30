<script setup lang="ts">
import type { TableColumn, SelectMenuItem } from '@nuxt/ui'

import { NuxtLink } from '#components'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import { useAsset } from '~/composables/useAsset'
import { useCategory } from '~/composables/useCategory'
import { useEmployee } from '~/composables/useEmployee'
import { useRole } from '~/composables/useRole'

interface EmployeeItem {
  id: string
  label: string
  avatar?: {
    src: string
    alt: string
  }
}

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
const editingAssetId = ref<string>('')
const isFilterOpen = ref(false)

// expanded rows
const expanded = ref<Record<number | string, boolean>>({})

// composables
const { assets, apiPagination, pagination, loading, fetchAssets, deleteAsset } = useAsset()
const { categories, subCategories, getAllCategories, getSubCategoriesByCategory } = useCategory()
const { employees, fetchEmployees } = useEmployee()
const { isAdmin } = useRole()

const selectedCategoryId = ref<string | undefined>(undefined)
const selectedSubCategoryId = ref<string | undefined>(undefined)
const selectedStatus = ref<string | undefined>(undefined)
const selectedEmployee = ref<string | undefined>(undefined)
const previewImage = ref<string | null>(null)

const tempCategoryId = ref<string | undefined>(undefined)
const tempSubCategoryId = ref<string | undefined>(undefined)
const tempStatus = ref<string | undefined>(undefined)
const tempEmployee = ref<string | undefined>(undefined)

const statusItems: SelectMenuItem[] = [
  { label: 'Active', id: 'active' },
  { label: 'In Repair', id: 'in repair' },
  { label: 'Disposed', id: 'disposed' }
]

onMounted(async () => {
  await getAllCategories()
  await fetchEmployees()
  loadAssets()
})

watch(tempCategoryId, async (newId) => {
  if (newId) {
    await getSubCategoriesByCategory(newId)
    tempSubCategoryId.value = undefined
  } else {
    subCategories.value = []
  }
})

watch(search, () => loadAssets(1))

const categoryItems = computed<SelectMenuItem[]>(() =>
  categories.value.map(c => ({ label: c.name, id: c.id }))
)

const subCategoryItems = computed<SelectMenuItem[]>(() =>
  subCategories.value.map(sc => ({ label: sc.name, id: sc.id }))
)

const employeeItems = computed<EmployeeItem[]>(() =>
  employees.value.map(e => ({
    id: e.employeeId,
    label: e.fullName,
    avatar: {
      src: e.photoProfile,
      alt: e.fullName
    }
  }))
)

const selectedEmployeeAvatar = computed(() => {
  if (!tempEmployee.value) return undefined
  const employee = employeeItems.value.find(e => e.id === tempEmployee.value)
  return employee?.avatar
})

function loadAssets(page = pagination.value.pageIndex + 1) {
  fetchAssets({
    search: search.value,
    page,
    limit: pagination.value.pageSize,
    categoryId: selectedCategoryId.value,
    subCategoryId: selectedSubCategoryId.value,
    status: selectedStatus.value,
    employeeId: selectedEmployee.value
  })
}

function applyFilters() {
  selectedCategoryId.value = tempCategoryId.value
  selectedSubCategoryId.value = tempSubCategoryId.value
  selectedStatus.value = tempStatus.value
  selectedEmployee.value = tempEmployee.value
  isFilterOpen.value = false
  loadAssets(1)
}

function resetFilters() {
  selectedCategoryId.value = undefined
  selectedSubCategoryId.value = undefined
  selectedStatus.value = undefined
  selectedEmployee.value = undefined
  search.value = ''

  tempCategoryId.value = undefined
  tempSubCategoryId.value = undefined
  tempStatus.value = undefined
  tempEmployee.value = undefined

  subCategories.value = []
  isFilterOpen.value = false
  loadAssets(1)
}

function handlePageChange(newPage: number) {
  loadAssets(newPage)
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

const activeFiltersCount = computed(() => {
  let count = 0
  if (selectedCategoryId.value) count++
  if (selectedSubCategoryId.value) count++
  if (selectedStatus.value) count++
  if (selectedEmployee.value) count++
  return count
})

watch(isFilterOpen, (isOpen) => {
  if (isOpen) {
    tempCategoryId.value = selectedCategoryId.value
    tempSubCategoryId.value = selectedSubCategoryId.value
    tempStatus.value = selectedStatus.value
    tempEmployee.value = selectedEmployee.value

    if (tempCategoryId.value) {
      getSubCategoriesByCategory(tempCategoryId.value)
    }
  }
})

async function confirmDelete() {
  if (!deletingAssetId.value) return
  await deleteAsset(deletingAssetId.value)
  deletingAssetId.value = null
  loadAssets()
  isDeleteModalOpen.value = false
}

function handleUpdated() {
  loadAssets()
}

function openImageModal(url: string) {
  previewImage.value = url
}
function closeImageModal() {
  previewImage.value = null
}

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

  items.push(
    {
      label: 'Detail',
      icon: 'i-lucide-notebook-pen',
      to: `/asset/${row.original.id}/detail`
    }
  )

  if (isAdmin.value) {
    items.push(
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
  }

  return items
}

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
          class: 'flex items-center gap-3 hover:underline'
        },
        () => [
          h('img', {
            src: row.original.imageUrl,
            alt: row.original.name,
            class: 'w-10 h-10 object-cover rounded cursor-pointer hover:scale-105 transition-transform',
            onClick: (e: Event) => {
              e.preventDefault()
              openImageModal(row.original.imageUrl)
            }
          }),
          h('div', { class: 'flex flex-col' }, [
            h('p', { class: 'font-medium text-highlighted' }, row.original.name),
            h('p', { class: 'text-xs text-muted' }, row.original.code)
          ])
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
          <RoleWrapper role="admin">
            <AssetAddModal @created="loadAssets()" />
          </RoleWrapper>
          <AssetScanModal />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <RoleWrapper role="admin">
        <ConfirmModal
          v-model:open="isDeleteModalOpen"
          title="Delete Asset"
          description="Are you sure? This action cannot be undone."
          confirm-label="Delete"
          :on-confirm="confirmDelete"
        />
        <AssetUpdateModal
          v-if="editingAssetId"
          v-model="isUpdateModalOpen"
          :asset-id="editingAssetId"
          @updated="handleUpdated"
        />
      </RoleWrapper>

      <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <UInput
          v-model="search"
          class="max-w-lg"
          icon="i-lucide-search"
          placeholder="Search assets..."
        />

        <div class="flex gap-2 items-center">
          <UPopover v-model:open="isFilterOpen" :popper="{ placement: 'bottom-end' }">
            <UButton
              color="neutral"
              variant="subtle"
              icon="i-lucide-filter"
              trailing-icon="i-lucide-chevron-down"
            >
              Filters
              <UBadge
                v-if="activeFiltersCount > 0"
                color="primary"
                variant="solid"
                size="sm"
                class="ml-2"
              >
                {{ activeFiltersCount }}
              </UBadge>
            </UButton>

            <template #content>
              <div class="p-4 w-80 space-y-4">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="font-semibold text-sm">
                    Filter Assets
                  </h3>
                  <UButton
                    v-if="activeFiltersCount > 0"
                    color="error"
                    variant="link"
                    size="xs"
                    @click="resetFilters"
                  >
                    Reset All
                  </UButton>
                </div>

                <div class="space-y-2">
                  <div>
                    <label class="block text-sm font-medium mb-1.5">Category</label>
                    <USelectMenu
                      v-model="tempCategoryId"
                      class="w-full"
                      value-key="id"
                      :items="categoryItems"
                      placeholder="Select category"
                      searchable
                      searchable-placeholder="Search category..."
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium mb-1.5">Sub Category</label>
                    <USelectMenu
                      v-model="tempSubCategoryId"
                      class="w-full"
                      value-key="id"
                      :items="subCategoryItems"
                      placeholder="Select sub category"
                      searchable
                      searchable-placeholder="Search sub category..."
                      :disabled="!tempCategoryId"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium mb-1.5">Status</label>
                    <USelectMenu
                      v-model="tempStatus"
                      class="w-full"
                      value-key="id"
                      :items="statusItems"
                      placeholder="Select status"
                      searchable
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium mb-1.5">Active Holder</label>
                    <USelectMenu
                      v-model="tempEmployee"
                      class="w-full"
                      value-key="id"
                      :avatar="selectedEmployeeAvatar"
                      :items="employeeItems"
                      placeholder="Select holder"
                      searchable
                      searchable-placeholder="Search employee..."
                    />
                  </div>
                </div>

                <div class="pt-3">
                  <UButton
                    color="primary"
                    variant="soft"
                    block
                    @click="applyFilters"
                  >
                    Apply Filters
                  </UButton>
                </div>
              </div>
            </template>
          </UPopover>
        </div>
      </div>

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

  <div
    v-if="previewImage"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
    @click.self="closeImageModal"
  >
    <img
      :src="previewImage"
      alt="Preview"
      class="max-h-[90%] max-w-[90%] rounded-lg shadow-lg"
    >
  </div>
</template>
