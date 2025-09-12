<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { reactive, ref, watch } from 'vue'
import { useLocation } from '~/composables/useLocation'

const props = defineProps<{
  id: string | null
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'updated'): void
  (e: 'update:open', value: boolean): void
}>()

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  branch: z.string().min(1, 'Branch is required')
})
type Schema = z.output<typeof schema>

const formData = reactive<Schema>({
  name: '',
  branch: ''
})

const saving = ref(false)
const loading = ref(false)

const { getLocationById, updateLocation } = useLocation()

async function loadLocationData() {
  if (!props.id) return

  loading.value = true
  try {
    const response = await getLocationById(props.id)
    if (response?.data) {
      Object.assign(formData, {
        name: response.data.name,
        branch: response.data.branch
      })
    }
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
    branch: ''
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
    title="Edit Location"
    description="Update location details"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="formData"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name" required>
          <UInput
            v-model="formData.name"
            class="w-full"
            placeholder="Location name"
          />
        </UFormField>

        <UFormField label="Branch" name="branch" required>
          <UInput
            v-model="formData.branch"
            class="w-full"
            placeholder="Branch name"
          />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            :disabled="saving"
            @click="emit('update:open', false)"
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
