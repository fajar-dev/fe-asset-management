<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useAsset } from '~/composables/useAsset'
import { useAssetHolder } from '~/composables/useAssetHolder'
import AssetHolderReturnModal from '~/components/asset/holder/ReturnedModal.vue'

const UAvatar = resolveComponent('UAvatar')
const router = useRouter()
const route = useRoute()
const assetId = route.params.id as string

// state asset detail
const assetDetail = ref<any>(null)
const loading = ref(false)

// composable asset
const { getAssetById } = useAsset()

// composable holder
const {
  holders,
  loading: holderLoading,
  fetchHolders,
  pagination,
  apiPagination
} = useAssetHolder()

// fetch asset detail
onMounted(async () => {
  loading.value = true
  const res = await getAssetById(assetId)
  if (res) {
    assetDetail.value = res.data
    await loadHolders()
  } else {
    await router.push('/asset')
  }
  loading.value = false
})

function loadHolders(page = pagination.value.pageIndex + 1) {
  fetchHolders(assetId, '', page, pagination.value.pageSize)
}

function handlePageChange(newPage: number) {
  loadHolders(newPage)
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

// cek apakah ada active holder
const hasActiveHolder = computed(() =>
  holders.value?.some(h => !h.returnedAt)
)

// columns
const columns: TableColumn<any>[] = [
  {
    accessorKey: 'employeeId',
    header: 'Employee',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-3' }, [
        h(UAvatar, {
          src: row.original.employee.photoProfile,
          size: 'lg'
        }),
        h('div', undefined, [
          h('p', { class: 'font-medium text-highlighted text-xs' }, row.original.employee.fullName),
          h('p', { class: 'text-xs' }, row.original.employee.employeeId)
        ])
      ])
    }
  },
  { accessorKey: 'purpose', header: 'Purpose' },
  { accessorKey: 'assignedAt', header: 'Assigned At' },
  {
    id: 'returnedAt',
    header: 'Returned At',
    cell: ({ row }) => {
      const returnedAt = row.original.returnedAt
      if (!returnedAt) {
        return h(AssetHolderReturnModal, {
          assetId,
          holderId: row.original.id,
          onReturned: () => loadHolders()
        })
      }
      return row.original.returnedAt
    }
  }
]
</script>

<template>
  <UDashboardPanel id="holders">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <AssetHolderAssignedModal
            :asset-id="assetId"
            :disabled="hasActiveHolder"
            @created="loadHolders()"
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
      <div class="overflow-x-auto">
        <UTable
          v-model:pagination="pagination"
          :data="holders"
          :columns="columns"
          :loading="holderLoading"
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
