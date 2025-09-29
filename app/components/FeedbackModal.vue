<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { reactive, ref, computed, watch } from 'vue'
import { useFeedback } from '~/composables/useFeedback'

const props = defineProps<{
  open: boolean
  formState: {
    type: string
    description: string
    images: File[]
  }
}>()

const emit = defineEmits<{
  (e: 'created'): void
  (e: 'update:open', value: boolean): void
}>()

const schema = z.object({
  type: z.enum(['keluhan', 'saran', 'pujian']),
  description: z.string().min(1, 'Description is required'),
  images: z.array(z.instanceof(File)).min(1, 'At least 1 image is required').max(3, 'Maximum 3 images allowed')
})

type Schema = z.infer<typeof schema>

const state = reactive<Schema>({
  type: ['keluhan', 'saran', 'pujian'].includes(props.formState.type)
    ? (props.formState.type as 'keluhan' | 'saran' | 'pujian')
    : 'keluhan',
  description: props.formState.description,
  images: props.formState.images
})

watch(() => props.formState, (v) => {
  state.type = ['keluhan', 'saran', 'pujian'].includes(v.type) ? (v.type as 'keluhan' | 'saran' | 'pujian') : 'keluhan'
  state.description = v.description
  state.images = v.images
}, { deep: true })

const saving = ref(false)
const items = [
  { label: 'Keluhan', value: 'keluhan' },
  { label: 'Saran', value: 'saran' },
  { label: 'Pujian', value: 'pujian' }
]

const { createFeedback } = useFeedback()
const canAddMoreImages = computed(() => !state.images || state.images.length < 3)

function resetForm() {
  state.type = 'keluhan'
  state.description = ''
  state.images = []
}

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  saving.value = true
  await createFeedback(_event.data)
  resetForm()
  emit('created')
  emit('update:open', false)
  saving.value = false
}
</script>

<template>
  <div id="feedback-modal-screenshot">
    <UModal
      :open="props.open"
      title="Report an Issue"
      description="Please provide detailed information about the issue."
      @update:open="emit('update:open', $event)"
    >
      <template #body>
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-4 w-full"
          @submit="onSubmit"
        >
          <UFormField name="type">
            <URadioGroup
              v-model="state.type"
              indicator="end"
              variant="card"
              :items="items"
              orientation="horizontal"
              class="w-full"
            />
          </UFormField>

          <UFormField name="description">
            <UTextarea
              v-model="state.description"
              placeholder="Please describe your problem..."
              class="w-full"
              :rows="4"
            />
          </UFormField>

          <UFormField name="images">
            <UFileUpload
              v-model="state.images"
              layout="grid"
              multiple
              :interactive="false"
              class="w-full min-h-25"
            >
              <template #actions="{ open }">
                <UButton
                  label="Select images"
                  icon="i-lucide-upload"
                  color="neutral"
                  variant="outline"
                  :disabled="!canAddMoreImages"
                  @click="open()"
                />
              </template>

              <template #files-top="{ open, files }">
                <div v-if="files?.length" class="mb-2 flex items-center justify-between">
                  <p class="font-bold">
                    Screenshot ({{ files.length }})
                  </p>
                  <UButton
                    icon="i-lucide-plus"
                    label="Add more"
                    color="neutral"
                    variant="outline"
                    :disabled="!canAddMoreImages"
                    @click="open()"
                  />
                </div>
              </template>
            </UFileUpload>
          </UFormField>

          <div class="text-center text-sm text-gray-500">
            <span>- Feeback is a gift -</span>
          </div>

          <div class="flex justify-between items-center w-full">
            <UButton
              label="History"
              color="primary"
              variant="ghost"
              icon="i-lucide-history"
              to="/my-feedback"
              @click="emit('update:open', false)"
            />
            <div class="flex justify-end gap-2">
              <UButton
                label="Cancel"
                color="neutral"
                variant="subtle"
                :disabled="saving"
                @click="emit('update:open', false)"
              />
              <UButton
                label="Send"
                color="primary"
                variant="solid"
                type="submit"
                :loading="saving"
              />
            </div>
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
