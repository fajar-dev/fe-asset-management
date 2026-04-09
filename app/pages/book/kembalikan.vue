<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { bookService } from '~/services/BookService'
import type { LoanData } from '~/types/book'

definePageMeta({
  layout: 'book',
})

useSeoMeta({
  title: 'Kembalikan Buku',
  description: 'Form pengembalian buku'
})

const route = useRoute()
const toast = useToast()
const tabs = [
  { label: 'Pinjam', to: '/book/pinjam', icon: 'i-lucide-book-open' },
  { label: 'Kembalikan', to: '/book/kembalikan', icon: 'i-lucide-book-check' },
]

const loading = ref(false)
const loansLoading = ref(false)
const userLoans = ref<LoanData[]>([])

// ─── Camera state ─────────────────────────────────────────────────────────────
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
      photoFile.value = new File([blob], `return-${Date.now()}.jpg`, { type: 'image/jpeg' })
    }
  }, 'image/jpeg', 0.9)
  stopCamera()
}

function retakePhoto() {
  capturedImage.value = null
  photoFile.value = null
  startCamera()
}

// ─── Form state ───────────────────────────────────────────────────────────────
const schema = z.object({
  assetHolderId: z.string().min(1, 'Pilih buku yang akan dikembalikan'),
  purpose: z.string().min(1, 'Link Goodreads wajib diisi'),
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  assetHolderId: undefined,
  purpose: undefined,
})

async function fetchUserLoans() {
  loansLoading.value = true
  try {
    const res = await bookService.getUserLoans()
    userLoans.value = res.data
  } catch (err) {
    console.error('Failed to fetch loans:', err)
  } finally {
    loansLoading.value = false
  }
}

const loanOptions = computed(() => {
  return userLoans.value.map(loan => ({
    label: `${loan.asset.name} (${loan.asset.code})`,
    value: loan.id
  }))
})

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  if (!photoFile.value) {
    toast.add({ title: 'Foto wajib diisi', description: 'Ambil foto pengembalian terlebih dahulu sebagai bukti', color: 'error' })
    return
  }
  loading.value = true
  try {
    await bookService.returnLoan(state.assetHolderId!, state.purpose!, photoFile.value)
    
    toast.add({
      title: 'Pengembalian Berhasil',
      description: 'Buku telah berhasil dikembalikan ke perpustakaan.',
      color: 'success'
    })

    // Reset form
    state.assetHolderId = undefined
    state.purpose = undefined
    capturedImage.value = null
    photoFile.value = null
    await fetchUserLoans() // Refresh loans
  } catch (err: any) {
    toast.add({
      title: 'Gagal Mengembalikan',
      description: err.data?.message || 'Terjadi kesalahan saat memproses pengembalian.',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUserLoans()
})

onUnmounted(() => {
  stopCamera()
})
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

    <!-- Form Kembalikan -->
    <UForm
      :schema="schema"
      :state="state"
      class="space-y-4"
      @submit="onSubmit"
    >
      <UFormField label="Pilih Buku" name="assetHolderId" required>
        <USelect
          v-model="state.assetHolderId"
          :items="loanOptions"
          :loading="loansLoading"
          placeholder="Pilih buku yang sedang Anda pinjam"
          icon="i-lucide-book"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Link Goodreads" name="purpose" required>
        <UTextarea
          v-model="state.purpose"
          placeholder="Tempel link buku di Goodreads"
          class="w-full"
          :rows="4"
        />
      </UFormField>

      <!-- Foto Pengembalian -->
      <UFormField label="Foto Pengembalian" name="image" required>
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
            <img :src="capturedImage" class="w-full h-full object-cover" alt="Foto pengembalian">
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
            <p class="text-sm text-muted mb-4 text-center">Ambil foto buku yang dikembalikan</p>
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
        color="success"
        class="w-full justify-center"
        :loading="loading"
        icon="i-lucide-book-check"
      >
        Kembalikan Buku
      </UButton>
    </UForm>
  </div>
</template>
