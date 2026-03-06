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

const { dataQuality, getDataQuality, loading } = useStatistic()

onMounted(() => {
  getDataQuality()
})

const chartData = computed(() => ({
  labels: dataQuality.value.map(item => item.name),
  datasets: [
    {
      label: 'Missing Count',
      data: dataQuality.value.map(item => item.value),
      backgroundColor: '#f97316', // orange-500
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
          Data Quality
        </h3>
        <p class="text-xs text-muted">
          Missing asset information overview
        </p>
      </div>
    </template>

    <div v-if="loading" class="flex justify-center items-center h-[275px]">
      <USkeleton class="w-full h-full rounded-lg" />
    </div>

    <div v-else-if="dataQuality.length" class="h-[275px]">
      <Bar :data="chartData" :options="chartOptions" />
    </div>

    <div v-else class="flex justify-center items-center h-[275px] text-muted text-sm italic">
      No data available
    </div>
  </UCard>
</template>
