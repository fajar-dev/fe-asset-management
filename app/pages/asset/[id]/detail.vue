<script setup lang="ts">
const router = useRouter()
const route = useRoute()
const assetId = route.params.id as string

// state untuk menampung detail asset
const assetDetail = ref<any>(null)
const loading = ref(false)

const { getAssetById } = useAsset()

onMounted(async () => {
  loading.value = true
  const res = await getAssetById(assetId)
  if (res) {
    assetDetail.value = res.data
  } else {
    await router.push(`/asset`)
  }
  loading.value = false
})
</script>

<template>
  <UDashboardPanel id="detail">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
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
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Loading state -->
          <div class="lg:col-span-2">
            <USkeleton class="h-64 w-full rounded-lg" />
          </div>
          <div>
            <USkeleton class="h-40 w-full rounded-lg" />
          </div>
        </div>
      </div>

      <div v-else-if="assetDetail">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main Information Card -->
          <UCard class="lg:col-span-2" variant="subtle">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <UIcon name="i-lucide-info" class="w-5 h-5" />
                  Asset Information
                </h3>
              </div>
            </template>

            <div class="space-y-6">
              <!-- Basic Details -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-3">
                  <div>
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Asset Name</label>
                    <p class="text-gray-900 dark:text-white font-medium text-sm">
                      {{ assetDetail.name }}
                    </p>
                  </div>

                  <div>
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Brand</label>
                    <p class="text-gray-900 dark:text-white font-medium text-sm">
                      {{ assetDetail.brand ?? '-' }}
                    </p>
                  </div>

                  <div>
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Category</label>
                    <p class="text-gray-900 dark:text-white font-medium text-sm">
                      {{ assetDetail.subCategory.category.name }} > {{ assetDetail.subCategory.name }}
                    </p>
                  </div>
                </div>

                <div class="space-y-3">
                  <div>
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Asset ID</label>
                    <p class="text-gray-900 dark:text-white font-mono text-sm">
                      {{ assetDetail.id }}
                    </p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Model</label>
                    <p class="text-gray-900 dark:text-white font-medium text-sm">
                      {{ assetDetail.model ?? '-' }}
                    </p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                    <div class="flex items-center gap-2">
                      <UIcon
                        :name="assetDetail.status === 'active'
                          ? 'i-lucide-check-circle'
                          : assetDetail.status === 'in_repair'
                            ? 'i-lucide-wrench'
                            : 'i-lucide-trash-2'"
                        :class="assetDetail.status === 'active'
                          ? 'text-green-500 text-sm'
                          : assetDetail.status === 'in_repair'
                            ? 'text-yellow-500 text-sm'
                            : 'text-red-500 text-sm'"
                        class="w-4 h-4"
                      />
                      <span class="text-gray-900 dark:text-white text-sm">{{ assetDetail.status }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div v-if="assetDetail.description">
                <UDivider class="my-4" />
                <div>
                  <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                  <p class="text-gray-900 dark:text-white mt-1 text-sm">
                    {{ assetDetail.description }}
                  </p>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Properties Card -->
          <UCard variant="subtle">
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UIcon name="i-lucide-settings" class="w-5 h-5" />
                Properties
              </h3>
            </template>

            <div class="space-y-4">
              <div
                v-for="prop in assetDetail.properties"
                :key="prop.id"
                class="p-3 bg-white dark:bg-gray-800/50 rounded-lg"
              >
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {{ prop.property.name }}
                    </label>
                    <div class="mt-1">
                      <span
                        v-if="prop.property.dataType === 'number'"
                        class="text-gray-900 dark:text-white font-semibold text-lg"
                      >
                        {{ prop.value.toLocaleString() }}
                      </span>
                      <span v-else class="text-gray-900 dark:text-white font-medium">
                        {{ prop.value }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
