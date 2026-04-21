<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAssetStatus } from '~/composables/useAssetStatus'
import { assetStatusSchema as schema, type AssetStatusSchema as Schema } from '~/schemas/statusSchema'

const props = defineProps<{
  assetId: string
  currentStatus?: string
}>()

const emit = defineEmits<{
  (e: 'updated'): void
}>()

const open = defineModel<boolean>()
const { updateAssetStatus, loading } = useAssetStatus()


const state = reactive({
  type: undefined as any,
  note: ''
})

watch(open, (isOpen) => {
  if (isOpen) {
    state.type = props.currentStatus || 'active'
    state.note = ''
  }
})

const statusOptions = [
  { label: 'Active', value: 'active', icon: 'i-lucide-check-circle', color: 'text-green-500' },
  { label: 'Sold', value: 'sold', icon: 'i-lucide-shopping-cart', color: 'text-yellow-500' },
  { label: 'Granted', value: 'granted', icon: 'i-lucide-gift', color: 'text-blue-500' },
  { label: 'Disposed', value: 'disposed', icon: 'i-lucide-trash-2', color: 'text-red-500' }
]

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    await updateAssetStatus(props.assetId, event.data)
    open.value = false
    emit('updated')
  } catch (error) {
    // Error is handled in composable
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Change Asset Status"
    description="Update the current status of this asset"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Status" name="type" required>
          <USelectMenu
            v-model="state.type"
            :items="statusOptions"
            value-key="value"
            label-key="label"
            placeholder="Select new status"
            class="w-full"
          >
            <template #item="{ item }">
              <div class="flex items-center gap-2">
                <UIcon :name="item.icon" :class="item.color" class="w-4 h-4" />
                <span>{{ item.label }}</span>
              </div>
            </template>
          </USelectMenu>
        </UFormField>

        <UFormField label="Note" name="note">
          <UTextarea
            v-model="state.note"
            class="w-full"
            placeholder="Optional note about this status change..."
          />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            :disabled="loading"
            @click="open = false"
          />
          <UButton
            label="Update Status"
            color="primary"
            variant="solid"
            type="submit"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
