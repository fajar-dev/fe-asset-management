<script setup lang="ts">
import type { SelectMenuItem, TableColumn } from '@nuxt/ui'
import { CalendarDate } from '@internationalized/date'

import { NuxtLink } from '#components'
import type { Row } from '@tanstack/table-core'
import { useAsset } from '~/composables/useAsset'
import { useCategory } from '~/composables/useCategory'
import { useEmployee } from '~/composables/useEmployee'
import { useLocation } from '~/composables/useLocation'
import { useRole } from '~/composables/useRole'

interface EmployeeItem {
  id: string
  label: string
  avatar?: {
    src: string
    alt: string
  }
}

const UAvatar = resolveComponent('UAvatar')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UBadge = resolveComponent('UBadge')
const ConfirmModal = resolveComponent('ConfirmModal')
const AssetAddModal = resolveComponent('AssetAddModal')
const AssetScanModal = resolveComponent('AssetScanModal')
const AssetUpdateModal = resolveComponent('AssetUpdateModal')
const UTooltip = resolveComponent('UTooltip')
const UIcon = resolveComponent('UIcon')

const route = useRoute()
const router = useRouter()
const search = ref('')
const pageLimit = ref(10)
const isDeleteModalOpen = ref(false)
const deletingAssetId = ref<string | null>(null)
const isUpdateModalOpen = ref(false)
const editingAssetId = ref<string>('')
const isFilterOpen = ref(false)
const showDatePicker = ref(false)

const assetAddModalRef = ref<any>(null)

const { assets, apiPagination, pagination, loading, fetchAssets, deleteAsset, exportAssets } = useAsset()
const { categories, subCategories, getAllCategories, getSubCategoriesByCategory } = useCategory()
const { employees, fetchEmployees } = useEmployee()
const { locations: allLocations, getAllLocations } = useLocation()
const { isAdmin } = useRole()

const selectedCategoryId = ref<string | undefined>(undefined)
const selectedSubCategoryId = ref<string | undefined>(undefined)
const selectedStatus = ref<string | undefined>(undefined)
const selectedEmployee = ref<string | undefined>(undefined)
const selectedHasHolder = ref<boolean>(false)
const selectedLocation = ref<string | undefined>(undefined)
const selectedDateRange = ref<any>(undefined)
const previewImage = ref<string | null>(null)

const tempCategoryId = ref<string | undefined>(undefined)
const tempSubCategoryId = ref<string | undefined>(undefined)
const tempStatus = ref<string | undefined>(undefined)
const tempEmployee = ref<string | undefined>(undefined)
const tempHasHolder = ref<boolean>(false)
const tempLocation = ref<string | undefined>(undefined)
const tempDateRange = ref<any>(undefined)

const pageLimitOptions = [10, 25, 50, 100]

const statusItems: SelectMenuItem[] = [
  { label: 'Active', id: 'active' },
  { label: 'In Repair', id: 'in repair' },
  { label: 'Disposed', id: 'disposed' }
]

onMounted(async () => {
  await getAllCategories()
  await fetchEmployees()
  await getAllLocations()
  allLocations.value = allLocations.value.map(l => ({
    ...l,
    id: String(l.id)
  }))

  if (route.query.categoryId) {
    selectedCategoryId.value = route.query.categoryId as string
    tempCategoryId.value = route.query.categoryId as string
    await getSubCategoriesByCategory(route.query.categoryId as string)
  }

  if (route.query.subCategoryId) {
    selectedSubCategoryId.value = route.query.subCategoryId as string
    tempSubCategoryId.value = route.query.subCategoryId as string
  }

  if (route.query.locationId) {
    selectedLocation.value = route.query.locationId as string
    tempLocation.value = route.query.locationId as string
  }

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

watch(tempHasHolder, (newValue) => {
  if (!newValue) {
    tempEmployee.value = undefined
  }
})

watch(search, () => loadAssets(1))

watch(pageLimit, (newLimit) => {
  pagination.value.pageSize = newLimit
  loadAssets(1)
})

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
  const params: any = {
    search: search.value,
    page,
    limit: pageLimit.value,
    categoryId: selectedCategoryId.value,
    subCategoryId: selectedSubCategoryId.value,
    status: selectedStatus.value,
    employeeId: selectedEmployee.value,
    hasHolder: selectedHasHolder.value,
    locationId: selectedLocation.value
  }

  if (selectedDateRange.value?.start && selectedDateRange.value?.end) {
    params.startDate = `${selectedDateRange.value.start.year}-${String(selectedDateRange.value.start.month).padStart(2, '0')}-${String(selectedDateRange.value.start.day).padStart(2, '0')}`
    params.endDate = `${selectedDateRange.value.end.year}-${String(selectedDateRange.value.end.month).padStart(2, '0')}-${String(selectedDateRange.value.end.day).padStart(2, '0')}`
  }

  fetchAssets(params)
}

function applyFilters() {
  selectedCategoryId.value = tempCategoryId.value
  selectedSubCategoryId.value = tempSubCategoryId.value
  selectedStatus.value = tempStatus.value
  selectedEmployee.value = tempEmployee.value
  selectedHasHolder.value = tempHasHolder.value
  selectedLocation.value = tempLocation.value
  selectedDateRange.value = tempDateRange.value
  showDatePicker.value = false
  isFilterOpen.value = false
  loadAssets(1)
}

function resetFilters() {
  selectedCategoryId.value = undefined
  selectedSubCategoryId.value = undefined
  selectedStatus.value = undefined
  selectedEmployee.value = undefined
  selectedHasHolder.value = false
  selectedLocation.value = undefined
  selectedDateRange.value = undefined
  search.value = ''

  tempCategoryId.value = undefined
  tempSubCategoryId.value = undefined
  tempStatus.value = undefined
  tempEmployee.value = undefined
  tempHasHolder.value = false
  tempLocation.value = undefined
  tempDateRange.value = undefined

  subCategories.value = []
  showDatePicker.value = false
  isFilterOpen.value = false

  router.push('/asset')

  loadAssets(1)
}

function clearDateRange() {
  tempDateRange.value = undefined
}

function setDateRangePreset(years: number) {
  const today = new Date()
  const end = new Date(today.getFullYear() - years, today.getMonth(), today.getDate())
  
  tempDateRange.value = {
    start: new CalendarDate(2000, 1, 1),
    end: new CalendarDate(
      end.getFullYear(),
      end.getMonth() + 1,
      end.getDate()
    )
  }
}

function toggleDatePicker(e: Event) {
  e.stopPropagation()
  showDatePicker.value = !showDatePicker.value
}

function handlePageChange(newPage: number) {
  loadAssets(newPage)
}

async function handleExport() {
  const filters: any = {
    categoryId: selectedCategoryId.value,
    subCategoryId: selectedSubCategoryId.value,
    status: selectedStatus.value,
    employeeId: selectedEmployee.value,
    hasHolder: selectedHasHolder.value,
    locationId: selectedLocation.value
  }

  if (selectedDateRange.value?.start && selectedDateRange.value?.end) {
    filters.startDate = `${selectedDateRange.value.start.year}-${String(selectedDateRange.value.start.month).padStart(2, '0')}-${String(selectedDateRange.value.start.day).padStart(2, '0')}`
    filters.endDate = `${selectedDateRange.value.end.year}-${String(selectedDateRange.value.end.month).padStart(2, '0')}-${String(selectedDateRange.value.end.day).padStart(2, '0')}`
  }

  await exportAssets(filters)
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
  if (selectedHasHolder.value) count++
  if (selectedLocation.value) count++
  if (selectedDateRange.value?.start && selectedDateRange.value?.end) count++
  return count
})

const formattedDateRange = computed(() => {
  if (!tempDateRange.value?.start || !tempDateRange.value?.end) return 'Select date range'
  const start = new Date(
    tempDateRange.value.start.year,
    tempDateRange.value.start.month - 1,
    tempDateRange.value.start.day
  )
  const end = new Date(
    tempDateRange.value.end.year,
    tempDateRange.value.end.month - 1,
    tempDateRange.value.end.day
  )
  const formatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
  return `${formatter.format(start)} - ${formatter.format(end)}`
})

watch(isFilterOpen, (isOpen) => {
  if (isOpen) {
    tempCategoryId.value = selectedCategoryId.value
    tempSubCategoryId.value = selectedSubCategoryId.value
    tempStatus.value = selectedStatus.value
    tempEmployee.value = selectedEmployee.value
    tempHasHolder.value = selectedHasHolder.value
    tempLocation.value = selectedLocation.value
    tempDateRange.value = selectedDateRange.value
    showDatePicker.value = false

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

function handleAddAssetFromScanner(code: string) {
  if (assetAddModalRef.value && typeof assetAddModalRef.value.openWithCode === 'function') {
    assetAddModalRef.value.openWithCode(code)
  }
}

function getRowItems(row: Row<any>) {
  const category = row.original.subCategory?.category
  if (!category) return []

  const items: any[] = [{ type: 'label', label: 'Actions' }]

  if (category.hasLocation) {
    items.push({
      label: 'Location',
      icon: 'i-lucide-map-pin',
      to: `/asset/${row.original.id}/location`
    })
  }

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
            h('p', { class: 'font-medium text-highlighted pe-10' }, row.original.name),
            h('p', { class: 'text-xs text-muted' }, row.original.code)
          ])
        ]
      )
  },
  {
    accessorKey: 'category',
    header: () =>
      h(
        'div',
        { class: 'flex items-center gap-1' },
        [
          h('span', 'Category'),
          h(
            UTooltip,
            {
              text: 'Shows the main category this asset belongs to.',
              delayDuration: 0
            },
            () =>
              h(UIcon, {
                name: 'i-lucide-info',
                class: 'min-w-4 min-h-4 flex text-muted cursor-help'
              })
          )
        ]
      ),
    cell: ({ row }) => row.original.subCategory?.category.name ?? '-'
  },
  {
    accessorKey: 'subCategory',
    header: () =>
      h(
        'div',
        { class: 'flex items-center gap-1' },
        [
          h('span', 'Sub Category'),
          h(
            UTooltip,
            {
              text: 'Shows the specific subcategory this asset belongs to.',
              delayDuration: 0
            },
            () =>
              h(UIcon, {
                name: 'i-lucide-info',
                class: 'min-w-4 min-h-4 flex text-muted cursor-help'
              })
          )
        ]
      ),
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
    header: () =>
      h(
        'div',
        { class: 'flex items-center gap-1' },
        [
          h('span', 'Last Location'),
          h(
            UTooltip,
            {
              text: 'Shows the most recent location where this asset was recorded.',
              delayDuration: 0
            },
            () =>
              h(UIcon, {
                name: 'i-lucide-info',
                class: 'min-w-4 min-h-4 flex text-muted cursor-help'
              })
          )
        ]
      ),
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
    header: () =>
      h(
        'div',
        { class: 'flex items-center gap-1' },
        [
          h('span', 'Active Holder'),
          h(
            UTooltip,
            {
              text: 'Displays the current employee responsible for this asset.',
              delayDuration: 0
            },
            () =>
              h(UIcon, {
                name: 'i-lucide-info',
                class: 'min-w-4 min-h-4 text-muted cursor-help'
              })
          )
        ]
      ),
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
    accessorKey: 'user',
    header: 'User',
    cell: ({ row }) => row.original.user ?? '-'
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => {
      const price = row.original.price
      if (!price) return h('span', { class: 'text-xs text-muted' }, '-')
      const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(Number(price))
      return h('span', { class: 'text-xs font-medium' }, formatted)
    }
  },
  {
    accessorKey: 'purchaseDate',
    header: 'Purchase Date',
    cell: ({ row }) => {
      const date = row.original.purchaseDate
      const age = row.original.age
      if (!date) return h('span', { class: 'text-xs text-muted' }, '-')
      const formatted = new Date(date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'text-xs text-highlighted' }, formatted),
        h('span', { class: 'text-xs' }, age ?? '-')
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
      const displayStatus = status
        .split(' ')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ')
      return h(
        UBadge,
        { class: 'capitalize', variant: 'subtle', color: colorMap[status] },
        () => displayStatus
      )
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
  <UDashboardPanel id="assets">
    <template #header>
      <UDashboardNavbar title="Assets">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <RoleWrapper role="admin">
            <AssetAddModal ref="assetAddModalRef" @created="loadAssets()" />
          </RoleWrapper>
          <AssetScanModal @add-asset="handleAddAssetFromScanner" />
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
        <div class="flex gap-2 items-center max-w-lg flex-1">
          <UInput
            v-model="search"
            class="flex-1"
            icon="i-lucide-search"
            placeholder="Search assets..."
          />
          <USelect
            v-model="pageLimit"
            class="w-24"
            :items="pageLimitOptions"
          />
        </div>

        <div class="flex gap-2 items-center">
          <RoleWrapper role="admin">
            <AssetImportModal />
          </RoleWrapper>
          <UButton
            color="primary"
            variant="subtle"
            icon="i-lucide-file-down"
            :loading="loading"
            @click="handleExport"
          >
            Export
          </UButton>
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
              <div class="p-4 w-80 space-y-4 max-h-[80vh] overflow-y-auto" @click.stop>
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

                <div class="space-y-3">
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
                    <label class="block text-sm font-medium mb-1.5">Last Location</label>
                    <USelectMenu
                      v-model="tempLocation"
                      class="w-full"
                      value-key="id"
                      :items="allLocations.map(l => ({
                        label: `${l.name} - ${l.branch?.name ?? '-'}`,
                        id: String(l.id)
                      }))"
                      placeholder="Select last location"
                      searchable
                      searchable-placeholder="Search location..."
                      clearable
                    />
                  </div>

                  <div>
                    <div class="flex items-center justify-between mb-1.5">
                      <label class="block text-sm font-medium">Filter by Holder</label>
                      <USwitch v-model="tempHasHolder" />
                    </div>
                  </div>

                  <div v-if="tempHasHolder">
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

                  <div>
                    <div class="flex items-center justify-between mb-1.5">
                      <label class="block text-sm font-medium">Purchase Date</label>
                      <UButton
                        v-if="tempDateRange"
                        color="error"
                        variant="link"
                        size="xs"
                        @click.stop="clearDateRange"
                      >
                        Clear
                      </UButton>
                    </div>

                    <UButton
                      color="neutral"
                      variant="outline"
                      block
                      icon="i-lucide-calendar"
                      :trailing-icon="showDatePicker ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                      class="justify-start"
                      @click="toggleDatePicker"
                    >
                      <span class="truncate text-sm">{{ formattedDateRange }}</span>
                    </UButton>

                    <div v-if="showDatePicker" class="mt-2 p-3 border border-default rounded-lg bg-elevated" @click.stop>
                      <div class="mb-3">
                        <p class="text-xs font-medium mb-2 text-muted">Filter Umur Aset</p>
                        <div class="grid grid-cols-2 gap-2">
                          <UButton
                            size="xs"
                            color="neutral"
                            variant="subtle"
                            block
                            @click="setDateRangePreset(1)"
                          >
                            > 1 Tahun
                          </UButton>
                          <UButton
                            size="xs"
                            color="neutral"
                            variant="subtle"
                            block
                            @click="setDateRangePreset(2)"
                          >
                            > 2 Tahun
                          </UButton>
                          <UButton
                            size="xs"
                            color="neutral"
                            variant="subtle"
                            block
                            @click="setDateRangePreset(3)"
                          >
                            > 3 Tahun
                          </UButton>
                          <UButton
                            size="xs"
                            color="neutral"
                            variant="subtle"
                            block
                            @click="setDateRangePreset(4)"
                          >
                            > 4 Tahun
                          </UButton>
                        </div>
                      </div>
                      <UCalendar
                        v-model="tempDateRange"
                        range
                      />
                    </div>
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
        :data="assets"
        :columns="columns"
        :loading="loading"
        :ui="{ base: 'table-fixed border-separate border-spacing-0', thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none', tbody: '[&>tr]:last:[&>td]:border-b-0', th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r', td: 'border-b border-default' }"
      />

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
