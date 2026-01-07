<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { CalendarDate } from '@internationalized/date'
import { useAssetHolder } from '~/composables/useAssetHolder'

const props = defineProps<{
  assetId: string
  holderId: string
}>()

const emit = defineEmits<{ (e: 'returned'): void }>()

// validation schema
const schema = z.object({
  returnedAt: z.string().min(1, 'Returned date is required')
})

type Schema = z.output<typeof schema>

const open = ref(false)
const saving = ref(false)

const state = reactive<Partial<Schema>>({
  returnedAt: ''
})

const returnedDateModel = ref<any>(null)

function formatDateDisplay(date: any): string {
  if (!date) return 'Select a date'
  
  const day = String(date.day).padStart(2, '0')
  const month = String(date.month).padStart(2, '0')
  const year = date.year
  
  return `${day}/${month}/${year}`
}

function calendarDateToString(date: any): string {
  const year = date.year
  const month = String(date.month).padStart(2, '0')
  const day = String(date.day).padStart(2, '0')
  return `${year}-${month}-${day}`
}

watch(returnedDateModel, (newDate) => {
  if (newDate) {
    state.returnedAt = calendarDateToString(newDate)
  } else {
    state.returnedAt = ''
  }
})

const { returnHolder } = useAssetHolder()

function resetForm() {
  state.returnedAt = ''
  returnedDateModel.value = null
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  await returnHolder(props.assetId, props.holderId, {
    returnedAt: event.data.returnedAt
  })
  resetForm()
  open.value = false
  emit('returned')
  saving.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Return Asset"
    description="Set the return date for this asset"
  >
    <UButton
      label="Return Asset"
      icon="i-lucide-rotate-ccw"
      size="xs"
      color="primary"
    />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Returned At" name="returnedAt" required>
          <UPopover :popper="{ placement: 'bottom-start' }">
            <UButton
              icon="i-lucide-calendar"
              :label="returnedDateModel ? formatDateDisplay(returnedDateModel) : 'Select a date'"
              variant="subtle"
              color="neutral"
              class="w-full justify-start"
            />
            <template #content>
              <UCalendar v-model="returnedDateModel" class="p-2" />
            </template>
          </UPopover>
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
