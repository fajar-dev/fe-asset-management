<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import { useAsset } from '~/composables/useAsset'
import { useAssetHolder } from '~/composables/useAssetHolder'
import AssetHolderReturnModal from '~/components/asset/holder/ReturnedModal.vue'
import { useRole } from '~/composables/useRole'

const UAvatar = resolveComponent('UAvatar')
const UButton = resolveComponent('UButton')
const UIcon = resolveComponent('UIcon')
const router = useRouter()
const route = useRoute()
const assetId = route.params.id as string

const expanded = ref({} as Record<string | number, boolean>)

// state asset detail
const assetDetail = ref<any>(null)
const loading = ref(false)

// composable asset
const { getAssetById } = useAsset()
const { isAdmin } = useRole()

const {
  holders,
  loading: holderLoading,
  fetchHolders,
  pagination,
  apiPagination
} = useAssetHolder()

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

const hasActiveHolder = computed(() =>
  holders.value?.some(h => !h.returnedAt)
)

const columns: TableColumn<any>[] = [
  {
    id: 'expand',
    cell: ({ row }: { row: Row<any> }) => {
      return h(UButton, {
        'color': 'neutral',
        'variant': 'ghost',
        'icon': 'i-lucide-chevron-right',
        'square': true,
        'aria-label': 'Expand',
        'ui': {
          leadingIcon: [
            'transition-transform',
            row.getIsExpanded() ? 'rotate-90 duration-200' : 'duration-200'
          ]
        },
        'onClick': () => row.toggleExpanded()
      })
    }
  },
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
  { 
    accessorKey: 'assignedAt', 
    header: 'Assigned At',
    cell: ({ row }) => {
      const d = row.original.assignedAt ? new Date(row.original.assignedAt) : null
      return h('span', { class: 'text-xs' }, d ? `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}` : '-')
    }
  },
  {
    id: 'returnedAt',
    header: 'Returned At',
    cell: ({ row }) => {
      const returnedAt = row.original.returnedAt
      if (!returnedAt) {
        if (!isAdmin.value) return h('span', { class: 'text-xs' }, '-')
        return h(AssetHolderReturnModal, {
          assetId,
          holderId: row.original.id,
          onReturned: () => loadHolders()
        })
      }
      const d = new Date(returnedAt)
      return h('span', { class: 'text-xs' }, isNaN(d.getTime()) ? returnedAt : `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`)
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
          <RoleWrapper role="admin">
            <AssetHolderAssignedModal
              :asset-id="assetId"
              :disabled="hasActiveHolder"
              @created="loadHolders()"
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
          v-model:expanded="expanded"
          :data="holders"
          :columns="columns"
          :loading="holderLoading"
          :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
          class="shrink-0"
          :ui="{
            base: 'table-fixed border-separate border-spacing-0',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r whitespace-nowrap',
            td: 'border-b border-default whitespace-nowrap',
            tr: 'data-[expanded=true]:bg-elevated/30'
          }"
        >
          <template #expanded="{ row }">
            <div class="p-6 bg-muted border-t border-default">
              <div v-if="row.original.attachmentUrls && row.original.attachmentUrls.length">
                <div class="flex items-center gap-2 mb-3">
                  <UIcon name="i-lucide-paperclip" class="w-4 h-4 text-gray-500" />
                  <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Attachments ({{ row.original.attachmentUrls.length }})
                  </p>
                </div>
                <div class="flex flex-wrap gap-4">
                  <a
                    v-for="(url, index) in row.original.attachmentUrls"
                    :key="index"
                    :href="url"
                    target="_blank"
                    class="group relative w-24 h-24 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 transition-colors flex items-center justify-center bg-white dark:bg-gray-900"
                  >
                    <img
                      v-if="url.match(/\.(jpeg|jpg|gif|png|webp|bmp)(\?.*)?$/i)"
                      :src="String(url)"
                      :alt="`Attachment ${Number(index) + 1}`"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    >
                    <div v-else class="flex flex-col items-center gap-2 text-gray-400 group-hover:text-primary-500 transition-colors">
                      <UIcon name="i-lucide-file-text" class="w-10 h-10" />
                      <span class="text-xs font-medium px-2 text-center truncate w-full">Document</span>
                    </div>
                    
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <UIcon name="i-lucide-external-link" class="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                    </div>
                  </a>
                </div>
              </div>
              <div v-else class="text-sm text-gray-500 italic flex items-center gap-2">
                <UIcon name="i-lucide-info" class="w-4 h-4" />
                No attachments assigned
              </div>
            </div>
          </template>
        </UTable>
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
