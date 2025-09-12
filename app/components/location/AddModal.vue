<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useLocation } from '~/composables/useLocation'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  branch: z.string().min(1, 'Branch is required')
})

type Schema = z.output<typeof schema>

const emit = defineEmits<{ (e: 'created'): void }>()
const open = ref(false)
const saving = ref(false)

const state = reactive<Partial<Schema>>({
  name: '',
  branch: ''
})

const { createLocation } = useLocation()

function resetForm() {
  state.name = ''
  state.branch = ''
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  await createLocation({
    name: event.data.name,
    branch: event.data.branch
  })
  resetForm()
  open.value = false
  emit('created')
  saving.value = false
}
</script>

<template>
  <UModal v-model:open="open" title="New Location" description="Add a new location">
    <UButton label="New Location" icon="i-lucide-plus" />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name">
          <UInput v-model="state.name" class="w-full" placeholder="Location name" />
        </UFormField>

        <UFormField label="Branch" name="branch">
          <UInput v-model="state.branch" class="w-full" placeholder="Branch name" />
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
