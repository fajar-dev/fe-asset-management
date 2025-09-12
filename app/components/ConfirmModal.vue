<script setup lang="ts">
const props = withDefaults(defineProps<{
  title?: string
  description?: string
  confirmLabel?: string
  onConfirm?: () => Promise<void> | void
}>(), {
  title: 'Confirm',
  description: 'Are you sure?',
  confirmLabel: 'Confirm'
})

const emit = defineEmits(['update:open'])

async function handleConfirm() {
  if (props.onConfirm) await props.onConfirm()
}

function handleCancel() {
  emit('update:open', false)
}
</script>

<template>
  <UModal>
    <template #header>
      <div class="flex items-start justify-between w-full">
        <div class="flex flex-col">
          <h3 class="text-lg font-semibold">
            {{ title }}
          </h3>
          <p v-if="description" class="text-gray-500 text-sm">
            {{ description }}
          </p>
        </div>
        <UButton
          icon="i-heroicons-x-mark"
          color="neutral"
          variant="ghost"
          class="ml-4 shrink-0"
          @click="handleCancel"
        />
      </div>
    </template>

    <template #body>
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="subtle"
          @click="handleCancel"
        />
        <UButton
          :label="confirmLabel"
          color="error"
          variant="solid"
          loading-auto
          @click="handleConfirm"
        />
      </div>
    </template>
  </UModal>
</template>
