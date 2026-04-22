<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { useLocation } from '~/composables/useLocation'
import { useBranch } from '~/composables/useBranch'
import { locationSchema as schema, type LocationSchema as Schema } from '~/schemas/locationSchema'

const { t } = useI18n()

const emit = defineEmits<{ (e: 'created'): void }>()

const open = ref(false)
const saving = ref(false)
const items = ref<{ id: string, name: string }[]>([])

const state = reactive<Partial<Schema>>({
  name: '',
  branchId: ''
})

const { createLocation } = useLocation()
const { branches, fetchBranches } = useBranch()

function resetForm() {
  state.name = ''
  state.branchId = ''
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  await createLocation({
    name: event.data.name,
    branchId: event.data.branchId
  })
  resetForm()
  open.value = false
  emit('created')
  saving.value = false
}

async function openModal() {
  open.value = true
  await fetchBranches()
  items.value = branches.value.map(b => ({ id: b.branchId, name: b.branchId + ' - ' + b.name }))
}
</script>

<template>
  <div>
    <UButton
      :label="t('modal.location.addTitle')"
      icon="i-lucide-plus"
      @click="openModal"
    />

    <UModal v-model:open="open" :title="t('modal.location.addTitle')" :description="t('modal.location.addSubtitle')">
      <template #body>
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-4"
          @submit="onSubmit"
        >
          <UFormField :label="t('common.name')" name="name">
            <UInput v-model="state.name" class="w-full" :placeholder="t('modal.location.namePlaceholder')" />
          </UFormField>

          <UFormField :label="t('common.branch')" name="branchId">
            <UInputMenu
              v-model="state.branchId"
              class="w-full"
              value-key="id"
              label-key="name"
              :items="items"
              :placeholder="t('modal.location.selectBranch')"
            />
          </UFormField>

          <div class="flex justify-end gap-2">
            <UButton
              :label="t('modal.location.cancel')"
              color="neutral"
              variant="subtle"
              :disabled="saving"
              @click="open = false"
            />
            <UButton
              :label="t('modal.location.save')"
              color="primary"
              variant="solid"
              type="submit"
              :loading="saving"
            />
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
