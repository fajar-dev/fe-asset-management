<script lang="ts" setup>
import { useStatistic } from '~/composables/useStatistic'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const { assetAging, getAssetAging, loading } = useStatistic()

onMounted(() => {
  getAssetAging()
})

const agingColors = [
  '#22c55e', // green-500 (0-2 Years)
  '#eab308', // yellow-500 (3-5 Years)
  '#ef4444'  // red-500 (>=5 Years)
]

const chartData = computed(() => ({
  labels: assetAging.value.map(item => item.name),
  datasets: [
    {
      label: 'Count',
      data: assetAging.value.map(item => item.value),
      backgroundColor: agingColors,
      borderRadius: 4
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
        label: (ctx: any) => `${ctx.formattedValue} assets`
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0
      }
    },
    x: {
      ticks: {
        font: {
          size: 11
        }
      }
    }
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div>
        <h3 class="text-highlighted font-semibold">
          Asset Aging
        </h3>
        <p class="text-xs text-muted">
          Asset distribution by age
        </p>
      </div>
    </template>

    <div v-if="loading" class="flex justify-center items-center h-[275px]">
      <USkeleton class="w-full h-full rounded-lg" />
    </div>

    <div v-else-if="assetAging.length" class="h-[275px]">
      <Bar :data="chartData" :options="chartOptions" />
    </div>

    <div v-else class="flex justify-center items-center h-[275px] text-muted text-sm italic">
      No data available
    </div>
  </UCard>
</template>
