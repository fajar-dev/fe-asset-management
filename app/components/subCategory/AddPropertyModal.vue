<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { useSubCategory } from '~/composables/useSubCategory'
import { propertyService } from '~/services/PropertyService'
import { propertySchema as schema, type PropertySchema as Schema } from '~/schemas/subCategorySchema'

const { t } = useI18n()

const props = defineProps<{
  id: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated'): void
}>()

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
    :title="t('modal.subCategory.addPropertyTitle')"
    :description="`${t('modal.subCategory.addPropertySubtitle')} ${subCategoryName}`"
    @update:open="emit('update:modelValue', $event)"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <!-- Property Name -->
        <UFormField :label="t('common.name')" name="name" required>
          <UInput
            v-model="state.name"
            class="w-full"
            :placeholder="t('modal.subCategory.propertyNamePlaceholder')"
          />
        </UFormField>

        <!-- Type -->
        <UFormField name="dataType">
          <template #label>
            <div class="flex items-center gap-1">
              <span>Type<span class="text-red-500 ml-0.5">*</span></span>
              <UTooltip
                :text="t('modal.subCategory.typeHint')"
                :delay-duration="0"
              >
                <UIcon
                  name="i-lucide-info"
                  class="w-4 h-4 text-gray-500 cursor-pointer"
                />
              </UTooltip>
            </div>
          </template>

          <USelectMenu
            v-model="state.dataType"
            :items="[
              { label: t('modal.subCategory.string'), value: 'string' },
              { label: t('modal.subCategory.number'), value: 'number' }
            ]"
            value-key="value"
            label-key="label"
            :placeholder="t('modal.subCategory.selectType')"
            class="w-full"
          />
        </UFormField>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-2">
          <UButton
            :label="t('modal.subCategory.cancel')"
            color="neutral"
            variant="subtle"
            :disabled="saving"
            @click="emit('update:modelValue', false)"
          />

          <UButton
            :label="t('modal.subCategory.add')"
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
