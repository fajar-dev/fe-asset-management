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
          Location
        </p>
        <p class="text-xs text-muted mb-1.5">
          Asset by Location
        </p>
      </div>
    </template>

    <div v-if="loading" class="flex justify-center items-center h-[275px]">
      <USkeleton class="w-40 h-40 rounded-full" />
    </div>

    <div v-else-if="assetsByLocation.length" class="space-y-4">
      <div class="h-[275px]">
        <Doughnut :data="chartData" :options="chartOptions" />
      </div>

      <div class="flex flex-wrap gap-1">
        <button
          v-for="(location, index) in assetsByLocation"
          :key="location.id"
          class="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-muted/20 hover:bg-elevated hover:text-primary transition-all cursor-pointer"
          @click="navigateToLocation(location.id)"
        >
          <div
            class="w-2 h-2 rounded-full"
            :style="{ backgroundColor: getRandomColor(index) }"
          />
          <span>{{ location.name }} - {{ location.branch }} ({{ location.value }})</span>
        </button>
      </div>
    </div>

    <div v-else class="flex justify-center items-center h-[275px] text-muted">
      No data available
    </div>
  </UCard>
</template>
