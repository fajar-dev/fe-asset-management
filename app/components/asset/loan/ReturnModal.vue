<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { useUserAsset } from '~/composables/useUserAsset'
import { returnLoanSchema as schema, type ReturnLoanSchema as Schema } from '~/schemas/loanSchema'

const props = defineProps<{
  assetUuid: string
  loanId: string
}>()

const emit = defineEmits<{ (e: 'returned'): void }>()


const { t } = useI18n()
const open = ref(false)
const saving = ref(false)
const state = reactive({
  image: undefined as File | undefined
})

// Camera state
const videoRef = ref<HTMLVideoElement | null>(null)
const isCameraOpen = ref(false)
const capturedImage = ref<string | null>(null)
const stream = ref<MediaStream | null>(null)
const cameraError = ref('')

const { returnAsset } = useUserAsset()

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
  state.image = undefined
  capturedImage.value = null
  stopCamera()
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    await returnAsset(props.assetUuid, props.loanId, {
      image: event.data.image
    })
    resetForm()
    open.value = false
    emit('returned')
  } catch (error: any) {
    // Error handled by composable/service
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
    :title="t('modal.asset.loan.returnTitle')"
    :description="t('modal.asset.loan.returnSubtitle')"
    :prevent-close="saving"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField :label="t('modal.asset.loan.photo')" name="image" required>
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
                  :label="t('modal.asset.loan.retake')"
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
              <p class="text-sm text-muted mb-4 text-center">{{ t('modal.asset.loan.photoHint') }}</p>
              <UButton
                :label="t('modal.asset.loan.openCamera')"
                icon="i-lucide-camera"
                color="neutral"
                variant="outline"
                @click="startCamera"
              />
              <p v-if="cameraError" class="text-xs text-red-500 mt-2">{{ t('modal.asset.loan.cameraError') }}</p>
            </div>
          </div>
        </UFormField>

        <div class="flex justify-end gap-2 mt-6">
          <UButton
            :label="t('modal.asset.loan.cancel')"
            color="neutral"
            variant="subtle"
            :disabled="saving"
            @click="open = false"
          />
          <UButton
            :label="t('modal.asset.loan.submit')"
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
