<script lang="ts" setup>
const DonutData = [
  {
    color: '#3b82f6',
    name: 'Blue',
    value: 50
  },
  {
    color: '#a855f7',
    name: 'Gray',
    value: 20
  },
  {
    color: '#22c55e',
    name: 'Green',
    value: 30
  }
]
</script>

<template>
  <UCard class="shrink-0" :ui="{ body: '!px-0 !pt-0 !pb-3' }">
    <template #header>
      <div>
        <p class="text-xs text-muted uppercase mb-1.5">
          Revenue
        </p>
      </div>
    </template>
    <DonutChart
      :data="DonutData.map((i) => i.value)"
      :height="275"
      :labels="DonutData"
      :hide-legend="true"
      :radius="0"
    >
      <div class="absolute text-center">
        <div class="font-semibold">
          Label
        </div>
        <div class="text-muted">
          2 seconds ago
        </div>
      </div>
    </DonutChart>
  </UCard>
</template>
