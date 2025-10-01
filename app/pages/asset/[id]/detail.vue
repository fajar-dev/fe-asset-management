<script setup lang="ts">
const router = useRouter()
const route = useRoute()
const assetId = route.params.id as string

// state untuk menampung detail asset
const assetDetail = ref<any>(null)
const loading = ref(false)
const previewImage = ref<string | null>(null)

const { getAssetById } = useAsset()

function openImageModal(url: string) {
  previewImage.value = url
}
function closeImageModal() {
  previewImage.value = null
}

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
          <UCard class="lg:col-span-2">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <UIcon name="i-lucide-info" class="w-5 h-5" />
                  Asset Information
                </h3>
              </div>
            </template>

            <div class="space-y-6 mt-4">
              <!-- Basic Details -->
              <div class="flex flex-col md:flex-row md:items-start md:gap-6">
                <div v-if="assetDetail.imageUrl" class="flex justify-center md:justify-start mb-4 md:mb-0">
                  <div class="relative group">
                    <img
                      :src="assetDetail.imageUrl"
                      :alt="assetDetail.name"
                      class="w-100 h-50 object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer transition"
                      @click="openImageModal(assetDetail.imageUrl)"
                    >
                    <!-- Hover Overlay -->
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
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                  <!-- Item -->
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
                      <UIcon
                        :name="assetDetail.status === 'active' ? 'i-lucide-check-circle' : assetDetail.status === 'in_repair' ? 'i-lucide-wrench' : 'i-lucide-trash-2'"
                        :class="assetDetail.status === 'active' ? 'text-green-500 text-sm' : assetDetail.status === 'in_repair' ? 'text-yellow-500 text-sm' : 'text-red-500 text-sm'"
                        class="w-4 h-4"
                      />
                      <span class="text-gray-900 dark:text-white text-sm capitalize">
                        {{ assetDetail.status.replace('_', ' ') }}
                      </span>
                    </div>
                  </div>
                  <div
                    v-for="(item, idx) in assetDetail.customValues"
                    :key="idx"
                  >
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {{ item.name }}
                    </label>
                    <p class="text-gray-900 dark:text-white font-medium text-sm">
                      {{ item.value ?? '-' }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div v-if="assetDetail.description">
                <UDivider class="my-4" />
                <div>
                  <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                  <p class="text-gray-900 dark:text-white mt-1 text-sm whitespace-pre-wrap">
                    {{ assetDetail.description }}
                  </p>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Properties Card -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UIcon name="i-lucide-settings" class="w-5 h-5" />
                Properties
              </h3>
            </template>

            <div class="space-y-4 mt-4">
              <div
                v-for="prop in assetDetail.properties"
                :key="prop.id"
                class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ prop.property.name }}</label>
                <div class="mt-1">
                  <span v-if="prop.property.dataType === 'number'" class="text-gray-900 dark:text-white font-semibold text-lg">
                    {{ prop.value.toLocaleString() }}
                  </span>
                  <span v-else class="text-gray-900 dark:text-white font-medium">{{ prop.value }}</span>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
    <!-- Image Preview Modal -->
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
    <button
      class="absolute top-5 right-5 text-white text-3xl leading-none"
      @click="closeImageModal"
    >
      &times;
    </button>
  </div>
</template>
