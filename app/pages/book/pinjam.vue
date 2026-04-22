<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { bookService } from '~/services/BookService'
import type { BookData } from '~/types/book'
import { nextTick } from 'vue'

definePageMeta({
  layout: 'book',
})

useSeoMeta({
  title: 'Pinjam Buku',
  description: 'Form pengajuan peminjaman buku'
})

const route = useRoute()
const normalizePath = (path?: string) => {
  if (!path) return '/'
  const normalized = path.replace(/\/+$/, '')
  return normalized || '/'
}

const isTabActive = (to: string) => {
  return normalizePath(route.path) === normalizePath(to)
}
const { t } = useI18n()
const tabs = computed(() => [
  { label: t('page.book.borrow'), to: '/book/pinjam', icon: 'i-lucide-book-open' },
  { label: t('page.book.return'), to: '/book/kembalikan', icon: 'i-lucide-book-check' },
])

const toast = useToast()
const loading = ref(false)
const lookupLoading = ref(false)
const barcodeScannerRef = ref<any>(null)
const formRef = ref<any>(null)
const bookData = ref<BookData | null>(null)

// Camera state
const videoRef = ref<HTMLVideoElement | null>(null)
const isCameraOpen = ref(false)
const capturedImage = ref<string | null>(null)
const photoFile = ref<File | null>(null)
const stream = ref<MediaStream | null>(null)
const cameraError = ref('')

async function startCamera() {
  cameraError.value = ''
  isCameraOpen.value = true
  capturedImage.value = null
  photoFile.value = null

  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    })
    stream.value = mediaStream
    await nextTick()
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
    }
  } catch {
    cameraError.value = t('page.book.cameraError')
    isCameraOpen.value = false
  }
}

function stopCamera() {
  stream.value?.getTracks().forEach(t => t.stop())
  stream.value = null
  isCameraOpen.value = false
}

function takePhoto() {
  if (!videoRef.value) return
  const canvas = document.createElement('canvas')
  canvas.width = videoRef.value.videoWidth
  canvas.height = videoRef.value.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.drawImage(videoRef.value, 0, 0)
  capturedImage.value = canvas.toDataURL('image/jpeg')
  canvas.toBlob((blob) => {
    if (blob) {
      photoFile.value = new File([blob], `loan-${Date.now()}.jpg`, { type: 'image/jpeg' })
    }
  }, 'image/jpeg', 0.9)
  stopCamera()
}

function retakePhoto() {
  capturedImage.value = null
  photoFile.value = null
  startCamera()
}

// ─── Book lookup ──────────────────────────────────────────────────────────────
const schema = z.object({
  serialNumber: z.string().min(1, 'Serial number wajib diisi'),
  judulBuku: z.string().min(1, 'Judul buku wajib diisi'),
  category: z.string().min(1, 'Kategori wajib dipilih'),
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  serialNumber: undefined,
  judulBuku: undefined,
  category: undefined,
})

async function lookupBySerial(code: string) {
  if (!code?.trim()) return
  lookupLoading.value = true
  state.judulBuku = undefined
  state.category = undefined
  bookData.value = null

  // Clear serialNumber error since we have a value
  nextTick(() => formRef.value?.clear('serialNumber'))

  try {
    const res = await bookService.getBookByCode(code.trim())
    bookData.value = res.data
    state.judulBuku = res.data.name
    state.category = res.data.subCategory.name

    // Clear validation errors for auto-filled fields
    nextTick(() => {
      formRef.value?.clear('judulBuku')
      formRef.value?.clear('category')
    })
  } catch (err: any) {
    toast.add({
      title: 'Gagal',
      description: err.data?.message,
      color: 'error'
    })
  } finally {
    lookupLoading.value = false
  }
}

function onScanned(code: string) {
  state.serialNumber = code
  lookupBySerial(code)
}

function resetBook() {
  state.serialNumber = undefined
  state.judulBuku = undefined
  state.category = undefined
  bookData.value = null
  formRef.value?.clear()
}

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  if (!photoFile.value) {
    toast.add({ title: t('page.book.photoRequired'), description: t('page.book.takeBorrowPhoto'), color: 'error' })
    return
  }
  if (!bookData.value?.id) {
    toast.add({ title: t('page.book.incompleteData'), description: t('page.book.scanAgain'), color: 'error' })
    return
  }

  loading.value = true
  try {
    await bookService.assignLoan(bookData.value.id, photoFile.value)

    toast.add({
      title: t('page.book.borrowSuccess'),
      description: `"${bookData.value.name}" ${t('page.book.borrowSuccessMessage')}`,
      color: 'success'
    })

    resetBook()
    capturedImage.value = null
    photoFile.value = null
    isCameraOpen.value = false
  } catch (err: any) {
    toast.add({
      title: t('page.book.borrowFailed'),
      description: err.data?.message || t('page.book.borrowFailedMessage'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

onUnmounted(() => stopCamera())
</script>

<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
        <UIcon name="i-lucide-library" class="w-5 h-5 text-primary" />
      </div>
      <div>
        <h1 class="text-base font-semibold text-highlighted">{{ t('page.book.title') }}</h1>
        <p class="text-xs text-muted">{{ t('page.book.subtitle') }}</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex rounded-lg border border-default overflow-hidden">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors"
        :class="isTabActive(tab.to)
          ? 'bg-primary text-white'
          : 'text-muted hover:text-highlighted hover:bg-elevated'"
>
        <UIcon :name="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </NuxtLink>
    </div>

    <!-- Form Pinjam -->
    <UForm
      ref="formRef"
      :schema="schema"
      :state="state"
      class="space-y-4"
      @submit="onSubmit"
    >
      <!-- Serial Number + Scan Button -->
      <UFormField :label="t('page.book.serialNumber')" name="serialNumber" required>
        <div class="flex gap-2">
          <UInput
            v-model="state.serialNumber"
            :placeholder="t('page.book.serialNumberPlaceholder')"
            icon="i-lucide-hash"
            class="flex-1"
            :loading="lookupLoading"
            :disabled="lookupLoading"
            @keyup.enter="lookupBySerial(state.serialNumber!)"
          />
          <template v-if="bookData">
            <UButton
              type="button"
              variant="outline"
              color="error"
              icon="i-lucide-x"
              class="shrink-0"
              :title="t('page.book.reset')"
              @click="resetBook"
            />
          </template>
          <template v-else>
            <UButton
              v-if="state.serialNumber"
              type="button"
              variant="soft"
              color="primary"
              icon="i-lucide-search"
              class="shrink-0"
              :title="t('page.book.searchBook')"
              :loading="lookupLoading"
              :disabled="lookupLoading"
              @click="lookupBySerial(state.serialNumber!)"
            />
            <UButton
              type="button"
              variant="soft"
              color="neutral"
              icon="i-lucide-scan-barcode"
              class="shrink-0"
              :title="t('page.book.scanBarcode')"
              :disabled="lookupLoading"
              @click="barcodeScannerRef?.openModal()"
            />
          </template>
        </div>
      </UFormField>

      <!-- Judul Buku (disabled, auto-filled) -->
      <UFormField :label="t('page.book.bookTitle')" name="judulBuku" required>
        <UInput
          v-model="state.judulBuku"
          :placeholder="t('page.book.bookTitlePlaceholder')"
          icon="i-lucide-book"
          class="w-full"
          disabled
        />
      </UFormField>

      <!-- Kategori (disabled, auto-filled) -->
      <UFormField :label="t('page.book.category')" name="category" required>
        <UInput
          v-model="state.category"
          :placeholder="t('page.book.bookTitlePlaceholder')"
          icon="i-lucide-tag"
          class="w-full"
          disabled
        />
      </UFormField>

      <!-- Foto Peminjaman -->
      <UFormField :label="t('page.book.borrowPhoto')" name="image" required>
        <div class="space-y-2">
          <!-- Live Camera Preview -->
          <div v-if="isCameraOpen" class="relative bg-black rounded-lg overflow-hidden aspect-[4/3]">
            <video
              ref="videoRef"
              autoplay
              playsinline
              muted
              class="w-full h-full object-cover"
            />
            <div class="absolute bottom-4 inset-x-0 flex justify-center">
              <button
                type="button"
                class="w-16 h-16 rounded-full bg-white border-4 border-gray-300 shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                @click="takePhoto"
              >
                <span class="w-11 h-11 rounded-full border-2 border-gray-400 bg-white block" />
              </button>
            </div>
          </div>

          <!-- Captured Photo Preview -->
          <div v-else-if="capturedImage" class="relative rounded-lg overflow-hidden aspect-[4/3] border border-default">
            <img :src="capturedImage" class="w-full h-full object-cover" alt="Foto peminjaman">
            <div class="absolute top-2 right-2">
              <UButton
                icon="i-lucide-refresh-cw"
                :label="t('page.book.retake')"
                size="xs"
                color="neutral"
                variant="soft"
                @click="retakePhoto"
              />
            </div>
          </div>

          <!-- Start Camera Button -->
          <div
            v-else
            class="flex flex-col items-center justify-center border-2 border-dashed border-default rounded-lg p-8"
          >
            <UIcon name="i-lucide-camera" class="w-10 h-10 text-muted mb-3" />
            <p class="text-sm text-muted mb-4 text-center">{{ t('page.book.borrowPhotoSubtitle') }}</p>
            <UButton
              :label="t('page.book.openCamera')"
              icon="i-lucide-camera"
              color="neutral"
              variant="outline"
              type="button"
              @click="startCamera"
            />
            <p v-if="cameraError" class="text-xs text-red-500 mt-2 text-center">
              {{ cameraError }}
            </p>
          </div>
        </div>
      </UFormField>

      <UButton
        type="submit"
        class="w-full justify-center"
        :loading="loading"
        :disabled="!bookData"
        icon="i-lucide-book-open"
      >
        {{ t('page.book.borrowBook') }}
      </UButton>
    </UForm>
  </div>

  <!-- Barcode Scanner Modal -->
  <BookBarcodeScanner
    ref="barcodeScannerRef"
    @scanned="onScanned"
  />
</template>
