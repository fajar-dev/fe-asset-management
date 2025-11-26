<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAssetNote } from '~/composables/useAssetNote'

const props = defineProps<{
  assetId: string
  noteId: string | null
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'updated'): void
  (e: 'update:open', value: boolean): void
}>()

// Validasi schema
const schema = z.object({
  occuredAt: z.string().min(1, 'Date is required'),
  note: z.string().min(1, 'Note is required')
})
type Schema = z.output<typeof schema>

const formData = reactive<Schema>({
  occuredAt: '',
  note: ''
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
      Object.assign(formData, {
        occuredAt: response.data.occuredAt?.split('T')[0] || '',
        note: response.data.note || ''
      })
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
          <UInput
            v-model="formData.occuredAt"
            type="date"
            class="w-full"
          />
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
