<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useAssetHolder } from '~/composables/useAssetHolder'
import { useAssetMaintenance } from '~/composables/useAssetMaintenance'

const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const router = useRouter()
const route = useRoute()
const assetId = route.params.id as string

const requestModal = ref()

const assetDetail = ref<any>(null)
const loading = ref(false)
const previewImage = ref<string | null>(null)
const isUpdateModalOpen = ref(false)
const isStatusModalOpen = ref(false)

const { getAssetById, getAssetLogs } = useAsset()
const { statuses, loading: statusLoading, fetchAssetStatuses } = useAssetStatus()
const { holders, loading: holderLoading, fetchHolders } = useAssetHolder()
const { maintenances, loading: maintenanceLoading, fetchMaintenances } = useAssetMaintenance()

function openImageModal(url: string) {
  previewImage.value = url
}

function closeImageModal() {
  previewImage.value = null
}

function IDRFormat(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(Number(value))
}

async function loadHolders() {
  await fetchHolders(assetId, '', 1, 10)
}

async function loadMaintenances() {
  await fetchMaintenances(assetId, undefined, 1, 10)
}

async function loadAssetData() {
  loading.value = true
  const res = await getAssetById(assetId)
  if (res) {
    assetDetail.value = res.data
    await loadLogs()
    
    // Load related data
    const promises = []
    if (hasHolder.value) promises.push(loadHolders())
    if (hasMaintenance.value) promises.push(loadMaintenances())
    
    await Promise.all(promises)
  } else {
    await router.push(`/asset`)
  }
  loading.value = false
}

async function handleAssetUpdated() {
  await loadAssetData()
}

const hasHolder = computed(() => {
  return assetDetail.value?.subCategory?.category?.hasHolder ?? false
})

const hasMaintenance = computed(() => {
  return assetDetail.value?.subCategory?.category?.hasMaintenance ?? false
})

const hasActiveHolder = computed(() => {
  return holders.value?.some(h => !h.returnedAt)
})

onMounted(async () => {
  await loadAssetData()
})

const holderColumns: TableColumn<any>[] = [
  {
    accessorKey: 'employeeId',
    header: 'Employee',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-2 min-w-[120px]' }, [
        h(UAvatar, {
          src: row.original.employee.photoProfile,
          size: 'md'
        }),
        h('div', { class: 'min-w-0' }, [
          h('p', { class: 'font-medium text-highlighted text- truncate' }, row.original.employee.fullName),
          h('p', { class: 'text-xs opacity-70' }, row.original.employee.employeeId)
        ])
      ])
    }
  },
  { 
    accessorKey: 'purpose', 
    header: 'Purpose',
    cell: ({ row }) => h('p', { class: 'text-xs whitespace-normal min-w-[100px] line-clamp-2' }, row.original.purpose)
  },
  { 
    accessorKey: 'assignedAt', 
    header: 'Assigned',
    cell: ({ row }) => {
      const d = row.original.assignedAt ? new Date(row.original.assignedAt) : null
      return h('span', { class: 'text-xs whitespace-nowrap' }, d ? `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}` : '-')
    }
  },
  {
    accessorKey: 'returnedAt',
    header: 'Returned',
    cell: ({ row }) => {
      const d = row.original.returnedAt ? new Date(row.original.returnedAt) : null
      return h('span', { class: 'text-xs whitespace-nowrap' }, d ? `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}` : '-')
    }
  }
]

const maintenanceColumns: TableColumn<any>[] = [
  { 
    accessorKey: 'maintenanceAt', 
    header: 'Date',
    cell: ({ row }) => h('span', { class: 'text-xs whitespace-nowrap' }, row.original.maintenanceAt)
  },
  { 
    accessorKey: 'note', 
    header: 'Note',
    cell: ({ row }) => h('p', { class: 'text-xs whitespace-normal min-w-[120px]' }, row.original.note)
  }
]

const statusColumns: TableColumn<any>[] = [
  {
    accessorKey: 'type',
    header: 'Status',
    cell: ({ row }) => {
      const type = (row.original as any).type
      const colorMap: Record<string, 'success' | 'error' | 'warning' | 'primary' | 'neutral'> = {
        'active': 'success',
        'disposed': 'error',
        'sold': 'warning',
        'granted': 'primary'
      }
      return h(UBadge, { class: 'capitalize', variant: 'subtle', color: colorMap[type] || 'neutral', size: 'xs' }, () => type.replace('_', ' '))
    }
  },
  { 
    accessorKey: 'note', 
    header: 'Note', 
    cell: ({ row }) => h('p', { class: 'text-xs truncate max-w-[150px]' }, (row.original as any).note || '-') 
  },
  { 
    accessorKey: 'createdAt', 
    header: 'Date',
    cell: ({ row }) => h('span', { class: 'text-xs whitespace-nowrap' }, new Date((row.original as any).createdAt).toLocaleDateString('id-ID'))
  }
]

interface LocalTimelineItem {
  date?: string
  title?: string | any
  description?: string | any
  icon?: string
}

const items = ref<LocalTimelineItem[]>([])

function getIconByLogType(type: string): string {
  switch (type) {
    case 'asset': return 'i-lucide-package'
    case 'location': return 'i-lucide-map-pin'
    case 'holder': return 'i-lucide-users'
    case 'maintenance': return 'i-lucide-wrench'
    case 'note': return 'i-lucide-notebook-pen'
    default: return 'i-lucide-history'
  }
}

async function loadLogs() {
  const [logs, statusHistory] = await Promise.all([
    getAssetLogs(assetId),
    fetchAssetStatuses(assetId, 1, 50)
  ])

  const allItems: any[] = []

  if (logs) {
    logs.forEach((log: any) => {
      // If it's a status change log, we might want to skip it if we handle it via statusHistory
      // But let's keep it for now and see. Actually, it's better to show the more detailed statusHistory.
      // We can detect status change logs by their message or type.
      if (log.message.includes('Changed asset status to')) return

      allItems.push({
        date: new Date(log.createdAt),
        displayDate: new Date(log.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        title: log.message,
        description: log.user ? `by ${log.user.name}` : '',
        icon: getIconByLogType(log.type)
      })
    })
  }

  if (statusHistory?.data) {
    statusHistory.data.forEach((status: any) => {
      allItems.push({
        date: new Date(status.createdAt),
        displayDate: new Date(status.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        title: `Asset status changed to ${status.type}`,
        description: `by ${status.user?.name || 'Unknown'}${status.note ? ` - "${status.note}"` : ''}`,
        icon: 'i-lucide-activity'
      })
    })
  }

  // Sort all items by date DESC
  allItems.sort((a, b) => b.date.getTime() - a.date.getTime())

  items.value = allItems.map(item => ({
    date: item.displayDate,
    title: item.title,
    description: item.description,
    icon: item.icon
  }))
}
</script>

<template>
  <UDashboardPanel id="detail">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <UButton
              v-if="assetDetail?.isLendable"
              label="Request"
              icon="i-lucide-hand-helping"
              color="primary"
              variant="outline"
              :disabled="loading || hasActiveHolder"
              :ui="{ label: 'hidden sm:inline-block' }"
              @click="requestModal?.openModal()"
            />
            <UButton
              label="Change Status"
              icon="i-lucide-pencil"
              color="neutral"
              variant="outline"
              :disabled="loading"
              :ui="{ label: 'hidden sm:inline-block' }"
              @click="isStatusModalOpen = true"
            />
            <UButton
              label="Edit Asset"
              icon="i-lucide-pencil"
              color="primary"
              variant="solid"
              :disabled="loading"
              :ui="{ label: 'hidden sm:inline-block' }"
              @click="isUpdateModalOpen = true"
            />
          </div>
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
      <div v-if="loading">
        <div class="grid grid-cols-1 gap-6">
          <USkeleton class="h-64 w-full rounded-lg" />
        </div>
      </div>

      <div v-else-if="assetDetail">
        <div class="grid grid-cols-1 gap-6">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <UIcon name="i-lucide-info" class="w-5 h-5" />
                  Asset Information
                </h3>
              </div>
            </template>

            <div class="space-y-6 mt-4">
              <div class="flex flex-col md:flex-row md:items-start md:gap-6">
                <div v-if="assetDetail.imageUrl" class="flex justify-center md:justify-start mb-4 md:mb-0">
                  <div class="relative group">
                    <img
                      :src="assetDetail.imageUrl"
                      :alt="assetDetail.name"
                      class="w-full md:w-100 h-50 object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer transition"
                      @click="openImageModal(assetDetail.imageUrl)"
                    >
                    <div
                      class="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition rounded-lg pointer-events-none"
                    >
                      <UIcon
                        name="i-lucide-maximize-2"
                        class="w-8 h-8 text-white pointer-events-auto"
                        @click="openImageModal(assetDetail.imageUrl)"
                      />
                    </div>
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                  <div>
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Asset Name</label>
                    <p class="text-gray-900 dark:text-white font-medium text-sm">
                      {{ assetDetail.name }}
                    </p>
                  </div>

                  <div>
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Serial ID</label>
                    <p class="text-gray-900 dark:text-white font-mono text-sm">
                      {{ assetDetail.code }}
                    </p>
                  </div>

                  <div>
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Brand</label>
                    <p class="text-gray-900 dark:text-white font-medium text-sm">
                      {{ assetDetail.brand ?? '-' }}
                    </p>
                  </div>

                  <div>
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Model</label>
                    <p class="text-gray-900 dark:text-white font-medium text-sm">
                      {{ assetDetail.model ?? '-' }}
                    </p>
                  </div>

                  <div>
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Category</label>
                    <p class="text-gray-900 dark:text-white font-medium text-sm">
                      {{ assetDetail.subCategory.category.name }} > {{ assetDetail.subCategory.name }}
                    </p>
                  </div>

                  <div>
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                    <div class="flex items-center gap-2 mt-1">
                      <UTooltip :text="assetDetail.lastStatus?.note || 'No note provided'" :disabled="!assetDetail.lastStatus?.note">
                        <div class="flex items-center gap-2">
                          <UIcon
                            :name="assetDetail.lastStatus?.type === 'active' ? 'i-lucide-check-circle' : assetDetail.lastStatus?.type === 'disposed' ? 'i-lucide-trash-2' : assetDetail.lastStatus?.type === 'sold' ? 'i-lucide-shopping-cart' : assetDetail.lastStatus?.type === 'granted' ? 'i-lucide-gift' : 'i-lucide-info'"
                            :class="assetDetail.lastStatus?.type === 'active' ? 'text-green-500' : assetDetail.lastStatus?.type === 'disposed' ? 'text-red-500' : 'text-yellow-500'"
                            class="w-4 h-4"
                          />
                          <span class="text-gray-900 dark:text-white text-sm capitalize">
                            {{ assetDetail.lastStatus?.type ? assetDetail.lastStatus.type.replace('_', ' ') : '-' }}
                          </span>
                        </div>
                      </UTooltip>
                    </div>
                    <div v-if="assetDetail.lastStatus" class="mt-1 flex items-center justify-between">
                      <div>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          by {{ assetDetail.lastStatus.user?.name || '-' }}
                        </p>
                        <p v-if="assetDetail.lastStatus.note" class="text-xs text-gray-500 dark:text-gray-400 italic">
                          "{{ assetDetail.lastStatus.note }}"
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">User</label>
                    <p class="text-gray-900 dark:text-white font-medium text-sm">
                      {{ assetDetail.user }}
                    </p>
                  </div>

                  <div>
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Price</label>
                    <p class="text-gray-900 dark:text-white font-medium text-sm">
                      {{ IDRFormat(assetDetail.price) }}
                    </p>
                  </div>

                  <div>
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Purchase Date</label>
                    <p class="text-gray-900 dark:text-white font-medium text-sm">
                      {{ assetDetail.purchaseDate ? new Date(assetDetail.purchaseDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-' }}
                    </p>
                  </div>

                  <div>
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Age</label>
                    <p class="text-gray-900 dark:text-white font-medium text-sm">
                      {{ assetDetail.age ?? '-' }}
                    </p>
                  </div>

                  <div
                    v-for="(item, idx) in assetDetail.labels"
                    :key="idx"
                  >
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {{ item.key }}
                    </label>
                    <p class="text-gray-900 dark:text-white font-medium text-sm">
                      {{ item.value ?? '-' }}
                    </p>
                  </div>

                  <!-- Properties -->
                  <div
                    v-for="prop in assetDetail.properties"
                    :key="prop.id"
                  >
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {{ prop.property.name }}
                    </label>
                    <p v-if="prop.property.dataType === 'number'" class="text-gray-900 dark:text-white font-medium text-sm">
                      {{ prop.value.toLocaleString() }}
                    </p>
                    <p v-else class="text-gray-900 dark:text-white font-medium text-sm">
                      {{ prop.value }}
                    </p>
                  </div>
                </div>
              </div>

              <div v-if="assetDetail.description">
                <div>
                  <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                  <p class="text-gray-900 dark:text-white mt-1 text-sm whitespace-pre-wrap">
                    {{ assetDetail.description }}
                  </p>
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <div class="grid gap-6 mt-6 xl:grid-cols-3 lg:grid-cols-2 grid-cols-1">
          <!-- Timeline Section -->
          <div class="xl:col-span-1 lg:col-span-1 relative h-full min-h-[400px]">
            <div class="lg:absolute lg:inset-0 h-full w-full">
              <UCard 
                class="flex flex-col h-full" 
                :ui="{ 
                  body: 'flex-1 overflow-y-auto max-h-[500px] lg:max-h-none' 
                }"
              >
                <template #header>
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <UIcon name="i-lucide-history" class="w-5 h-5" />
                      Asset History
                    </h3>
                  </div>
                </template>
                
                <div v-if="items.length === 0" class="flex flex-col items-center justify-center p-6 h-[200px] text-gray-500">
                  <UIcon name="i-lucide-scroll-text" class="w-10 h-10 mb-2 opacity-30" />
                  <p class="text-sm">No data</p>
                </div>
                <div v-else class="p-2">
                  <UTimeline :items="items" />
                </div>
              </UCard>
            </div>
          </div>

          <!-- Holders & Maintenance Section -->
          <div
            v-if="hasHolder || hasMaintenance"
            class="grid gap-5 xl:col-span-2 lg:col-span-1 content-start"
          >
            <div v-if="hasHolder">
            <UCard>
              <template #header>
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <UIcon name="i-lucide-users" class="w-5 h-5" />
                    Asset Holders
                  </h3>
                  <UButton
                    label="See More"
                    variant="ghost"
                    color="primary"
                    size="sm"
                    trailing-icon="i-lucide-arrow-right"
                    :to="`/asset/${assetId}/holder`"
                  />
                </div>
              </template>
              <div class="overflow-x-auto">
                <UTable
                  :data="holders"
                  :columns="holderColumns"
                  :loading="holderLoading"
                  class="w-full"
                  :ui="{
                    base: 'table-auto border-separate border-spacing-0',
                    thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                    tbody: '[&>tr]:last:[&>td]:border-b-0',
                    th: 'py-2 px-3 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r whitespace-nowrap text-xs',
                    td: 'px-3 py-2 border-b border-default'
                  }"
                />
              </div>
            </UCard>
          </div>

          <div v-if="statuses?.length > 0">
            <UCard>
              <template #header>
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <UIcon name="i-lucide-activity" class="w-5 h-5" />
                    Status History
                  </h3>
                  <UButton
                    label="See More"
                    variant="ghost"
                    color="primary"
                    size="sm"
                    trailing-icon="i-lucide-arrow-right"
                    :to="`/asset/${assetId}/status`"
                  />
                </div>
              </template>
              <div class="overflow-x-auto">
                <UTable
                  :data="statuses.slice(0, 5)"
                  :columns="statusColumns"
                  :loading="statusLoading"
                  class="w-full"
                  :ui="{
                    base: 'table-auto border-separate border-spacing-0',
                    thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                    tbody: '[&>tr]:last:[&>td]:border-b-0',
                    th: 'py-2 px-3 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r whitespace-nowrap text-xs',
                    td: 'px-3 py-2 border-b border-default'
                  }"
                />
              </div>
            </UCard>
          </div>
          
          <div v-if="hasMaintenance">
            <UCard>
              <template #header>
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <UIcon name="i-lucide-wrench" class="w-5 h-5" />
                    Maintenance History
                  </h3>
                  <UButton
                    label="See More"
                    variant="ghost"
                    color="primary"
                    size="sm"
                    trailing-icon="i-lucide-arrow-right"
                    :to="`/asset/${assetId}/maintenance`"
                  />
                </div>
              </template>
              <div class="overflow-x-auto">
                <UTable
                  :data="maintenances"
                  :columns="maintenanceColumns"
                  :loading="maintenanceLoading"
                  class="w-full"
                  :ui="{
                    base: 'table-auto border-separate border-spacing-0',
                    thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                    tbody: '[&>tr]:last:[&>td]:border-b-0',
                    th: 'py-2 px-3 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r whitespace-nowrap text-xs',
                    td: 'px-3 py-2 border-b border-default'
                  }"
                />
              </div>
            </UCard>
          </div>
          </div>
        </div>
      </div>

    </template>
  </UDashboardPanel>

  <!-- Image Preview Modal -->
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
    <button
      class="absolute top-5 right-5 text-white text-3xl leading-none"
      @click="closeImageModal"
    >
      &times;
    </button>
  </div>

  <!-- Update Asset Modal -->
  <AssetUpdateModal
    v-model="isUpdateModalOpen"
    :asset-id="assetId"
    @updated="handleAssetUpdated"
  />

  <!-- Change Status Modal -->
  <AssetStatusModal
    v-model="isStatusModalOpen"
    :asset-id="assetId"
    :current-status="assetDetail?.lastStatus?.type"
    @updated="handleAssetUpdated"
  />

  <!-- Request Asset Modal -->
  <AssetLoanRequestModal
    ref="requestModal"
    :asset-id="assetId"
    @requested="handleAssetUpdated"
  />
</template>
