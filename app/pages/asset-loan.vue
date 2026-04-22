<script setup lang="ts">
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import { useUserAsset } from '~/composables/useUserAsset'
import type { UserAsset } from '~/types/userAsset'

const { assets, loading, apiPagination, pagination, fetchActiveAssets, fetchHistoryAssets } = useUserAsset()
const { t } = useI18n()

const UAvatar = resolveComponent('UAvatar')
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UIcon = resolveComponent('UIcon')

const activeTab = ref('active')
const expanded = ref<Record<string | number, boolean>>({})

const navigationItems = computed(() => [
  [
    {
      label: t('page.assetLoan.active'),
      icon: 'i-lucide-check-circle',
      active: activeTab.value === 'active',
      onSelect: () => {
        activeTab.value = 'active'
        pagination.value.pageIndex = 0
        loadData()
      }
    },
    {
      label: t('page.assetLoan.history'),
      icon: 'i-lucide-history',
      active: activeTab.value === 'history',
      onSelect: () => {
        activeTab.value = 'history'
        pagination.value.pageIndex = 0
        loadData()
      }
    }
  ]
])

function loadData() {
  if (activeTab.value === 'active') {
    fetchActiveAssets(pagination.value.pageIndex + 1)
  } else {
    fetchHistoryAssets(pagination.value.pageIndex + 1)
  }
}

onMounted(() => {
  loadData()
})

function handlePageChange(newPage: number) {
  if (activeTab.value === 'active') {
    fetchActiveAssets(newPage)
  } else {
    fetchHistoryAssets(newPage)
  }
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

const returnAssetModal = ref()
const selectedAssetForReturn = ref<{ assetUuid: string, loanId: string } | null>(null)

function openReturnModal(assetUuid: string, loanId: string) {
  selectedAssetForReturn.value = { assetUuid, loanId }
  nextTick(() => {
    returnAssetModal.value?.openModal()
  })
}

function handleReturnSubmit() {
  loadData()
}

const columns = computed(() => {
  const baseColumns = [
    {
      id: 'expand',
      cell: ({ row }: { row: Row<UserAsset> }) =>
        h(UButton, {
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
    },
    {
      accessorKey: 'asset',
      header: t('page.assetLoan.columns.asset'),
      cell: ({ row }: { row: Row<UserAsset> }) => {
        const asset = row.original.asset
        return h('div', { class: 'flex items-center gap-3' }, [
          h(UAvatar, {
            src: asset?.imageUrl,
            alt: asset?.name,
            size: 'lg',
            icon: 'i-lucide-image'
          }),
          h('div', undefined, [
            h('p', { class: 'font-medium text-highlighted text-xs' }, asset?.name || 'N/A'),
            h('p', { class: 'text-xs' }, asset?.code || 'N/A')
          ])
        ])
      }
    },
    {
      accessorKey: 'purpose',
      header: t('page.assetLoan.columns.purpose')
    },
    {
      accessorKey: 'assignedAt',
      header: t('page.assetLoan.columns.assignedAt')
    }
  ]

  if (activeTab.value === 'history') {
    baseColumns.push({
      accessorKey: 'returnedAt',
      header: t('page.assetLoan.columns.returnedAt')
    })
  }

  baseColumns.push({
    accessorKey: 'isRequest',
    header: t('page.assetLoan.columns.type'),
    cell: ({ row }: { row: Row<UserAsset> }) => {
      return h(UBadge, {
        color: row.original.isRequest ? 'warning' : 'success',
        variant: 'soft',
        size: 'sm'
      }, () => row.original.isRequest ? t('page.assetLoan.columns.request') : t('page.assetLoan.columns.assigned'))
    }
  } as any)

  if (activeTab.value === 'active') {
    baseColumns.push({
      id: 'actions',
      cell: ({ row }: { row: Row<UserAsset> }) => {
        if (row.original.isRequest) {
          return h(UButton, {
            label: t('page.assetLoan.columns.return'),
            color: 'primary',
            variant: 'subtle',
            size: 'xs',
            icon: 'i-lucide-undo-2',
            onClick: () => {
              const assetId = row.original.asset?.id
              if (assetId) {
                openReturnModal(assetId, row.original.id)
              }
            }
          })
        }
        return null
      }
    } as any)
  }

  return baseColumns
})
</script>

<template>
  <UDashboardPanel id="asset-loan">
    <template #header>
      <UDashboardNavbar :title="t('page.assetLoan.title')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
      <UDashboardToolbar>
        <UNavigationMenu
          :items="navigationItems[0]"
          highlight
          orientation="horizontal"
          class="-mx-1 flex-1"
        />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="overflow-x-auto">
        <UTable
          v-model:pagination="pagination"
          v-model:expanded="expanded"
          :data="assets"
          :columns="columns"
          :loading="loading"
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
            <div class="p-6 bg-muted border-t border-default space-y-4">
              <!-- Asset Details in Expanded View -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Asset Details</h4>
                  <div class="space-y-1">
                    <p class="text-sm"><span class="font-medium">{{ t('page.assetLoan.details.category') }}:</span> {{ row.original.asset?.subCategory?.name || '-' }}</p>
                    <p class="text-sm"><span class="font-medium">{{ t('page.assetLoan.details.brand') }}:</span> {{ row.original.asset?.brand || '-' }}</p>
                    <p class="text-sm"><span class="font-medium">{{ t('page.assetLoan.details.model') }}:</span> {{ row.original.asset?.model || '-' }}</p>
                    <p class="text-sm line-clamp-2"><span class="font-medium">{{ t('page.assetLoan.details.description') }}:</span> {{ row.original.asset?.description || '-' }}</p>
                  </div>
                </div>
              </div>

              <!-- Attachments -->
              <div v-if="row.original.attachmentUrls && row.original.attachmentUrls.length" class="border-t border-default pt-4">
                <div class="flex items-center gap-2 mb-3">
                  <UIcon name="i-lucide-paperclip" class="w-4 h-4 text-gray-500" />
                  <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {{ t('page.assetLoan.attachments') }} ({{ row.original.attachmentUrls.length }})
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
                      <span class="text-xs font-medium px-2 text-center truncate w-full">{{ t('page.assetLoan.document') }}</span>
                    </div>

                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <UIcon name="i-lucide-external-link" class="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                    </div>
                  </a>
                </div>
              </div>
              <div v-else class="border-t border-default pt-4 text-sm text-gray-500 italic flex items-center gap-2">
                <UIcon name="i-lucide-info" class="w-4 h-4" />
                {{ t('page.assetLoan.noAttachments') }}
              </div>
            </div>
          </template>

          <template #empty>
            <div class="flex flex-col items-center justify-center py-12">
              <UIcon name="i-lucide-package-open" class="w-12 h-12 text-gray-400 mb-4" />
              <p class="text-gray-500">{{ t('page.assetLoan.noAssets') }}</p>
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
          {{ t('common.showing') }} {{ showingFrom }} {{ t('common.to') }} {{ showingTo }} {{ t('common.of') }}
          {{ apiPagination.totalItems }} {{ t('common.results') }}
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <AssetLoanReturnModal
    ref="returnAssetModal"
    :asset-uuid="selectedAssetForReturn?.assetUuid ?? ''"
    :loan-id="selectedAssetForReturn?.loanId ?? ''"
    @returned="handleReturnSubmit"
  />
</template>
