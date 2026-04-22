<script lang="ts" setup>
import { useStatistic } from '~/composables/useStatistic'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

// register chart.js components
ChartJS.register(ArcElement, Tooltip, Legend)

const { t } = useI18n()
const router = useRouter()

const { assetsBySubCategory, getAssetsBySubCategory, loading } = useStatistic()

function getRandomColor(index: number): string {
  const hue = (index * 137.5) % 360
  return `hsl(${hue}, 65%, 55%)`
}

const chartData = computed(() => ({
  labels: assetsBySubCategory.value.map(item => item.name),
  datasets: [
    {
      data: assetsBySubCategory.value.map(item => item.value),
      backgroundColor: assetsBySubCategory.value.map((_, i) => getRandomColor(i)),
      borderWidth: 0
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) => `${ctx.label}: ${ctx.formattedValue}`
      }
    }
  }
}

function navigateToSubCategory(subCategoryId: string) {
  router.push({
    path: '/asset',
    query: { subCategoryId }
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
          {{ t('component.subCategoryChart.title') }}
        </p>
        <p class="text-xs text-muted mb-1.5">
          {{ t('component.subCategoryChart.subtitle') }}
        </p>
      </div>
    </template>

    <div v-if="loading" class="flex justify-center items-center h-[275px]">
      <USkeleton class="w-40 h-40 rounded-full" />
    </div>

    <div v-else-if="assetsBySubCategory.length" class="flex flex-col md:flex-row items-center gap-4">
      <div class="h-[275px] w-full md:w-1/2 flex justify-center">
        <Doughnut :data="chartData" :options="chartOptions" />
      </div>

      <div class="w-full md:w-1/2">
        <div class="flex flex-col gap-0 max-h-[275px] overflow-y-auto pr-2 custom-scrollbar">
          <button
            v-for="(subCategory, index) in assetsBySubCategory"
            :key="subCategory.id"
            class="flex items-center justify-between gap-2 px-2 py-1 rounded-lg text-xs font-medium bg-muted/10 hover:bg-muted/30 hover:text-primary transition-all cursor-pointer group"
            @click="navigateToSubCategory(subCategory.id)"
          >
            <div class="flex items-center gap-2 overflow-hidden">
              <div
                class="w-2.5 h-2.5 rounded-full shrink-0"
                :style="{ backgroundColor: getRandomColor(index) }"
              />
              <span class="truncate">{{ subCategory.name }}</span>
            </div>
            <span class="text-muted group-hover:text-primary shrink-0">{{ subCategory.value }}</span>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="flex justify-center items-center h-[275px] text-muted">
      {{ t('component.subCategoryChart.noData') }}
    </div>
  </UCard>
</template>
