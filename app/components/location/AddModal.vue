<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useLocation } from '~/composables/useLocation'
import { useBranch } from '~/composables/useBranch'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  branchId: z.string().min(1, 'Branch is required')
})

type Schema = z.output<typeof schema>

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
      label="New Location"
      icon="i-lucide-plus"
      @click="openModal"
    />

    <UModal v-model:open="open" title="New Location" description="Add a new location">
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

          <UFormField label="Branch" name="branchId">
            <UInputMenu
              v-model="state.branchId"
              class="w-full"
              value-key="id"
              label-key="name"
              :items="items"
              placeholder="Select branch"
            />
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
  </div>
</template>
