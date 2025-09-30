<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useSubCategory } from '~/composables/useSubCategory'
import { useCategory } from '~/composables/useCategory'
import { useProperty } from '~/composables/useProperty'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  properties: z.array(
    z.object({
      name: z.string().min(1, 'Property name is required'),
      dataType: z.enum(['string', 'number'], { message: 'Type is required' })
    })
  )
})

type Schema = z.output<typeof schema>

const emit = defineEmits<{ (e: 'created'): void }>()
const open = ref(false)
const saving = ref(false)
const state = reactive<Partial<Schema>>({
  name: '',
  categoryId: undefined,
  properties: []
})

const { createSubCategory } = useSubCategory()
const { categories, getAllCategories } = useCategory()
const { createProperty } = useProperty()

const items = ref<{ id: string, name: string }[]>([])
const value = ref<string | undefined>(undefined)

watch(value, (v) => {
  state.categoryId = v
})

function resetForm() {
  state.name = ''
  state.categoryId = undefined
  value.value = undefined
  state.properties = []
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    saving.value = true
    const subCategory = await createSubCategory({
      name: event.data.name,
      categoryId: event.data.categoryId
    })
    if (event.data.properties.length > 0) {
      for (const property of event.data.properties) {
        await createProperty(subCategory.id, {
          name: property.name,
          dataType: property.dataType
        })
      }
    }
    resetForm()
    open.value = false
    emit('created')
  } catch (error) {
    console.error(error)
  } finally {
    saving.value = false
  }
}

async function openModal() {
  open.value = true
  await getAllCategories()
  items.value = categories.value.map(c => ({ id: c.id, name: c.name }))
}

function addProperty() {
  state.properties?.push({ name: '', dataType: 'string' })
}

function removeProperty(index: number) {
  state.properties?.splice(index, 1)
}
</script>

<template>
  <UButton label="New Sub Category" icon="i-lucide-plus" @click="openModal" />

  <UModal v-model:open="open" title="New Sub Category" description="Add a new sub category">
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name">
          <UInput v-model="state.name" class="w-full" placeholder="Sub Category name" />
        </UFormField>

        <UFormField label="Category" name="categoryId">
          <UInputMenu
            v-model="value"
            class="w-full"
            value-key="id"
            label-key="name"
            :items="items"
            placeholder="Select category"
          />
        </UFormField>

        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <label class="text-sm font-medium">Properties</label>
            <UButton
              label="Add Property"
              icon="i-lucide-plus"
              size="xs"
              @click="addProperty"
            />
          </div>

          <div v-for="(prop, i) in state.properties" :key="i" class="flex gap-3 py-1 items-start">
            <UFormField :name="`properties.${i}.name`" class="flex-1">
              <UInput v-model="prop.name" placeholder="Property name" class="w-full" />
            </UFormField>

            <UFormField :name="`properties.${i}.dataType`" class="w-30">
              <USelectMenu
                v-model="prop.dataType"
                :items="[
                  { label: 'String', value: 'string' },
                  { label: 'Number', value: 'number' }
                ]"
                value-key="value"
                label-key="label"
                placeholder="Select type"
                class="w-full"
              />
            </UFormField>

            <UButton
              icon="i-lucide-x"
              color="error"
              variant="subtle"
              class="mt-1"
              size="xs"
              @click="removeProperty(i)"
            />
          </div>
        </div>

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
