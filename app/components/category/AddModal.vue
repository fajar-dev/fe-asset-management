<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useCategory } from '~/composables/useCategory'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  hasLocation: z.boolean().default(false),
  hasMaintenance: z.boolean().default(false),
  hasHolder: z.boolean().default(false)
})

type Schema = z.output<typeof schema>

const emit = defineEmits<{ (e: 'created'): void }>()
const open = ref(false)
const saving = ref(false)

const state = reactive<Partial<Schema>>({
  name: '',
  hasLocation: false,
  hasMaintenance: false,
  hasHolder: false
})

const { createCategory } = useCategory()

function resetForm() {
  state.name = ''
  state.hasLocation = false
  state.hasMaintenance = false
  state.hasHolder = false
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  await createCategory({
    name: event.data.name,
    hasLocation: event.data.hasLocation,
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
        <!-- Name -->
        <UFormField label="Name" name="name" required>
          <UInput v-model="state.name" class="w-full" placeholder="Category name" />
        </UFormField>

        <!-- Has Location -->
        <UFormField name="hasLocation">
          <div class="flex items-center gap-2">
            <USwitch v-model="state.hasLocation" label="Has Location" />
            <UTooltip text="Enable if this category involves asset locations" :delay-duration="0">
              <UIcon name="i-lucide-info" class="w-4 h-4 text-gray-500 cursor-pointer" />
            </UTooltip>
          </div>
        </UFormField>

        <!-- Has Maintenance -->
        <UFormField name="hasMaintenance">
          <div class="flex items-center gap-2">
            <USwitch v-model="state.hasMaintenance" label="Has Maintenance" />
            <UTooltip text="Enable if this category requires maintenance tracking" :delay-duration="0">
              <UIcon name="i-lucide-info" class="w-4 h-4 text-gray-500 cursor-pointer" />
            </UTooltip>
          </div>
        </UFormField>

        <!-- Has Holder -->
        <UFormField name="hasHolder">
          <div class="flex items-center gap-2">
            <USwitch v-model="state.hasHolder" label="Has Holder" />
            <UTooltip text="Enable if this category is assigned to a person or holder" :delay-duration="0">
              <UIcon name="i-lucide-info" class="w-4 h-4 text-gray-500 cursor-pointer" />
            </UTooltip>
          </div>
        </UFormField>

        <!-- Action Buttons -->
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
