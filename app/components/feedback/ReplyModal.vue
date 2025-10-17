<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useFeedback } from '~/composables/useFeedback'

/** Props */
const props = defineProps<{
  id: string | null
  open: boolean
}>()

/** Emits */
const emit = defineEmits<{
  (e: 'updated'): void
  (e: 'update:open', value: boolean): void
}>()

/** Zod schema */
const schema = z.object({
  status: z.enum([
    'new',
    'ignored',
    'noted',
    'need discussion',
    'accepted',
    'in progress',
    'done'
  ]),
  reply: z.string().min(1, 'Reply is required')
})
type Schema = z.output<typeof schema>

/** Reactive form state */
const formData = reactive<Schema>({
  status: 'new',
  reply: ''
})

const saving = ref(false)
const loading = ref(false)
const { getFeedbackById, updateFeedback } = useFeedback()

/** Load feedback detail by ID */
async function loadFeedbackData() {
  if (!props.id) return

  loading.value = true
  try {
    const response = await getFeedbackById(props.id)
    if (response?.data) {
      Object.assign(formData, {
        status: response.data.status ?? 'new',
        reply: response.data.reply ?? ''
      })
    }
  } catch (error) {
    console.error('Failed to load feedback:', error)
  } finally {
    loading.value = false
  }
}

/** Watch modal open state */
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && props.id) {
      await loadFeedbackData()
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

/** Reset form */
function resetForm() {
  Object.assign(formData, {
    status: 'new',
    reply: ''
  })
}

/** Submit form */
async function onSubmit(_event: FormSubmitEvent<Schema>) {
  if (!props.id) return

  saving.value = true
  try {
    await updateFeedback(props.id, { ...formData })
    emit('updated')
    emit('update:open', false)
    resetForm()
  } catch (error) {
    console.error('Failed to update feedback:', error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Update Feedback"
    description="Change feedback status or add a reply"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="formData"
        class="space-y-4"
        @submit="onSubmit"
      >
        <!-- Status Field -->
        <UFormField label="Status" name="status">
          <USelectMenu
            v-model="formData.status"
            :items="[
              { id: 'new', name: 'New' },
              { id: 'ignored', name: 'Ignored' },
              { id: 'noted', name: 'Noted' },
              { id: 'need discussion', name: 'Need Discussion' },
              { id: 'accepted', name: 'Accepted' },
              { id: 'in progress', name: 'In Progress' },
              { id: 'Done', name: 'Done' }

            ]"
            value-key="id"
            label-key="name"
            placeholder="Select status"
            class="w-full"
          />
        </UFormField>

        <!-- Reply Field -->
        <UFormField label="Reply" name="reply" required>
          <UTextarea
            v-model="formData.reply"
            placeholder="Write your reply..."
            row="4"
            class="w-full"
          />
        </UFormField>

        <!-- Buttons -->
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
