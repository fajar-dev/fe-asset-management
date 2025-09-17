<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAssetHolder } from '~/composables/useAssetHolder'

const props = defineProps<{
  assetId: string
  disabled?: boolean
}>()
const emit = defineEmits<{ (e: 'created'): void }>()

// Validation schema
const schema = z.object({
  assignedAt: z.string().min(1, 'Assigned date is required'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  purpose: z.string().min(1, 'Purpose is required')
})

type Schema = z.output<typeof schema>

const open = ref(false)
const saving = ref(false)

const state = reactive<Partial<Schema>>({
  assignedAt: '',
  employeeId: '',
  purpose: ''
})

const { assignHolder } = useAssetHolder()

function resetForm() {
  state.assignedAt = ''
  state.employeeId = ''
  state.purpose = ''
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  await assignHolder(props.assetId, {
    purpose: event.data.purpose,
    assignedAt: event.data.assignedAt,
    employeeId: event.data.employeeId
  })
  resetForm()
  open.value = false
  emit('created')
  saving.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Assign Asset Holder"
    description="Assign a new employee to this asset"
  >
    <UButton
      label="Assign Holder"
      icon="i-lucide-plus"
      :disabled="props.disabled"
      @click="open = true"
    />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Assigned Date" name="assignedAt">
          <UInput
            v-model="state.assignedAt"
            type="date"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Employee ID" name="employeeId">
          <UInput
            v-model="state.employeeId"
            placeholder="Enter employee ID"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Purpose" name="purpose">
          <UTextarea
            v-model="state.purpose"
            placeholder="Enter purpose"
            class="w-full"
            :rows="3"
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
