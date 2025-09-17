<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/table-core'
import { useAsset } from '~/composables/useAsset'
import { useAssetMaintenance } from '~/composables/useAssetMaintenance'

// global komponen
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

// router
const router = useRouter()
const route = useRoute()
const assetId = route.params.id as string

// state asset detail
const assetDetail = ref<any>(null)
const loading = ref(false)

// composable asset
const { getAssetById } = useAsset()

// composable maintenance
const {
  maintenances,
  loading: maintenanceLoading,
  fetchMaintenances,
  deleteMaintenance,
  pagination,
  apiPagination
} = useAssetMaintenance()

// modal state
const isDeleteModalOpen = ref(false)
const deletingMaintenanceId = ref<string | null>(null)
const isUpdateModalOpen = ref(false)
const editingMaintenanceId = ref<string | null>(null)

// fetch asset detail
onMounted(async () => {
  loading.value = true
  const res = await getAssetById(assetId)
  if (res) {
    assetDetail.value = res.data
    await loadMaintenances()
  } else {
    await router.push('/asset')
  }
  loading.value = false
})

function loadMaintenances(page = pagination.value.pageIndex + 1) {
  fetchMaintenances(assetId, undefined, page, pagination.value.pageSize)
}

function handlePageChange(newPage: number) {
  loadMaintenances(newPage)
}

// showing info
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
  if (!deletingMaintenanceId.value) return
  await deleteMaintenance(assetId, deletingMaintenanceId.value)
  deletingMaintenanceId.value = null
  loadMaintenances()
  isDeleteModalOpen.value = false
}

function getRowItems(row: Row<any>) {
  return [
    { type: 'label', label: 'Actions' },
    {
      label: 'Edit',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        editingMaintenanceId.value = row.original.id
        isUpdateModalOpen.value = true
      }
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: () => {
        deletingMaintenanceId.value = row.original.id
        isDeleteModalOpen.value = true
      }
    }
  ]
}

// columns
const columns: TableColumn<any>[] = [
  { accessorKey: 'maintenanceAt', header: 'Date' },
  { accessorKey: 'note', header: 'Note' },
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
  <UDashboardPanel id="detail">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <AssetMaintenanceAddModal
            :asset-id="assetId"
            @created="loadMaintenances()"
          />
        </template>

        <template #title>
          <AssetDetailHeader
            :asset-detail="assetDetail"
            :loading="loading"
          />
        </template>
      </UDashboardNavbar>

      <AssetDetailTabs
        :asset-id="assetId"
        :asset-detail="assetDetail"
        :loading="loading"
      />
    </template>

    <template #body>
      <!-- Modal Delete & Update -->
      <ConfirmModal
        v-model:open="isDeleteModalOpen"
        title="Delete Maintenance"
        description="Are you sure? This action cannot be undone."
        confirm-label="Delete"
        :on-confirm="confirmDelete"
      />

      <AssetMaintenanceUpdateModal
        v-if="editingMaintenanceId"
        v-model:open="isUpdateModalOpen"
        :asset-id="assetId"
        :maintenance-id="editingMaintenanceId"
        @updated="loadMaintenances()"
      />

      <div class="overflow-x-auto">
        <UTable
          v-model:pagination="pagination"
          :data="maintenances"
          :columns="columns"
          :loading="maintenanceLoading"
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
          Showing {{ showingFrom }} to {{ showingTo }} of
          {{ apiPagination.totalItems }} results
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
