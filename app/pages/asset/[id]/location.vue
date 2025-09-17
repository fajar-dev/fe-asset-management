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
    </template>
  </UDashboardPanel>
</template>
