<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { CalendarDate } from '@internationalized/date'
import { useAssetNote } from '~/composables/useAssetNote'

const props = defineProps<{ assetId: string }>()
const emit = defineEmits<{ (e: 'created'): void }>()

// Schema validasi
const schema = z.object({
occuredAt: z.string().min(1, 'Date is required'),
  note: z.string().min(1, 'Note is required')
})

type Schema = z.output<typeof schema>

const open = ref(false)
const saving = ref(false)

const state = reactive<Partial<Schema>>({
  occuredAt: '',
  note: ''
})

const occuredAtModel = ref<any>(null)

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

watch(occuredAtModel, (newDate) => {
  if (newDate) {
    state.occuredAt = calendarDateToString(newDate)
  } else {
    state.occuredAt = ''
  }
})

const { createNote } = useAssetNote()

function resetForm() {
  state.occuredAt = ''
  occuredAtModel.value = null
  state.note = ''
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  await createNote(props.assetId, {
    occuredAt: event.data.occuredAt,
    note: event.data.note || ''
  })
  resetForm()
  open.value = false
  emit('created')
  saving.value = false
}
</script>

<template>
  <UModal v-model:open="open" title="New Note" description="Add a new note record">
    <UButton label="Add Note" icon="i-lucide-plus" />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Date" name="occuredAt" required>
          <UPopover :popper="{ placement: 'bottom-start' }">
            <UButton
              icon="i-lucide-calendar"
              :label="occuredAtModel ? formatDateDisplay(occuredAtModel) : 'Select a date'"
              variant="subtle"
              color="neutral"
              class="w-full justify-start"
            />
            <template #content>
              <UCalendar v-model="occuredAtModel" class="p-2" />
            </template>
          </UPopover>
        </UFormField>

        <UFormField label="Note" name="note" required>
          <UTextarea
            v-model="state.note"
            placeholder="Note"
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
