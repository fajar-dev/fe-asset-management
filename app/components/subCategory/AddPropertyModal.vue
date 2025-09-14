<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useSubCategory } from '~/composables/useSubCategory'
import { propertyService } from '~/services/PropertyService'

const props = defineProps<{
  id: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated'): void
}>()

const schema = z.object({
  name: z.string().min(1, 'Property name is required'),
  dataType: z.enum(['string', 'number'], { message: 'Type is required' })
})
type Schema = z.output<typeof schema>

// state
const saving = ref(false)
const state = reactive<Partial<Schema>>({
  name: '',
  dataType: 'string'
})
const subCategoryName = ref('')

// composables
const { getSubCategoryById } = useSubCategory()

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      resetForm()
      if (props.id) {
        const detail = await getSubCategoryById(props.id)
        subCategoryName.value = detail?.data?.name || ''
      }
    }
  }
)

function resetForm() {
  state.name = ''
  state.dataType = 'string'
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    await propertyService.createProperty(props.id, {
      name: event.data.name,
      dataType: event.data.dataType
    })
    emit('updated')
    emit('update:modelValue', false)
    resetForm()
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    :open="props.modelValue"
    title="Add Property"
    :description="`Add new property for ${subCategoryName}`"
    @update:open="emit('update:modelValue', $event)"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name">
          <UInput
            v-model="state.name"
            class="w-full"
            placeholder="Property name"
          />
        </UFormField>

        <UFormField label="Type" name="dataType">
          <USelectMenu
            v-model="state.dataType"
            :items="['string', 'number']"
            placeholder="Select type"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            :disabled="saving"
            @click="emit('update:modelValue', false)"
          />
          <UButton
            label="Add"
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
