<script setup lang="ts">
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Home" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <HomeStats />

      <div class="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <HomeCategoryChart />
        <HomeSubCategoryChart />
      </div>
    </template>
  </UDashboardPanel>
</template>
