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

const { assetsByLocation, getAssetsByLocation, loading } = useStatistic()

function getRandomColor(index: number): string {
  const hue = (index * 137.5) % 360
  return `hsl(${hue}, 65%, 55%)`
}

// data dan label
const chartData = computed(() => ({
  labels: assetsByLocation.value.map(item => item.name),
  datasets: [
    {
      data: assetsByLocation.value.map(item => item.value),
      backgroundColor: assetsByLocation.value.map((_, idx) => getRandomColor(idx)),
      borderWidth: 2,
      borderColor: '#fff',
      hoverOffset: 8
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true }
  },
  cutout: '65%'
}

function navigateToLocation(locationId: string) {
  router.push({
    path: '/asset',
    query: {
      locationId
    }
  })
}

onMounted(() => {
  getAssetsByLocation()
})
</script>

<template>
  <UCard class="shrink-0">
    <template #header>
      <div>
        <p class="text-highlighted font-semibold">
          {{ t('component.locationChart.title') }}
        </p>
        <p class="text-xs text-muted mb-1.5">
          {{ t('component.locationChart.subtitle') }}
        </p>
      </div>
    </template>

    <div v-if="loading" class="flex justify-center items-center h-[275px]">
      <USkeleton class="w-40 h-40 rounded-full" />
    </div>

    <div v-else-if="assetsByLocation.length" class="flex flex-col md:flex-row items-center gap-4">
      <div class="h-[275px] w-full md:w-1/2 flex justify-center">
        <Doughnut :data="chartData" :options="chartOptions" />
      </div>

      <div class="w-full md:w-1/2">
        <div class="flex flex-col gap-0 max-h-[275px] overflow-y-auto pr-2 custom-scrollbar">
          <button
            v-for="(location, index) in assetsByLocation"
            :key="location.id"
            class="flex items-center justify-between gap-2 px-2 py-1 rounded-lg text-xs font-medium bg-muted/10 hover:bg-muted/30 hover:text-primary transition-all cursor-pointer group"
            @click="navigateToLocation(location.id)"
          >
            <div class="flex items-center gap-2 overflow-hidden">
              <div
                class="w-2.5 h-2.5 rounded-full shrink-0"
                :style="{ backgroundColor: getRandomColor(index) }"
              />
              <span class="truncate">{{ location.name }} - {{ location.branch }}</span>
            </div>
            <span class="text-muted group-hover:text-primary shrink-0">{{ location.value }}</span>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="flex justify-center items-center h-[275px] text-muted">
      {{ t('component.locationChart.noData') }}
    </div>
  </UCard>
</template>
