<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAssetMaintenance } from '~/composables/useAssetMaintenance'

const props = defineProps<{ assetId: string }>()
const emit = defineEmits<{ (e: 'created'): void }>()

// Schema validasi
const schema = z.object({
  maintenanceAt: z.string().min(1, 'Date is required'),
  note: z.string().optional()
})

type Schema = z.output<typeof schema>

const open = ref(false)
const saving = ref(false)

const state = reactive<Partial<Schema>>({
  maintenanceAt: '',
  note: ''
})

const { createMaintenance } = useAssetMaintenance()

function resetForm() {
  state.maintenanceAt = ''
  state.note = ''
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  await createMaintenance(props.assetId, {
    maintenanceAt: event.data.maintenanceAt,
    note: event.data.note || ''
  })
  resetForm()
  open.value = false
  emit('created')
  saving.value = false
}
</script>

<template>
  <UModal v-model:open="open" title="New Maintenance" description="Add a new maintenance record">
    <UButton label="Add Maintenance" icon="i-lucide-plus" />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Date" name="maintenanceAt">
          <UInput
            v-model="state.maintenanceAt"
            type="date"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Note" name="note">
          <UTextarea
            v-model="state.note"
            placeholder="Optional note"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            :disabled="saving"
            @click="open = false"
          />
          <UButton
            label="Save"
            color="primary"
            variant="solid"
            type="submit"
            :loading="saving"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
