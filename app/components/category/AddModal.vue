<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { useCategory } from '~/composables/useCategory'
import { categorySchema as schema, type CategorySchema as Schema } from '~/schemas/categorySchema'

const { t } = useI18n()

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
  <UModal v-model:open="open" :title="t('modal.category.addTitle')" :description="t('modal.category.addSubtitle')">
    <UButton :label="t('modal.category.addTitle')" icon="i-lucide-plus" />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <!-- Name -->
        <UFormField :label="t('common.name')" name="name" required>
          <UInput v-model="state.name" class="w-full" :placeholder="t('modal.category.namePlaceholder')" />
        </UFormField>

        <!-- Has Location -->
        <UFormField name="hasLocation">
          <div class="flex items-center gap-2">
            <USwitch v-model="state.hasLocation" :label="t('modal.category.hasLocation')" />
            <UTooltip :text="t('modal.category.hasLocationHint')" :delay-duration="0">
              <UIcon name="i-lucide-info" class="w-4 h-4 text-gray-500 cursor-pointer" />
            </UTooltip>
          </div>
        </UFormField>

        <!-- Has Maintenance -->
        <UFormField name="hasMaintenance">
          <div class="flex items-center gap-2">
            <USwitch v-model="state.hasMaintenance" :label="t('modal.category.hasMaintenance')" />
            <UTooltip :text="t('modal.category.hasMaintenanceHint')" :delay-duration="0">
              <UIcon name="i-lucide-info" class="w-4 h-4 text-gray-500 cursor-pointer" />
            </UTooltip>
          </div>
        </UFormField>

        <!-- Has Holder -->
        <UFormField name="hasHolder">
          <div class="flex items-center gap-2">
            <USwitch v-model="state.hasHolder" :label="t('modal.category.hasHolder')" />
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
            @click="open = false"
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
