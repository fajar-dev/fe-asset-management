<script lang="ts" setup>
import { useStatistic } from '~/composables/useStatistic'

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

    <DonutChart
      v-else-if="chartData.length"
      :data="chartData"
      :labels="chartLabels"
      :height="275"
      :hide-legend="false"
      :radius="0"
    />

    <div v-else class="flex justify-center items-center h-[275px] text-muted">
      No data available
    </div>
  </UCard>
</template>
