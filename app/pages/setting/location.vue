<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import { useLocation } from '~/composables/useLocation'
import { useRole } from '~/composables/useRole'

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const { t } = useI18n()

const search = ref('')
const pageLimit = ref(10)
const isDeleteModalOpen = ref(false)
const deletingLocationId = ref<string | null>(null)
const isUpdateModalOpen = ref(false)
const editingLocationId = ref<string | null>(null)

const pageLimitOptions = [10, 25, 50, 100]

const { locations, apiPagination, pagination, loading, fetchLocations, deleteLocation } = useLocation()
const { isAdmin } = useRole()

function loadLocations(page = pagination.value.pageIndex + 1) {
  fetchLocations(search.value, page, pageLimit.value)
}

onMounted(() => loadLocations())
watch(search, () => loadLocations(1))

watch(pageLimit, (newLimit) => {
  pagination.value.pageSize = newLimit
  loadLocations(1)
})

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
    { type: 'label', label: t('common.actions') },
    {
      label: t('common.edit'),
      icon: 'i-lucide-pencil',
      onSelect: () => {
        editingLocationId.value = row.original.id
        isUpdateModalOpen.value = true
      }
    },
    {
      label: t('common.delete'),
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: () => {
        deletingLocationId.value = row.original.id
        isDeleteModalOpen.value = true
      }
    }
  ]
}

const columns = computed<TableColumn<any>[]>(() => [
  { accessorKey: 'name', header: t('page.locationSetting.name') },
  {
    header: t('page.locationSetting.branch'),
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
])
</script>

<template>
  <UDashboardPanel id="locations">
    <template #header>
      <UDashboardNavbar :title="t('page.locationSetting.title')">
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
          :title="t('page.locationSetting.deleteTitle')"
          :description="t('page.locationSetting.deleteDescription')"
          :confirm-label="t('common.delete')"
          :on-confirm="confirmDelete"
        />
        <LocationUpdateModal
          :id="editingLocationId"
          v-model:open="isUpdateModalOpen"
          @updated="fetchLocations()"
        />
      </RoleWrapper>
      <div class="flex flex-wrap items-center justify-between gap-1.5 mb-2">
        <div class="flex gap-2 items-center max-w-lg">
          <UInput
            v-model="search"
            class="w-full"
            icon="i-lucide-search"
            :placeholder="t('page.locationSetting.searchPlaceholder')"
          />
          <USelect
            v-model="pageLimit"
            class="w-24"
            :items="pageLimitOptions"
          />
        </div>
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
          {{ t('common.showing') }} {{ showingFrom }} {{ t('common.to') }} {{ showingTo }} {{ t('common.of') }} {{ apiPagination.totalItems }} {{ t('common.results') }}
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
