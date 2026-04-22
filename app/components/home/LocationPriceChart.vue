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

const { t } = useI18n()
const { priceByLocation, getPriceByLocation, loading } = useStatistic()

onMounted(() => {
  getPriceByLocation()
})

const chartData = computed(() => ({
  labels: priceByLocation.value.map(item => item.name),
  datasets: [
    {
      label: 'Total Price',
      data: priceByLocation.value.map(item => item.value),
      backgroundColor: '#10b981', // emerald-500
      borderRadius: 4
    }
  ]
}))

const chartOptions = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        title: (items: any) => {
          const index = items[0].dataIndex
          const item = priceByLocation.value[index]
          if (!item) return ''
          return `${item.name} (${item.branch})`
        },
        label: (ctx: any) => {
          return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
          }).format(ctx.raw)
        }
      }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: {
        callback: (value: any) => {
          return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
            notation: 'compact'
          }).format(value)
        }
      }
    },
    y: {
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
          {{ t('component.locationPriceChart.title') }}
        </h3>
        <p class="text-xs text-muted">
          {{ t('component.locationPriceChart.subtitle') }}
        </p>
      </div>
    </template>

    <div v-if="loading" class="flex justify-center items-center h-[300px]">
      <USkeleton class="w-full h-full rounded-lg" />
    </div>

    <div v-else-if="priceByLocation.length" class="h-[300px]">
      <Bar :data="chartData" :options="chartOptions" />
    </div>

    <div v-else class="flex justify-center items-center h-[300px] text-muted text-sm italic">
      {{ t('component.locationPriceChart.noData') }}
    </div>
  </UCard>
</template>
