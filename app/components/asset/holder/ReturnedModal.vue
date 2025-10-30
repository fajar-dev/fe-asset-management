<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
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

const { returnHolder } = useAssetHolder()

function resetForm() {
  state.returnedAt = ''
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
          <UInput
            v-model="state.returnedAt"
            type="date"
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
