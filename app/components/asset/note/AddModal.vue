<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAssetNote } from '~/composables/useAssetNote'
import { noteSchema, type NoteSchema } from '~/schemas/noteSchema'
import { formatCalendarDate, calendarDateToISOString } from '~/utils/date'

const { t } = useI18n()
const props = defineProps<{ assetId: string }>()
const emit = defineEmits<{ (e: 'created'): void }>()

const schema = noteSchema
type Schema = NoteSchema

const open = ref(false)
const saving = ref(false)

const state = reactive<Partial<Schema>>({
  occuredAt: '',
  note: ''
})

const occuredAtModel = ref<any>(null)

watch(occuredAtModel, (newDate) => {
  state.occuredAt = newDate ? calendarDateToISOString(newDate) : ''
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
  <UModal v-model:open="open" :title="t('modal.asset.note.addTitle')" :description="t('modal.asset.note.addSubtitle')">
    <UButton :label="t('modal.asset.note.addTitle')" icon="i-lucide-plus" />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField :label="t('modal.asset.note.date')" name="occuredAt" required>
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

        <UFormField :label="t('modal.asset.note.note')" name="note" required>
          <UTextarea
            v-model="state.note"
            :placeholder="t('modal.asset.note.note')"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            :label="t('modal.asset.note.cancel')"
            color="neutral"
            variant="subtle"
            :disabled="saving"
            @click="open = false"
          />
          <UButton
            :label="t('modal.asset.note.save')"
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
