<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useAsset } from '~/composables/useAsset'
import { useAssetLocation } from '~/composables/useAssetLocation'

// router
const router = useRouter()
const route = useRoute()
const assetId = route.params.id as string

// state asset detail
const assetDetail = ref<any>(null)
const loading = ref(false)

// composable asset
const { getAssetById } = useAsset()

// composable locations
const {
  locations,
  loading: locationLoading,
  fetchLocations,
  pagination,
  apiPagination
} = useAssetLocation()

// fetch asset detail
onMounted(async () => {
  loading.value = true
  const res = await getAssetById(assetId)
  if (res) {
    assetDetail.value = res.data
    await loadLocations()
  } else {
    await router.push('/asset')
  }
  loading.value = false
})

function loadLocations(page = pagination.value.pageIndex + 1) {
  fetchLocations(assetId, undefined, page, pagination.value.pageSize)
}

function handlePageChange(newPage: number) {
  loadLocations(newPage)
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

// columns
const columns: TableColumn<any>[] = [
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt)
      // Convert ke GMT+7
      const gmt7 = new Date(date.getTime() + 7 * 60 * 60 * 1000)
      return gmt7.toISOString().replace('T', ' ').substring(0, 19) // format YYYY-MM-DD HH:MM:SS
    }
  },
  { accessorKey: 'location.name', header: 'Location Name' },
  {
    header: 'Branch',
    cell: ({ row }) => {
      const branch = row.original.location.branch
      return `${branch.branchId} - ${branch.name}`
    }
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
          <RoleWrapper role="admin">
            <AssetLocationAddModal
              :asset-id="assetId"
              @created="loadLocations()"
            />
          </RoleWrapper>
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
      <div class="overflow-x-auto">
        <UTable
          v-model:pagination="pagination"
          :data="locations"
          :columns="columns"
          :loading="locationLoading"
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
