<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAssetHolder } from '~/composables/useAssetHolder'

const props = defineProps<{
  assetId: string
}>()

const emit = defineEmits<{ (e: 'requested'): void }>()

// validation schema
const schema = z.object({
  purpose: z.string().min(1, 'Purpose is required'),
  image: z.custom<File>((val) => val instanceof File, 'Photo is required')
})

type Schema = z.output<typeof schema>

const open = ref(false)
const saving = ref(false)
const state = reactive({
  purpose: '',
  image: undefined as File | undefined
})

// Camera state
const videoRef = ref<HTMLVideoElement | null>(null)
const isCameraOpen = ref(false)
const capturedImage = ref<string | null>(null)
const stream = ref<MediaStream | null>(null)
const cameraError = ref('')

const { requestAsset } = useAssetHolder()

async function startCamera() {
  cameraError.value = ''
  isCameraOpen.value = true
  capturedImage.value = null
  state.image = undefined
  
  try {
    const constraints = {
      video: { facingMode: 'environment' }
    }
    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
    stream.value = mediaStream
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
    }
  } catch (err: any) {
    cameraError.value = 'Could not access camera. Please ensure you have given permission.'
    isCameraOpen.value = false
  }
}

function stopCamera() {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
    stream.value = null
  }
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
  
  const dataUrl = canvas.toDataURL('image/jpeg')
  capturedImage.value = dataUrl
  
  canvas.toBlob((blob) => {
    if (blob) {
      state.image = new File([blob], `request-${Date.now()}.jpg`, { type: 'image/jpeg' })
    }
  }, 'image/jpeg', 0.8)

  stopCamera()
}

function retakePhoto() {
  capturedImage.value = null
  state.image = undefined
  startCamera()
}

function resetForm() {
  state.purpose = ''
  state.image = undefined
  capturedImage.value = null
  stopCamera()
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    await requestAsset(props.assetId, {
      purpose: event.data.purpose,
      image: event.data.image
    })
    resetForm()
    open.value = false
    emit('requested')
  } finally {
    saving.value = false
  }
}

watch(open, (newVal) => {
  if (!newVal) {
    stopCamera()
  }
})

onUnmounted(() => {
  stopCamera()
})

defineExpose({
  openModal: () => { open.value = true }
})
</script>

<template>
  <UModal
    v-model:open="open"
    title="Request Asset Loan"
    description="Fill in the details to request asset loan"
    :prevent-close="saving"
  >
    <slot />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Purpose" name="purpose" required>
          <UTextarea
            v-model="state.purpose"
            placeholder="e.g. For maintenance work in Building A"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Photo" name="image" required>
          <div class="space-y-4">
            <!-- Camera Preview -->
            <div v-if="isCameraOpen" class="relative bg-black rounded-lg overflow-hidden aspect-[4/3]">
              <video
                ref="videoRef"
                autoplay
                playsinline
                class="w-full h-full object-cover"
              />
              <div class="absolute bottom-4 inset-x-0 flex justify-center">
                <UButton
                  icon="i-lucide-camera"
                  size="xl"
                  color="neutral"
                  variant="solid"
                  class="rounded-full h-14 w-14 p-0 flex items-center justify-center shadow-lg"
                  @click="takePhoto"
                />
              </div>
            </div>

            <!-- Captured Preview -->
            <div v-else-if="capturedImage" class="relative rounded-lg overflow-hidden aspect-[4/3] border border-default">
              <img :src="capturedImage" class="w-full h-full object-cover" />
              <div class="absolute top-2 right-2">
                <UButton
                  icon="i-lucide-refresh-cw"
                  label="Retake"
                  size="xs"
                  color="neutral"
                  variant="soft"
                  @click="retakePhoto"
                />
              </div>
            </div>

            <!-- Start Camera Button -->
            <div v-else class="flex flex-col items-center justify-center border-2 border-dashed border-default rounded-lg p-8 bg-muted/50">
              <UIcon name="i-lucide-camera" class="w-10 h-10 text-muted mb-3" />
              <p class="text-sm text-muted mb-4 text-center">Take a photo of the asset to proceed</p>
              <UButton
                label="Open Camera"
                icon="i-lucide-camera"
                color="neutral"
                variant="outline"
                @click="startCamera"
              />
              <p v-if="cameraError" class="text-xs text-red-500 mt-2">{{ cameraError }}</p>
            </div>
          </div>
        </UFormField>

        <div class="flex justify-end gap-2 mt-6">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            :disabled="saving"
            @click="open = false"
          />
          <UButton
            label="Submit"
            color="primary"
            variant="solid"
            type="submit"
            :loading="saving"
            :disabled="!state.image"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
