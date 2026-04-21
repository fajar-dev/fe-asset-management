<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { CalendarDate } from '@internationalized/date'
import { useAssetNote } from '~/composables/useAssetNote'
import { noteSchema, type NoteSchema } from '~/schemas/noteSchema'
import { formatCalendarDate, calendarDateToISOString } from '~/utils/date'

const props = defineProps<{
  assetId: string
  noteId: string | null
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'updated'): void
  (e: 'update:open', value: boolean): void
}>()

const schema = noteSchema
type Schema = NoteSchema

const formData = reactive<Schema>({
  occuredAt: '',
  note: ''
})

const occuredAtModel = ref<any>(null)

watch(occuredAtModel, (newDate) => {
  formData.occuredAt = newDate ? calendarDateToISOString(newDate) : ''
})

const saving = ref(false)
const loading = ref(false)

const { getNoteById, updateNote } = useAssetNote()

/** Load existing note data */
async function loadNoteData() {
  if (!props.assetId || !props.noteId) return

  loading.value = true
  try {
    const response = await getNoteById(props.assetId, props.noteId)
    if (response?.data) {
      const dateStr = response.data.occuredAt?.split('T')[0] || ''
      Object.assign(formData, {
        occuredAt: dateStr,
        note: response.data.note || ''
      })

      if (dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number)
        if (year && month && day) {
          occuredAtModel.value = new CalendarDate(year, month, day)
        }
      }
    }
  } catch (error) {
    console.error('Failed to load note:', error)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && props.noteId) {
      await loadNoteData()
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

/** Reset form */
function resetForm() {
  Object.assign(formData, {
    occuredAt: '',
    note: ''
  })
  occuredAtModel.value = null
}

/** Submit */
async function onSubmit(_event: FormSubmitEvent<Schema>) {
  if (!props.assetId || !props.noteId) return

  saving.value = true
  try {
    await updateNote(props.assetId, props.noteId, { ...formData })
    emit('updated')
    emit('update:open', false)
    resetForm()
  } catch (error) {
    console.error('Failed to update note:', error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Edit Note"
    description="Update note details"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="formData"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Date" name="occuredAt" required>
          <UPopover :popper="{ placement: 'bottom-start' }">
            <UButton
              icon="i-lucide-calendar"
              :label="formatCalendarDate(occuredAtModel)"
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
            v-model="formData.note"
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
            @click="emit('update:open', false)"
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
