<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useCategory } from '~/composables/useCategory'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  hasMaintenance: z.boolean().default(false),
  hasHolder: z.boolean().default(false)
})

type Schema = z.output<typeof schema>

const emit = defineEmits<{ (e: 'created'): void }>()
const open = ref(false)
const saving = ref(false)

const state = reactive<Partial<Schema>>({
  name: '',
  hasMaintenance: false,
  hasHolder: false
})

const { createCategory } = useCategory()

function resetForm() {
  state.name = ''
  state.hasMaintenance = false
  state.hasHolder = false
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  await createCategory({
    name: event.data.name,
    hasMaintenance: event.data.hasMaintenance,
    hasHolder: event.data.hasHolder
  })
  resetForm()
  open.value = false
  emit('created')
  saving.value = false
}
</script>

<template>
  <UModal v-model:open="open" title="New Category" description="Add a new category">
    <UButton label="New Category" icon="i-lucide-plus" />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name">
          <UInput v-model="state.name" class="w-full" placeholder="Category name" />
        </UFormField>

        <UFormField name="hasMaintenance">
          <USwitch v-model="state.hasMaintenance" label="Has Maintenance" />
        </UFormField>

        <UFormField name="hasHolder">
          <USwitch v-model="state.hasHolder" label="Has Holder" />
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
