<script lang="ts" setup>
import { useStatistic } from '~/composables/useStatistic'

const router = useRouter()

const { assetsBySubCategory, getAssetsBySubCategory, loading } = useStatistic()

function getRandomColor(index: number): string {
  const hue = (index * 137.5) % 360
  return `hsl(${hue}, 65%, 55%)`
}

const chartData = computed(() =>
  assetsBySubCategory.value.map(item => item.value)
)

const chartLabels = computed(() =>
  assetsBySubCategory.value.map((item, idx) => ({
    name: item.name,
    color: getRandomColor(idx)
  }))
)

function navigateToSubCategory(subCategoryId: string) {
  router.push({
    path: '/asset',
    query: {
      subCategoryId
    }
  })
}

onMounted(() => {
  getAssetsBySubCategory()
})
</script>

<template>
  <UCard class="shrink-0">
    <template #header>
      <div>
        <p class="text-highlighted font-semibold">
          Sub Category
        </p>
        <p class="text-xs text-muted mb-1.5">
          Asset by Sub Category
        </p>
      </div>
    </template>

    <div v-if="loading" class="flex justify-center items-center h-[275px]">
      <USkeleton class="w-40 h-40 rounded-full" />
    </div>

    <div v-else-if="chartData.length" class="space-y-4">
      <DonutChart
        :data="chartData"
        :labels="chartLabels"
        :height="275"
        :hide-legend="true"
        :radius="0"
      />

      <div class="space-y-1">
        <div class="flex flex-wrap gap-1">
          <button
            v-for="(subCategory, index) in assetsBySubCategory"
            :key="subCategory.id"
            class="flex items-center gap-1 px-1 py-0.5 rounded-md text-xs font-medium bg-muted/20 hover:bg-elevated hover:text-primary transition-all cursor-pointer"
            @click="navigateToSubCategory(subCategory.id)"
          >
            <div
              class="w-2 h-2 rounded-full"
              :style="{ backgroundColor: getRandomColor(index) }"
            />
            <span>{{ subCategory.name }} ({{ subCategory.value }})</span>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="flex justify-center items-center h-[275px] text-muted">
      No data available
    </div>
  </UCard>
</template>
