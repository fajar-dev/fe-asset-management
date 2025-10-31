<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import { useSubCategory } from '~/composables/useSubCategory'
import { useRole } from '~/composables/useRole'
import AddPropertyModal from '~/components/subCategory/AddPropertyModal.vue'

// global components
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UBadge = resolveComponent('UBadge')

// state
const search = ref('')
const isDeleteModalOpen = ref(false)
const deletingSubCategoryId = ref<string | null>(null)
const isUpdateModalOpen = ref(false)
const isAddPropertyModalOpen = ref(false)
const editingSubCategoryId = ref<string | null>(null)
const AddPropertySubCategoryId = ref<string | null>(null)

const expanded = ref<Record<number | string, boolean>>({})

const isDeletePropertyModalOpen = ref(false)
const deletingProperty = ref<{ subCategoryId: string, propertyId: string } | null>(null)

const { subCategories, apiPagination, pagination, loading, fetchSubCategories, deleteSubCategory } = useSubCategory()
const { deleteProperty } = useProperty()
const { isAdmin } = useRole()

function loadSubCategories(page = pagination.value.pageIndex + 1) {
  fetchSubCategories(search.value, page, pagination.value.pageSize)
}

onMounted(() => loadSubCategories())
watch(search, () => loadSubCategories(1))

function handlePageChange(newPage: number) {
  loadSubCategories(newPage)
}

const showingFrom = computed(() =>
  apiPagination.value
    ? (apiPagination.value.currentPage - 1) * apiPagination.value.itemsPerPage + 1
    : 0
)

const showingTo = computed(() =>
  apiPagination.value
    ? Math.min(apiPagination.value.currentPage * apiPagination.value.itemsPerPage, apiPagination.value.totalItems)
    : 0
)

async function confirmDelete() {
  if (!deletingSubCategoryId.value) return
  await deleteSubCategory(deletingSubCategoryId.value)
  deletingSubCategoryId.value = null
  loadSubCategories()
  isDeleteModalOpen.value = false
}

function getRowItems(row: Row<any>) {
  return [
    { type: 'label', label: 'Actions' },
    {
      label: 'Add Property',
      icon: 'i-lucide-plus',
      onSelect: () => {
        AddPropertySubCategoryId.value = row.original.id
        isAddPropertyModalOpen.value = true
      }
    },
    {
      label: 'Edit',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        editingSubCategoryId.value = row.original.id
        isUpdateModalOpen.value = true
      }
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: () => {
        deletingSubCategoryId.value = row.original.id
        isDeleteModalOpen.value = true
      }
    }
  ]
}

async function confirmDeleteProperty() {
  if (!deletingProperty.value) return
  await deleteProperty(deletingProperty.value.subCategoryId, deletingProperty.value.propertyId)
  deletingProperty.value = null
  loadSubCategories()
  isDeletePropertyModalOpen.value = false
}

const columns: TableColumn<any>[] = [
  {
    id: 'expand',
    cell: ({ row }) =>
      h(UButton, {
        'color': 'neutral',
        'variant': 'ghost',
        'icon': 'i-lucide-chevron-right',
        'square': true,
        'aria-label': 'Expand',
        'ui': {
          leadingIcon: [
            'transition-transform',
            row.getIsExpanded() ? 'rotate-90 duration-200' : 'duration-200'
          ]
        },
        'onClick': () => row.toggleExpanded()
      })
  },
  {
    accessorKey: 'name',
    header: 'Name'
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => row.original.category?.name ?? '-'
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      if (!isAdmin.value) return null
      return h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          { content: { align: 'end' }, items: getRowItems(row) },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto'
            })
        )
      )
    }
  }
]
</script>

<template>
  <UDashboardPanel id="sub-categories">
    <!-- Header -->
    <template #header>
      <UDashboardNavbar title="Sub Categories">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <RoleWrapper role="admin">
            <SubCategoryAddModal @created="fetchSubCategories()" />
          </RoleWrapper>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <RoleWrapper role="admin">
        <!-- Delete Sub Category Modal -->
        <ConfirmModal
          v-model:open="isDeleteModalOpen"
          title="Delete Sub Category"
          description="Are you sure? This action cannot be undone."
          confirm-label="Delete"
          :on-confirm="confirmDelete"
        />

        <!-- Delete Property Modal -->
        <ConfirmModal
          v-model:open="isDeletePropertyModalOpen"
          title="Delete Property"
          description="Are you sure you want to delete this property? This action cannot be undone."
          confirm-label="Delete"
          :on-confirm="confirmDeleteProperty"
        />

        <!-- Update Sub Category Modal -->
        <SubCategoryUpdateModal
          v-if="editingSubCategoryId"
          :id="editingSubCategoryId"
          v-model="isUpdateModalOpen"
          @updated="fetchSubCategories()"
        />

        <AddPropertyModal
          v-if="AddPropertySubCategoryId"
          :id="AddPropertySubCategoryId"
          v-model="isAddPropertyModalOpen"
          @updated="fetchSubCategories()"
        />
      </RoleWrapper>

      <!-- Search -->
      <div class="flex flex-wrap items-center justify-between gap-1.5 mb-2">
        <UInput
          v-model="search"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search sub categories..."
        />
      </div>

      <!-- Table -->
      <UTable
        v-model:pagination="pagination"
        v-model:expanded="expanded"
        :data="subCategories"
        :columns="columns"
        :loading="loading"
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          tr: 'data-[expanded=true]:bg-elevated/30'
        }"
      >
        <template #expanded="{ row }">
          <div class="p-0">
            <div v-if="row.original.assetProperties && row.original.assetProperties.length">
              <table class="w-full text-sm border border-default rounded-lg overflow-hidden">
                <thead class="bg-elevated/50">
                  <tr>
                    <th class="px-3 py-2 text-left">
                      Property Name
                    </th>
                    <th class="px-3 py-2 text-left">
                      Type
                    </th>
                    <RoleWrapper role="admin">
                      <th class="px-3 py-2 text-right">
                        Actions
                      </th>
                    </RoleWrapper>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="prop in row.original.assetProperties"
                    :key="prop.id"
                    class="border-t border-default hover:bg-muted/30"
                  >
                    <td class="px-3 py-2">
                      {{ prop.name }}
                    </td>
                    <td class="px-3 py-2 capitalize">
                      <UBadge size="sm" variant="subtle" color="neutral">
                        {{ prop.dataType }}
                      </UBadge>
                    </td>
                    <RoleWrapper role="admin">
                      <td class="px-3 py-2 text-right">
                        <UButton
                          icon="i-lucide-trash"
                          color="error"
                          variant="subtle"
                          size="sm"
                          @click="() => {
                            deletingProperty = { subCategoryId: row.original.id, propertyId: prop.id }
                            isDeletePropertyModalOpen = true
                          }"
                        />
                      </td>
                    </RoleWrapper>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="text-sm text-muted italic">
              No properties for this sub category.
            </div>
          </div>
        </template>
      </UTable>

      <!-- Pagination -->
      <div
        class="flex flex-col md:flex-row items-center justify-center md:justify-between gap-3 border-t border-default pt-4 mt-auto"
      >
        <UPagination
          v-if="apiPagination"
          :default-page="pagination.pageIndex + 1"
          :items-per-page="pagination.pageSize"
          :total="apiPagination.totalItems"
          @update:page="handlePageChange"
        />

        <div v-if="apiPagination" class="text-sm text-muted mb-2">
          Showing {{ showingFrom }} to {{ showingTo }} of {{ apiPagination.totalItems }} results
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
