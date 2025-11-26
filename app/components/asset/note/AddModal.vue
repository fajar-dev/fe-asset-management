<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
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

const { createNote } = useAssetNote()

function resetForm() {
  state.occuredAt = ''
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
          <UInput
            v-model="state.occuredAt"
            type="date"
            class="w-full"
          />
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
