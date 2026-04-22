<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { useCategory } from '~/composables/useCategory'
import { categorySchema as schema, type CategorySchema as Schema } from '~/schemas/categorySchema'

const { t } = useI18n()

const props = defineProps<{
  id: string | null
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'updated'): void
  (e: 'update:open', value: boolean): void
}>()

const formData = reactive<Schema>({
  name: '',
  hasLocation: false,
  hasMaintenance: false,
  hasHolder: false
})

const saving = ref(false)
const loading = ref(false)

const { getCategoryById, updateCategory } = useCategory()

async function loadCategoryData() {
  if (!props.id) return

  loading.value = true
  try {
    const response = await getCategoryById(props.id)
    if (response?.data) {
      Object.assign(formData, {
        name: response.data.name,
        hasLocation: response.data.hasLocation,
        hasMaintenance: response.data.hasMaintenance,
        hasHolder: response.data.hasHolder
      })
    }
  } catch (error) {
    console.error('Failed to load category:', error)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && props.id) {
      await loadCategoryData()
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

function resetForm() {
  Object.assign(formData, {
    name: '',
    hasLocation: false,
    hasMaintenance: false,
    hasHolder: false
  })
}

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  if (!props.id) return

  saving.value = true
  await updateCategory(props.id, { ...formData })
  emit('updated')
  emit('update:open', false)
  resetForm()
  saving.value = false
}
</script>

<template>
  <UModal
    :open="props.open"
    :title="t('modal.category.editTitle')"
    :description="t('modal.category.editSubtitle')"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="formData"
        class="space-y-4"
        @submit="onSubmit"
      >
        <!-- Name -->
        <UFormField :label="t('common.name')" name="name" required>
          <UInput
            v-model="formData.name"
            class="w-full"
            :placeholder="t('modal.category.namePlaceholder')"
          />
        </UFormField>

        <!-- Has Location -->
        <UFormField name="hasLocation">
          <div class="flex items-center gap-2">
            <USwitch v-model="formData.hasLocation" :label="t('modal.category.hasLocation')" />
            <UTooltip :text="t('modal.category.hasLocationHint')" :delay-duration="0">
              <UIcon name="i-lucide-info" class="w-4 h-4 text-gray-500 cursor-pointer" />
            </UTooltip>
          </div>
        </UFormField>

        <!-- Has Maintenance -->
        <UFormField name="hasMaintenance">
          <div class="flex items-center gap-2">
            <USwitch v-model="formData.hasMaintenance" :label="t('modal.category.hasMaintenance')" />
            <UTooltip :text="t('modal.category.hasMaintenanceHint')" :delay-duration="0">
              <UIcon name="i-lucide-info" class="w-4 h-4 text-gray-500 cursor-pointer" />
            </UTooltip>
          </div>
        </UFormField>

        <!-- Has Holder -->
        <UFormField name="hasHolder">
          <div class="flex items-center gap-2">
            <USwitch v-model="formData.hasHolder" :label="t('modal.category.hasHolder')" />
            <UTooltip :text="t('modal.category.hasHolderHint')" :delay-duration="0">
              <UIcon name="i-lucide-info" class="w-4 h-4 text-gray-500 cursor-pointer" />
            </UTooltip>
          </div>
        </UFormField>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-2">
          <UButton
            :label="t('modal.category.cancel')"
            color="neutral"
            variant="subtle"
            :disabled="saving"
            @click="emit('update:open', false)"
          />
          <UButton
            :label="t('modal.category.save')"
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
