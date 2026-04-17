<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { bookService } from '~/services/BookService'
import type { BookData } from '~/types/book'

definePageMeta({
  layout: 'book',
})

useSeoMeta({
  title: 'Pinjam Buku',
  description: 'Form pengajuan peminjaman buku'
})

const route = useRoute()
const tabs = [
  { label: 'Pinjam', to: '/book/pinjam', icon: 'i-lucide-book-open' },
  { label: 'Kembalikan', to: '/book/kembalikan', icon: 'i-lucide-book-check' },
]

const toast = useToast()
const loading = ref(false)
const lookupLoading = ref(false)
const barcodeScannerRef = ref<any>(null)
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
    cameraError.value = 'Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.'
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

  try {
    const res = await bookService.getBookByCode(code.trim())
    bookData.value = res.data
    state.judulBuku = res.data.name
    state.category = res.data.subCategory.name
  } catch {
    toast.add({
      title: 'Buku tidak ditemukan',
      description: `Tidak ada buku dengan kode "${code}"`,
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
}

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  if (!photoFile.value) {
    toast.add({ title: 'Foto wajib diisi', description: 'Ambil foto peminjaman terlebih dahulu', color: 'error' })
    return
  }
  if (!bookData.value?.id) {
    toast.add({ title: 'Data buku tidak lengkap', description: 'Silakan scan ulang buku', color: 'error' })
    return
  }

  loading.value = true
  try {
    await bookService.assignLoan(bookData.value.id, photoFile.value)
    
    toast.add({
      title: 'Peminjaman Berhasil',
      description: `Buku "${bookData.value.name}" berhasil dipinjam.`,
      color: 'success'
    })

    // Reset form
    resetBook()
    capturedImage.value = null
    photoFile.value = null
    isCameraOpen.value = false
  } catch (err: any) {
    toast.add({
      title: 'Gagal Meminjam',
      description: err.data?.message || 'Terjadi kesalahan saat memproses peminjaman.',
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
        <h1 class="text-base font-semibold text-highlighted">Form Baca Buku</h1>
        <p class="text-xs text-muted">Peminjaman &amp; pengembalian buku</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex rounded-lg border border-default overflow-hidden">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors"
        :class="route.path === tab.to
          ? 'bg-primary text-white pointer-events-none'
          : 'text-muted hover:text-highlighted hover:bg-elevated'"
      >
        <UIcon :name="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </NuxtLink>
    </div>

    <!-- Form Pinjam -->
    <UForm
      :schema="schema"
      :state="state"
      class="space-y-4"
      @submit="onSubmit"
    >
      <!-- Serial Number + Scan Button -->
      <UFormField label="Serial Number" name="serialNumber" required>
        <div class="flex gap-2">
          <UInput
            v-model="state.serialNumber"
            placeholder="Ketik atau scan serial number"
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
              title="Reset"
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
              title="Cari Buku"
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
              title="Scan Barcode"
              :disabled="lookupLoading"
              @click="barcodeScannerRef?.openModal()"
            />
          </template>
        </div>
      </UFormField>

      <!-- Judul Buku (disabled, auto-filled) -->
      <UFormField label="Judul Buku" name="judulBuku" required>
        <UInput
          v-model="state.judulBuku"
          placeholder="Otomatis terisi setelah scan"
          icon="i-lucide-book"
          class="w-full"
          disabled
        />
      </UFormField>

      <!-- Kategori (disabled, auto-filled) -->
      <UFormField label="Kategori" name="category" required>
        <UInput
          v-model="state.category"
          placeholder="Otomatis terisi setelah scan"
          icon="i-lucide-tag"
          class="w-full"
          disabled
        />
      </UFormField>

      <!-- Foto Peminjaman -->
      <UFormField label="Foto Peminjaman" name="image" required>
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
                label="Ulang"
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
            <p class="text-sm text-muted mb-4 text-center">Ambil foto sebagai bukti peminjaman</p>
            <UButton
              label="Buka Kamera"
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
        :disabled="!bookData || !bookData.isLendable"
        icon="i-lucide-book-open"
      >
        Pinjam Buku
      </UButton>
    </UForm>
  </div>

  <!-- Barcode Scanner Modal -->
  <BookBarcodeScanner
    ref="barcodeScannerRef"
    @scanned="onScanned"
  />
</template>
