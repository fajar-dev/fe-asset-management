<script lang="ts" setup>
import { useStatistic } from '~/composables/useStatistic'

const router = useRouter()

// composable
const { assetsByCategory, getAssetsByCategory, loading } = useStatistic()

function getRandomColor(index: number): string {
  const hue = (index * 137.5) % 360
  return `hsl(${hue}, 65%, 55%)`
}

const chartData = computed(() =>
  assetsByCategory.value.map(item => item.value)
)

const chartLabels = computed(() =>
  assetsByCategory.value.map((item, idx) => ({
    name: item.name,
    color: getRandomColor(idx)
  }))
)

function navigateToCategory(categoryId: string) {
  router.push({
    path: '/asset',
    query: {
      categoryId
    }
  })
}

onMounted(() => {
  getAssetsByCategory()
})
</script>

<template>
  <UCard class="shrink-0">
    <template #header>
      <div>
        <p class="text-highlighted font-semibold">
          Category
        </p>
        <p class="text-xs text-muted mb-1.5">
          Asset by Category
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
            v-for="(category, index) in assetsByCategory"
            :key="category.id"
            class="flex items-center gap-1 px-1 py-0.5 rounded-md text-xs font-medium bg-muted/20 hover:bg-elevated hover:text-primary transition-all cursor-pointer"
            @click="navigateToCategory(category.id)"
          >
            <div
              class="w-2 h-2 rounded-full"
              :style="{ backgroundColor: getRandomColor(index) }"
            />
            <span>{{ category.name }} ({{ category.value }})</span>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="flex justify-center items-center h-[275px] text-muted">
      No data available
    </div>
  </UCard>
</template>
