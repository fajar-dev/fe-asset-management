<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { reactive, ref, watch } from 'vue'
import { useLocation } from '~/composables/useLocation'
import { useBranch } from '~/composables/useBranch'
import { locationSchema as schema, type LocationSchema as Schema } from '~/schemas/locationSchema'

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
  branchId: ''
})

const saving = ref(false)
const loading = ref(false)
const items = ref<{ id: string, name: string }[]>([])

const { getLocationById, updateLocation } = useLocation()
const { branches, fetchBranches } = useBranch()

async function loadLocationData() {
  if (!props.id) return

  loading.value = true
  try {
    // load detail lokasi
    const response = await getLocationById(props.id)
    if (response?.data) {
      Object.assign(formData, {
        name: response.data.name,
        branchId: response.data.branch.branchId
      })
    }
    // load daftar branch
    await fetchBranches()
    items.value = branches.value.map(b => ({
      id: b.branchId,
      name: `${b.branchId} - ${b.name}`
    }))
  } catch (error) {
    console.error('Failed to load location:', error)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && props.id) {
      await loadLocationData()
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

/** Reset form */
function resetForm() {
  Object.assign(formData, {
    name: '',
    branchId: ''
  })
}

/** Submit */
async function onSubmit(_event: FormSubmitEvent<Schema>) {
  if (!props.id) return

  saving.value = true
  try {
    await updateLocation(props.id, { ...formData })
    emit('updated')
    emit('update:open', false)
    resetForm()
  } catch (error) {
    console.error('Failed to update location:', error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    :open="props.open"
    :title="t('modal.location.editTitle')"
    :description="t('modal.location.editSubtitle')"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="formData"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField :label="t('common.name')" name="name" required>
          <UInput
            v-model="formData.name"
            class="w-full"
            :placeholder="t('modal.location.namePlaceholder')"
          />
        </UFormField>

        <UFormField :label="t('common.branch')" name="branchId" required>
          <UInputMenu
            v-model="formData.branchId"
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
            @click="emit('update:open', false)"
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
</template>
