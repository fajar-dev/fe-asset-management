<script lang="ts" setup>
import { useStatistic } from '~/composables/useStatistic'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const { t } = useI18n()
const router = useRouter()

const { assetsByCategory, getAssetsByCategory, loading } = useStatistic()

const isExpanded = ref(false)
const itemsLimit = 10

const displayedCategories = computed(() => {
  if (isExpanded.value) return assetsByCategory.value
  return assetsByCategory.value.slice(0, itemsLimit)
})

function getRandomColor(index: number): string {
  const hue = (index * 137.5) % 360
  return `hsl(${hue}, 65%, 55%)`
}

const chartData = computed(() => ({
  labels: assetsByCategory.value.map(item => item.name),
  datasets: [
    {
      data: assetsByCategory.value.map(item => item.value),
      backgroundColor: assetsByCategory.value.map((_, i) => getRandomColor(i)),
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

function navigateToCategory(categoryId: string) {
  router.push({
    path: '/asset',
    query: { categoryId }
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
          {{ t('component.categoryChart.title') }}
        </p>
        <p class="text-xs text-muted mb-1.5">
          {{ t('component.categoryChart.title') }}
        </p>
      </div>
    </template>

    <div v-if="loading" class="flex justify-center items-center h-[275px]">
      <USkeleton class="w-40 h-40 rounded-full" />
    </div>

    <div v-else-if="assetsByCategory.length" class="flex flex-col md:flex-row items-center gap-4">
      <div class="h-[275px] w-full md:w-1/2 flex justify-center">
        <Doughnut :data="chartData" :options="chartOptions" />
      </div>

      <div class="w-full md:w-1/2">
        <div class="flex flex-col gap-1 max-h-[275px] overflow-y-auto pr-2 custom-scrollbar">
          <button
            v-for="(category, index) in displayedCategories"
            :key="category.id"
            class="flex items-center justify-between gap-2 px-2 py-1 rounded-lg text-xs font-medium bg-muted/10 hover:bg-muted/30 hover:text-primary transition-all cursor-pointer group"
            @click="navigateToCategory(category.id)"
          >
            <div class="flex items-center gap-2 overflow-hidden">
              <div
                class="w-2.5 h-2.5 rounded-full shrink-0"
                :style="{ backgroundColor: getRandomColor(index) }"
              />
              <span class="truncate">{{ category.name }}</span>
            </div>
            <span class="text-muted group-hover:text-primary shrink-0">{{ category.value }}</span>
          </button>
        </div>

        <div v-if="assetsByCategory.length > itemsLimit" class="mt-2 text-center">
          <UButton
            variant="ghost"
            color="neutral"
            size="xs"
            :icon="isExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            :label="isExpanded ? t('component.categoryChart.showLess') : t('component.categoryChart.readMore')"
            @click="isExpanded = !isExpanded"
          />
        </div>
      </div>
    </div>

    <div v-else class="flex justify-center items-center h-[275px] text-muted">
      {{ t('component.categoryChart.noData') }}
    </div>
  </UCard>
</template>
